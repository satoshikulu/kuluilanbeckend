const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const admin = require("firebase-admin");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Ana dizindeki statik dosyaları servis et
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// SQLite veritabanı
const db = new sqlite3.Database("kuluemlak.db", (err) => {
  if (err) return console.error(err.message);
  console.log("SQLite veritabanı bağlandı.");
});

// Veritabanı tablolarını oluştur
db.serialize(() => {
  // Kullanıcılar tablosu
  db.run(`CREATE TABLE IF NOT EXISTS kullanicilar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_soyad TEXT NOT NULL,
    telefon TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // İlanlar tablosu
  db.run(`CREATE TABLE IF NOT EXISTS ilanlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baslik TEXT NOT NULL,
    aciklama TEXT NOT NULL,
    fiyat INTEGER NOT NULL,
    kategori TEXT NOT NULL,
    media TEXT,
    onayli INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // İlan görüntülenme tablosu
  db.run(`CREATE TABLE IF NOT EXISTS ilan_goruntuleme (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ilan_id INTEGER,
    kullanici_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ilan_id) REFERENCES ilanlar(id),
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
  )`);
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
  db.get("SELECT * FROM kullanicilar WHERE telefon = ? AND ad_soyad = ?", 
    [telefon, ad_soyad], 
    (err, user) => {
      if (err) {
        console.error("Veritabanı hatası:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Veritabanı hatası oluştu." 
        });
      }

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Kullanıcı bulunamadı. Lütfen kayıt olun veya bilgilerinizi kontrol edin." 
        });
      }

      // Giriş başarılı
      res.json({ 
        success: true, 
        message: "Giriş başarılı.",
        user: user 
      });
    }
  );
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
  db.get("SELECT * FROM kullanicilar WHERE telefon = ?", [telefon], (err, existingUser) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Veritabanı hatası oluştu." 
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Bu telefon numarası ile kayıtlı bir kullanıcı zaten var. Lütfen giriş yapın." 
      });
    }

    // Yeni kullanıcı kaydı
    db.run(
      `INSERT INTO kullanicilar (ad_soyad, telefon) VALUES (?, ?)`,
      [ad_soyad, telefon],
      function (err) {
        if (err) {
          console.error("Kayıt hatası:", err);
          return res.status(500).json({ 
            success: false, 
            message: "Kayıt sırasında bir hata oluştu." 
          });
        }

        // Yeni kaydedilen kullanıcıyı getir
        db.get("SELECT * FROM kullanicilar WHERE id = ?", [this.lastID], (err, newUser) => {
          if (err) {
            console.error("Kullanıcı getirme hatası:", err);
            return res.status(500).json({ 
              success: false, 
              message: "Kullanıcı bilgileri alınamadı." 
            });
          }

          res.status(201).json({ 
            success: true, 
            message: "Kayıt başarılı. Artık giriş yapabilirsiniz.",
            user: newUser 
          });
        });
      }
    );
  });
});

// İlan ekle
app.post("/api/ilan", upload.array("media", 5), (req, res) => {
  const { baslik, aciklama, fiyat, kategori } = req.body;

  if (!baslik || !aciklama || !fiyat || !kategori) {
    return res.status(400).json({ 
      success: false, 
      message: "Tüm zorunlu alanları doldurun." 
    });
  }

  const media = req.files ? req.files.map(file => file.filename).join(',') : null;

  db.run(
    `INSERT INTO ilanlar (baslik, aciklama, fiyat, kategori, media, onayli) 
     VALUES (?, ?, ?, ?, ?, 0)`,
    [baslik, aciklama, fiyat, kategori, media],
    function(err) {
      if (err) {
        console.error("İlan ekleme hatası:", err);
        return res.status(500).json({ 
          success: false, 
          message: "İlan eklenirken bir hata oluştu." 
        });
      }

      res.status(201).json({ 
        success: true, 
        message: "İlan başarıyla eklendi.",
        ilanId: this.lastID
      });
    }
  );
});

// İlanları listele
app.get("/api/ilanlar", (req, res) => {
  const onayli = req.query.onayli === "1" ? 1 : 0;
  
  db.all(
    "SELECT * FROM ilanlar WHERE onayli = ? ORDER BY created_at DESC",
    [onayli],
    (err, rows) => {
      if (err) {
        console.error("İlan listeleme hatası:", err);
        return res.status(500).json({ 
          success: false, 
          message: "İlanlar listelenirken bir hata oluştu." 
        });
      }

      res.json({ 
        success: true, 
        ilanlar: rows 
      });
    }
  );
});

// İlan onayla
app.put("/api/ilan/onayla/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    "UPDATE ilanlar SET onayli = 1 WHERE id = ?",
    [id],
    function(err) {
      if (err) {
        console.error("İlan onaylama hatası:", err);
        return res.status(500).json({ 
          success: false, 
          message: "İlan onaylanırken bir hata oluştu." 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "İlan bulunamadı." 
        });
      }

      res.json({ 
        success: true, 
        message: "İlan başarıyla onaylandı." 
      });
    }
  );
});

// İlan sil
app.delete("/api/ilan/:id", (req, res) => {
  const { id } = req.params;

  // Önce ilanın medya dosyalarını al
  db.get("SELECT media FROM ilanlar WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("İlan silme hatası:", err);
      return res.status(500).json({ 
        success: false, 
        message: "İlan silinirken bir hata oluştu." 
      });
    }

    if (!row) {
      return res.status(404).json({ 
        success: false, 
        message: "İlan bulunamadı." 
      });
    }

    // Medya dosyalarını sil
    if (row.media) {
      const mediaFiles = row.media.split(',');
      mediaFiles.forEach(filename => {
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // İlanı veritabanından sil
    db.run("DELETE FROM ilanlar WHERE id = ?", [id], function(err) {
      if (err) {
        console.error("İlan silme hatası:", err);
        return res.status(500).json({ 
          success: false, 
          message: "İlan silinirken bir hata oluştu." 
        });
      }

      res.json({ 
        success: true, 
        message: "İlan başarıyla silindi." 
      });
    });
  });
});

// İstatistikler
app.get("/api/istatistikler", (req, res) => {
  const stats = {};
  
  db.get("SELECT COUNT(*) as toplam FROM ilanlar", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.toplamIlan = row.toplam;
    
    db.get("SELECT COUNT(*) as onayli FROM ilanlar WHERE onayli = 1", [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.onayliIlan = row.onayli;
      
      db.get("SELECT COUNT(*) as kullanici FROM kullanicilar", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.toplamKullanici = row.kullanici;
        
        db.all("SELECT kategori, COUNT(*) as sayi FROM ilanlar GROUP BY kategori", [], (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.kategoriDagilimi = rows;
          
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

// Kullanıcıları getir
app.get('/api/kullanicilar', async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers();
        const users = listUsersResult.users.map(user => ({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: user.metadata.creationTime,
            lastLoginAt: user.metadata.lastSignInTime
        }));
        res.json(users);
    } catch (error) {
        console.error('Kullanıcılar listelenirken hata:', error);
        res.status(500).json({ error: 'Kullanıcılar listelenirken bir hata oluştu' });
    }
});

// Kullanıcı sil
app.delete('/api/kullanici/:uid', async (req, res) => {
    try {
        await admin.auth().deleteUser(req.params.uid);
        res.json({ message: 'Kullanıcı başarıyla silindi' });
    } catch (error) {
        console.error('Kullanıcı silinirken hata:', error);
        res.status(500).json({ error: 'Kullanıcı silinirken bir hata oluştu' });
    }
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
}); 