const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// GET /api/ilanlar - Tüm ilanları getir
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ilanlar')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'İlanlar alınamadı.' });
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

// İlan ekleme endpoint (örnek)
router.post('/ekle', async (req, res) => {
  // TODO: Supabase ile ilan ekleme işlemi buraya gelecek
  res.status(201).json({ message: 'İlan eklendi (dummy response)' });
});

module.exports = router; 