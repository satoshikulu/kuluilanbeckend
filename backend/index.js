require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get('/', (req, res) => {
  res.send('API Çalışıyor');
});

app.post('/ilan-ekle', async (req, res) => {
  const { ad, telefon, aciklama, resim, konum } = req.body;
  try {
    const { error } = await supabase
      .from('ilanlar')
      .insert([{ ad, telefon, aciklama, resim, konum }]);
    if (error) throw error;
    res.status(201).json({ message: 'İlan başarıyla eklendi' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bir hata oluştu' });
  }
});

app.get('/ilanlar', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ilanlar')
      .select('id, ad, telefon, aciklama, resim, konum, created_at, durum')
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Eğer durum alanı yoksa, "beklemede" olarak işaretle
    const result = (data || []).map(ilan => ({
      ...ilan,
      durum: ilan.durum || 'beklemede'
    }));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bir hata oluştu' });
  }
});

app.patch('/ilan-onayla', async (req, res) => {
  const { id, durum } = req.body;
  if (!id || !durum) {
    return res.status(400).json({ error: 'id ve durum alanları gereklidir' });
  }
  try {
    const { error } = await supabase
      .from('ilanlar')
      .update({ durum })
      .eq('id', id);
    if (error) throw error;
    res.status(200).json({ message: 'İlan güncellendi' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bir hata oluştu' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 