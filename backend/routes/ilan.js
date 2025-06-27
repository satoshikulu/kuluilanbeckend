const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// GET /api/ilanlar - Tüm ilanları getir (filtreli)
router.get('/', async (req, res) => {
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
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlanlar alınamadı.' });
  }
});

// POST /api/ilanlar - Yeni ilan ekle
router.post('/', async (req, res) => {
  try {
    const ilan = req.body;
    if (!ilan || Object.keys(ilan).length === 0) {
      return res.status(400).json({ error: 'İlan verisi gerekli.' });
    }
    const { data, error } = await supabase
      .from('ilanlar')
      .insert([ilan])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlan eklenemedi.' });
  }
});

// PATCH /api/ilanlar/onayla - Belirli bir ilanın durumunu güncelle
router.patch('/onayla', async (req, res) => {
  try {
    const { id, durum } = req.body;
    if (!id || !durum) {
      return res.status(400).json({ error: 'id ve durum gerekli.' });
    }
    const { data, error } = await supabase
      .from('ilanlar')
      .update({ durum })
      .eq('id', id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Durum güncellenemedi.' });
  }
});

// DELETE /api/ilanlar/:id - Belirli ilanı sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'id gerekli.' });
    }
    const { error } = await supabase
      .from('ilanlar')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlan silinemedi.' });
  }
});

// Gelecekte JWT/admin doğrulama için middleware eklenebilir

// Basit test endpoint
router.get('/', (req, res) => {
  res.send('İlan route çalışıyor');
});

module.exports = router; 