import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import './App.css';

function App() {
  const [ilanlar, setIlanlar] = useState([]);
  const [mahalleler, setMahalleler] = useState([]);
  const [selectedMahalle, setSelectedMahalle] = useState('');

  useEffect(() => {
    fetchMahalleler();
    fetchIlanlar();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchIlanlar();
    // eslint-disable-next-line
  }, [selectedMahalle]);

  const fetchMahalleler = async () => {
    const { data, error } = await supabase
      .from('ilanlar')
      .select('mahalle');
    if (error) {
      console.error('Mahalle alınamadı:', error);
      return;
    }
    const unique = [...new Set(data.map((item) => item.mahalle))].filter(Boolean);
    setMahalleler(unique);
  };

  const fetchIlanlar = async () => {
    let query = supabase.from('ilanlar').select('*').eq('onay', true);
    if (selectedMahalle) {
      query = query.eq('mahalle', selectedMahalle);
    }
    const { data, error } = await query;
    if (error) {
      console.error('İlanlar alınamadı:', error);
      return;
    }
    setIlanlar(data);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Kulu Emlak İlanları</h1>
      <label>
        Mahalle Seçin:
        <select
          value={selectedMahalle}
          onChange={(e) => setSelectedMahalle(e.target.value)}
          style={{ marginLeft: '1rem' }}
        >
          <option value="">Tüm Mahalleler</option>
          {mahalleler.map((m, i) => (
            <option key={i} value={m}>{m}</option>
          ))}
        </select>
      </label>
      <hr />
      <div>
        {ilanlar.length === 0 ? (
          <p>İlan bulunamadı.</p>
        ) : (
          ilanlar.map((ilan) => (
            <div key={ilan.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
              <h3>{ilan.baslik}</h3>
              <p>{ilan.aciklama}</p>
              <p><strong>Fiyat:</strong> {ilan.fiyat} TL</p>
              <p><strong>Mahalle:</strong> {ilan.mahalle}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
