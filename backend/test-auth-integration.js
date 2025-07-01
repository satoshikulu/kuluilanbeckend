const { supabase } = require('./supabase');

/**
 * Supabase Auth entegrasyonu test örnekleri
 */
async function testAuthIntegration() {
  console.log('🔐 Supabase Auth Entegrasyon Test\n');

  // Test 1: Kullanıcı girişi simülasyonu
  console.log('=== Test 1: Kullanıcı Girişi ===');
  try {
    // Gerçek kullanıcı girişi (email/password ile)
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (error) {
      console.log('❌ Giriş hatası:', error.message);
      console.log('💡 Bu normal - test kullanıcısı yok\n');
    } else {
      console.log('✅ Giriş başarılı');
      console.log('Kullanıcı ID:', user.id);
      console.log('Email:', user.email);
      console.log('Access Token:', session.access_token.substring(0, 20) + '...');
      console.log('');
    }
  } catch (error) {
    console.log('❌ Test hatası:', error.message);
  }

  // Test 2: JWT token doğrulama
  console.log('=== Test 2: JWT Token Doğrulama ===');
  try {
    // Örnek token (gerçek token ile değiştirin)
    const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    
    const { data: { user }, error } = await supabase.auth.getUser(sampleToken);
    
    if (error) {
      console.log('❌ Token doğrulama hatası:', error.message);
      console.log('💡 Bu normal - örnek token geçersiz\n');
    } else {
      console.log('✅ Token doğrulandı');
      console.log('Kullanıcı:', user.email);
      console.log('');
    }
  } catch (error) {
    console.log('❌ Token test hatası:', error.message);
  }

  // Test 3: API endpoint test örneği
  console.log('=== Test 3: API Endpoint Kullanım Örneği ===');
  console.log(`
📝 Frontend'den API çağrısı örneği:

// 1. Kullanıcı girişi
const { data: { session } } = await supabase.auth.getSession();

// 2. API çağrısı (Authorization header ile)
const response = await fetch('/api/ilanlar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + session.access_token
  },
  body: JSON.stringify({
    ad: '3+1 Satılık Daire',
    fiyat: 500000,
    kategori: 'satilik-ev',
    mahalle: 'Merkez',
    aciklama: 'Güzel bir daire'
  })
});

const result = await response.json();
console.log('İlan eklendi:', result);
`);

  // Test 4: Middleware kullanım örneği
  console.log('=== Test 4: Middleware Kullanım Örneği ===');
  console.log(`
🔧 Backend middleware kullanımı:

// İlan ekleme - Auth gerekli
router.post('/', authenticateUser, async (req, res) => {
  // req.user.id - Kullanıcının Supabase ID'si
  // req.user.email - Kullanıcının email'i
  
  const ilanWithUserId = {
    ...req.body,
    user_id: req.user.id,
    created_by: req.user.email
  };
  
  // İlanı veritabanına ekle
});

// İlan listeleme - Opsiyonel auth
router.get('/', optionalAuth, async (req, res) => {
  // req.user varsa kullanıcı giriş yapmış
  // req.user yoksa anonim kullanıcı
});

// Admin işlemleri - Admin gerekli
router.patch('/onayla', authenticateUser, requireAdmin, async (req, res) => {
  // Sadece admin kullanıcılar erişebilir
});

// Sahiplik kontrolü
router.delete('/:id', authenticateUser, requireOwnership('user_id'), async (req, res) => {
  // Kullanıcı sadece kendi ilanlarını silebilir
});
`);

  console.log('=== Test Tamamlandı ===');
}

// Test fonksiyonunu çalıştır
testAuthIntegration(); 