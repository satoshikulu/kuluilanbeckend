const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { createStorageUrl } = require('../utils/storage');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Storage bucket adı
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'ilan-fotograflari';

/**
 * İlan verilerine resim URL'lerini ekler
 * @param {Array|Object} ilanlar - İlan verisi veya ilanlar dizisi
 * @returns {Array|Object} Resim URL'leri eklenmiş ilan verisi
 */
function addImageUrls(ilanlar) {
  const processIlan = (ilan) => {
    if (!ilan) return ilan;
    
    const processedIlan = { ...ilan };
    
    // Eğer resim alanı varsa ve boş değilse, tam URL'yi oluştur
    if (ilan.resim && ilan.resim.trim()) {
      try {
        processedIlan.resim_url = createStorageUrl(STORAGE_BUCKET, ilan.resim);
      } catch (error) {
        console.error(`Resim URL oluşturma hatası (İlan ID: ${ilan.id}):`, error.message);
        processedIlan.resim_url = null;
      }
    } else {
      processedIlan.resim_url = null;
    }
    
    // Eğer media alanı varsa (çoklu resim desteği için)
    if (ilan.media && ilan.media.trim()) {
      try {
        const mediaFiles = ilan.media.split(',').map(file => file.trim()).filter(file => file);
        processedIlan.media_urls = mediaFiles.map(file => createStorageUrl(STORAGE_BUCKET, file));
      } catch (error) {
        console.error(`Media URL oluşturma hatası (İlan ID: ${ilan.id}):`, error.message);
        processedIlan.media_urls = [];
      }
    } else {
      processedIlan.media_urls = [];
    }
    
    return processedIlan;
  };
  
  // Array ise her elemanı işle, tek obje ise direkt işle
  if (Array.isArray(ilanlar)) {
    return ilanlar.map(processIlan);
  } else {
    return processIlan(ilanlar);
  }
}

// GET /api/ilanlar - Kullanıcının kendi ilanlarını getir (RLS ile otomatik filtrelenir)
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log(`👤 Kullanıcının ilanları getiriliyor - Kullanıcı: ${req.user.email} (ID: ${req.user.id})`);

    // RLS politikaları sayesinde sadece kendi ilanları gelecek
    const { data, error } = await supabase
      .from('ilanlar')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Resim URL'lerini ekle
    const ilanlarWithUrls = addImageUrls(data);
    
    res.json({
      ilanlar: ilanlarWithUrls,
      count: ilanlarWithUrls.length,
      user_info: {
        id: req.user.id,
        email: req.user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlanlar alınamadı.' });
  }
});

// GET /api/ilanlar/public - Onaylı ilanları herkese göster (anonim erişim)
router.get('/public', async (req, res) => {
  try {
    let { kategori, mahalle } = req.query;
    
    // Normalize fonksiyonu: trim, küçük harfe çevir, Türkçe karakter düzeltmesi
    function normalize(str) {
      return (str || '')
        .toLowerCase()
        .replace(/i/g, 'ı')
        .replace(/İ/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ç/g, 'c')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ğ/g, 'g')
        .replace(/\s+/g, ' ')
        .trim();
    }

    let query = supabase.from('ilanlar').select('*');
    
    // Sadece onaylı ilanları göster
    query = query.eq('durum', 'onayli');
    
    if (kategori) {
      kategori = normalize(kategori);
      query = query.ilike('kategori', `%${kategori}%`);
    }
    if (mahalle) {
      mahalle = normalize(mahalle);
      query = query.ilike('mahalle', `%${mahalle}%`);
    }
    
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    
    // Resim URL'lerini ekle
    const ilanlarWithUrls = addImageUrls(data);
    
    res.json({
      ilanlar: ilanlarWithUrls,
      count: ilanlarWithUrls.length,
      message: 'Onaylı ilanlar listelendi'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlanlar alınamadı.' });
  }
});

// POST /api/ilanlar - Yeni ilan ekle - Auth gerekli
router.post('/', authenticateUser, async (req, res) => {
  try {
    const ilan = req.body;
    if (!ilan || Object.keys(ilan).length === 0) {
      return res.status(400).json({ error: 'İlan verisi gerekli.' });
    }

    // Mahalle alanı kontrolü
    if (!ilan.mahalle || ilan.mahalle.trim() === '') {
      return res.status(400).json({ error: 'Mahalle alanı zorunludur.' });
    }

    // Kullanıcı ID'sini ilan verisine ekle (RLS için gerekli)
    const ilanWithUserId = {
      ...ilan,
      mahalle: ilan.mahalle.trim(), // Mahalle alanını temizle
      user_id: req.user.id, // Supabase auth'tan gelen kullanıcı ID'si
      durum: 'beklemede' // Varsayılan durum
    };

    console.log(`📝 İlan ekleniyor - Kullanıcı: ${req.user.email} (ID: ${req.user.id}) - Mahalle: ${ilanWithUserId.mahalle}`);

    const { data, error } = await supabase
      .from('ilanlar')
      .insert([ilanWithUserId])
      .select();
    if (error) throw error;
    
    // Eklenen ilana resim URL'lerini ekle
    const ilanWithUrls = addImageUrls(data[0]);
    
    res.status(201).json({ 
      message: 'İlan başarıyla eklendi ve onay için bekliyor', 
      ilan: ilanWithUrls,
      user_info: {
        id: req.user.id,
        email: req.user.email
      }
    });
  } catch (err) {
    console.error('İlan ekleme hatası:', err);
    res.status(500).json({ error: err.message || 'İlan eklenemedi.' });
  }
});

// PATCH /api/ilanlar/:id - Kullanıcının kendi ilanını güncelle
router.patch('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'İlan ID gerekli.' });
    }

    console.log(`🔧 İlan güncelleniyor - Kullanıcı: ${req.user.email} - İlan ID: ${id}`);

    // RLS politikası sayesinde sadece kendi ilanını güncelleyebilir
    const { data, error } = await supabase
      .from('ilanlar')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    
    // Güncellenmiş ilana resim URL'lerini ekle
    const ilanWithUrls = addImageUrls(data[0]);
    
    res.json({
      message: 'İlan başarıyla güncellendi',
      ilan: ilanWithUrls
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlan güncellenemedi.' });
  }
});

// PATCH /api/ilanlar/:id/onayla - Admin: İlan durumunu güncelle
router.patch('/:id/onayla', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { durum } = req.body;
    
    if (!id || !durum) {
      return res.status(400).json({ error: 'İlan ID ve durum gerekli.' });
    }

    console.log(`🔧 İlan durumu güncelleniyor - Admin: ${req.user.email} - İlan ID: ${id} - Yeni Durum: ${durum}`);

    const { data, error } = await supabase
      .from('ilanlar')
      .update({ durum })
      .eq('id', id)
      .select();
    if (error) throw error;
    
    // Güncellenmiş ilana resim URL'lerini ekle
    const ilanWithUrls = addImageUrls(data[0]);
    
    res.json({
      message: 'İlan durumu güncellendi',
      ilan: ilanWithUrls
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Durum güncellenemedi.' });
  }
});

// GET /api/ilanlar/:id - Belirli bir ilanı getir (sadece kendi ilanını görebilir)
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'İlan ID gerekli.' });
    }

    console.log(`👁️ İlan detayı getiriliyor - Kullanıcı: ${req.user.email} - İlan ID: ${id}`);

    // RLS politikası sayesinde sadece kendi ilanını görebilir
    const { data, error } = await supabase
      .from('ilanlar')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    // İlana resim URL'lerini ekle
    const ilanWithUrls = addImageUrls(data);
    
    res.json(ilanWithUrls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlan bulunamadı.' });
  }
});

// DELETE /api/ilanlar/:id - Belirli ilanı sil (sadece kendi ilanını silebilir)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'İlan ID gerekli.' });
    }

    console.log(`🗑️ İlan siliniyor - Kullanıcı: ${req.user.email} - İlan ID: ${id}`);

    // RLS politikası sayesinde sadece kendi ilanını silebilir
    const { error } = await supabase
      .from('ilanlar')
      .delete()
      .eq('id', id);
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'İlan başarıyla silindi' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlan silinemedi.' });
  }
});

// GET /api/ilanlar/admin/all - Admin: Tüm ilanları görüntüle
router.get('/admin/all', authenticateUser, requireAdmin, async (req, res) => {
  try {
    console.log(`👑 Admin tüm ilanları görüntülüyor - Admin: ${req.user.email}`);

    const { data, error } = await supabase
      .from('ilanlar')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Resim URL'lerini ekle
    const ilanlarWithUrls = addImageUrls(data);
    
    res.json({
      ilanlar: ilanlarWithUrls,
      count: ilanlarWithUrls.length,
      admin_info: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlanlar alınamadı.' });
  }
});

// Basit test endpoint
router.get('/test', (req, res) => {
  res.send('İlan route çalışıyor - RLS aktif');
});

module.exports = router; 