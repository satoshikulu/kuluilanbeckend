require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ilanRoutes = require('./routes/ilan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Ana dizindeki statik dosyaları servis et
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Dosya yükleme ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = "uploads";
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya formatı!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Kullanıcı girişi
app.post("/api/kullanici/giris", (req, res) => {
  const { ad_soyad, telefon } = req.body;

  // Veri doğrulama
  if (!ad_soyad || !telefon) {
    return res.status(400).json({ 
      success: false, 
      message: "Ad soyad ve telefon numarası zorunludur." 
    });
  }

  // Telefon numarası formatı kontrolü
  if (!/^[0-9]{10,11}$/.test(telefon)) {
    return res.status(400).json({ 
      success: false, 
      message: "Geçersiz telefon numarası formatı. 10-11 haneli numara giriniz." 
    });
  }

  // Kullanıcıyı kontrol et
  supabase.from('kullanicilar').select('*').eq('telefon', telefon).eq('ad_soyad', ad_soyad).then(({ data, error }) => {
    if (error) {
      console.error("Veritabanı hatası:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Veritabanı hatası oluştu." 
      });
    }

    if (!data || data.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Kullanıcı bulunamadı. Lütfen kayıt olun veya bilgilerinizi kontrol edin." 
      });
    }

    // Giriş başarılı
    res.json({ 
      success: true, 
      message: "Giriş başarılı.",
      user: data[0] 
    });
  });
});

// Kullanıcı kaydı
app.post("/api/kullanici/kayit", (req, res) => {
  const { ad_soyad, telefon } = req.body;

  // Veri doğrulama
  if (!ad_soyad || !telefon) {
    return res.status(400).json({ 
      success: false, 
      message: "Ad soyad ve telefon numarası zorunludur." 
    });
  }

  // Telefon numarası formatı kontrolü
  if (!/^[0-9]{10,11}$/.test(telefon)) {
    return res.status(400).json({ 
      success: false, 
      message: "Geçersiz telefon numarası formatı. 10-11 haneli numara giriniz." 
    });
  }

  // Önce telefon numarası ile kullanıcı var mı kontrol et
  supabase.from('kullanicilar').select('*').eq('telefon', telefon).then(({ data, error }) => {
    if (error) {
      console.error("Veritabanı hatası:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Veritabanı hatası oluştu." 
      });
    }

    if (data && data.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Bu telefon numarası ile kayıtlı bir kullanıcı zaten var. Lütfen giriş yapın." 
      });
    }

    // Yeni kullanıcı kaydı
    supabase.from('kullanicilar').insert([{ ad_soyad, telefon }]).then(({ data, error }) => {
      if (error) {
        console.error("Kayıt hatası:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Kayıt sırasında bir hata oluştu." 
        });
      }

      // Yeni kaydedilen kullanıcıyı getir
      supabase.from('kullanicilar').select('*').eq('telefon', telefon).then(({ data, error }) => {
        if (error) {
          console.error("Kullanıcı getirme hatası:", error);
          return res.status(500).json({ 
            success: false, 
            message: "Kullanıcı bilgileri alınamadı." 
          });
        }

        res.status(201).json({ 
          success: true, 
          message: "Kayıt başarılı. Artık giriş yapabilirsiniz.",
          user: data[0] 
        });
      });
    });
  });
});

// Güvenlik middleware'i
function apiKeyKontrol(req, res, next) {
  if (req.headers['x-api-key'] !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Yetkisiz erişim' });
  }
  next();
}

// İlan ekle
app.post('/ilan-ekle', async (req, res) => {
  try {
    const { ad, telefon, aciklama, resim, konum, mahalle, fiyat } = req.body;
    const durum = 'beklemede';
    
    // Mahalle alanı kontrolü
    if (!mahalle || mahalle.trim() === '') {
      return res.status(400).json({ error: 'Mahalle alanı zorunludur' });
    }
    
    const { data, error } = await supabase
      .from('ilanlar')
      .insert([{ 
        ad, 
        telefon, 
        aciklama, 
        resim, 
        konum, 
        mahalle: mahalle.trim(), 
        fiyat,
        durum 
      }])
      .select();
    if (error) throw error;
    res.status(201).json({ message: 'İlan başarıyla eklendi', ilan: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bir hata oluştu' });
  }
});

// Tüm ilanları getir (filtreleme destekli)
app.get('/ilanlar', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ilanlar')
      .select('id, ad, telefon, aciklama, resim, konum, mahalle, fiyat, durum, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bir hata oluştu' });
  }
});

// Admin: İlan durumunu güncelle (PATCH)
app.patch('/ilan/:id', apiKeyKontrol, async (req, res) => {
  try {
    const { id } = req.params;
    const { durum } = req.body;
    if (!['yayinda', 'reddedildi', 'beklemede'].includes(durum)) {
      return res.status(400).json({ error: 'Geçersiz durum değeri' });
    }
    const { data, error } = await supabase
      .from('ilanlar')
      .update({ durum })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'İlan bulunamadı' });
    }
    res.json({ message: 'İlan durumu güncellendi', ilan: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bir hata oluştu' });
  }
});

// İlanları listele
app.get("/api/ilanlar", (req, res) => {
  const onayli = req.query.onayli === "1" ? 1 : 0;
  
  supabase.from('ilanlar').select('*').eq('onayli', onayli).order('created_at', { ascending: false }).then(({ data, error }) => {
    if (error) {
      console.error("İlan listeleme hatası:", error);
      return res.status(500).json({ 
        success: false, 
        message: "İlanlar listelenirken bir hata oluştu." 
      });
    }

    res.json({ 
      success: true, 
      ilanlar: data 
    });
  });
});

// İlan onayla
app.put("/api/ilan/onayla/:id", (req, res) => {
  const { id } = req.params;

  supabase.from('ilanlar').update({ onayli: 1 }).eq('id', id).then(({ data, error }) => {
    if (error) {
      console.error("İlan onaylama hatası:", error);
      return res.status(500).json({ 
        success: false, 
        message: "İlan onaylanırken bir hata oluştu." 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "İlan bulunamadı." 
      });
    }

    res.json({ 
      success: true, 
      message: "İlan başarıyla onaylandı." 
    });
  });
});

// İlan sil
app.delete('/api/ilan/:id', apiKeyKontrol, async (req, res) => {
  try {
    const { id } = req.params;
    // Önce ilanı bul
    const { data, error } = await supabase.from('ilanlar').select('id, media').eq('id', id);
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'İlan bulunamadı' });
    }
    // Medya dosyalarını sil
    if (data[0].media) {
      const mediaFiles = data[0].media.split(',');
      mediaFiles.forEach(filename => {
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    // İlanı Supabase'den sil
    const { error: delError } = await supabase.from('ilanlar').delete().eq('id', id);
    if (delError) throw delError;
    res.json({ message: 'İlan ve medya dosyaları silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bir hata oluştu' });
  }
});

// İstatistikler
app.get("/api/istatistikler", (req, res) => {
  const stats = {};
  
  supabase.from('ilanlar').select('*').then(({ data, error }) => {
    if (error) return res.status(500).json({ error: error.message });
    stats.toplamIlan = data.length;
    
    supabase.from('ilanlar').select('*').eq('onayli', 1).then(({ data, error }) => {
      if (error) return res.status(500).json({ error: error.message });
      stats.onayliIlan = data.length;
      
      supabase.from('kullanicilar').select('*').then(({ data, error }) => {
        if (error) return res.status(500).json({ error: error.message });
        stats.toplamKullanici = data.length;
        
        supabase.from('ilanlar').select('kategori').then(({ data, error }) => {
          if (error) return res.status(500).json({ error: error.message });
          stats.kategoriDagilimi = data.map(item => ({
            kategori: item.kategori,
            sayi: data.filter(i => i.kategori === item.kategori).length
          }));
          
          res.json(stats);
        });
      });
    });
  });
});

// Admin girişi
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (username === "sevimbebe4242" && password === "sevimbebe4242") {
    res.json({ 
      success: true, 
      message: "Giriş başarılı." 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: "Geçersiz kullanıcı adı veya şifre." 
    });
  }
});

app.put('/ilanlar/:id/durum', async (req, res) => {
  try {
    const { id } = req.params;
    const { durum } = req.body;
    if (!durum) {
      return res.status(400).json({ error: 'Durum alanı gereklidir.' });
    }
    const { data, error } = await supabase
      .from('ilanlar')
      .update({ durum })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'İlan bulunamadı.' });
    }
    res.status(200).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bir hata oluştu' });
  }
});

app.use('/api/ilanlar', ilanRoutes);

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
}); 