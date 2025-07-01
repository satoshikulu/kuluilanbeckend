const { supabase } = require('../supabase');

/**
 * Supabase JWT token'ını doğrular ve kullanıcı bilgilerini req.user'a ekler
 * @param {Object} req - Express request objesi
 * @param {Object} res - Express response objesi
 * @param {Function} next - Express next fonksiyonu
 */
async function authenticateUser(req, res, next) {
  try {
    // Authorization header'dan Bearer token'ı al
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authorization header gerekli. Format: Bearer <token>' 
      });
    }

    // Bearer token'ı çıkar
    const token = authHeader.substring(7); // "Bearer " kısmını çıkar

    // Token'ı doğrula ve kullanıcı bilgilerini al
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token doğrulama hatası:', error?.message);
      return res.status(401).json({ 
        error: 'Geçersiz veya süresi dolmuş token' 
      });
    }

    // Kullanıcı bilgilerini request objesine ekle
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      aud: user.aud,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata
    };

    console.log(`✅ Kullanıcı doğrulandı: ${user.email} (ID: ${user.id})`);
    next();

  } catch (error) {
    console.error('Auth middleware hatası:', error);
    return res.status(500).json({ 
      error: 'Kimlik doğrulama hatası' 
    });
  }
}

/**
 * Opsiyonel auth middleware - kullanıcı varsa req.user'a ekler, yoksa devam eder
 * @param {Object} req - Express request objesi
 * @param {Object} res - Express response objesi
 * @param {Function} next - Express next fonksiyonu
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Token yoksa devam et, ama req.user'ı undefined bırak
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        aud: user.aud,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata
      };
      console.log(`✅ Opsiyonel auth: ${user.email} (ID: ${user.id})`);
    }

    next();

  } catch (error) {
    console.error('Opsiyonel auth middleware hatası:', error);
    // Hata olsa bile devam et
    next();
  }
}

/**
 * Admin rolü kontrolü middleware'i
 * @param {Object} req - Express request objesi
 * @param {Object} res - Express response objesi
 * @param {Function} next - Express next fonksiyonu
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'service_role') {
    return res.status(403).json({ error: 'Admin yetkisi gerekli' });
  }

  next();
}

/**
 * Kullanıcının kendi verisine erişim kontrolü
 * @param {String} userIdField - Kontrol edilecek user_id alan adı
 * @returns {Function} Middleware fonksiyonu
 */
function requireOwnership(userIdField = 'user_id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
    }

    // Admin kullanıcılar her şeyi yapabilir
    if (req.user.role === 'admin' || req.user.role === 'service_role') {
      return next();
    }

    // Kullanıcının kendi verisine erişim kontrolü
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (resourceUserId && resourceUserId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Bu kaynağa erişim yetkiniz yok' 
      });
    }

    next();
  };
}

module.exports = {
  authenticateUser,
  optionalAuth,
  requireAdmin,
  requireOwnership
}; 