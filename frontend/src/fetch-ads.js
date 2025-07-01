// 📄 Dosya: frontend/src/fetch-ads.js
// Supabase'ten onaylı ilanları çeken modül

// Supabase verileri:
const SUPABASE_URL = 'https://zwfidwzilulovjyzphqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // kısaltıldı

import { createClient } from 'https://esm.sh/@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mahalleleri dinamik olarak getirip filtre dropdown'ına ekler
export async function fetchMahalleler() {
  const { data, error } = await supabase
    .from('ilanlar')
    .select('mahalle', { count: 'exact', head: false });

  if (error) {
    console.error('❌ Mahalle listesi alınamadı:', error.message);
    return;
  }

  const uniqueMahalleler = [...new Set(data.map((item) => item.mahalle))].filter(Boolean);
  const select = document.getElementById('mahalle-filter');
  if (!select) return;

  select.innerHTML = `<option value="">Tüm Mahalleler</option>`;
  uniqueMahalleler.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
}

// Ana fonksiyon: Onaylı ilanları getir (mahalle parametresiyle)
export async function fetchApprovedAds(mahalle = '') {
  let query = supabase
    .from('ilanlar')
    .select('*')
    .eq('onay', true)
    .order('created_at', { ascending: false });

  if (mahalle) {
    query = query.eq('mahalle', mahalle);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ İlan verisi alınamadı:', error.message);
    return;
  }

  const container = document.getElementById('ilan-listesi');
  if (!container) return;
  container.innerHTML = '';

  data.forEach((ilan) => {
    const ilanDiv = document.createElement('div');
    ilanDiv.className = 'ilan-karti';
    ilanDiv.innerHTML = `
      <h3>${ilan.baslik}</h3>
      <p>${ilan.aciklama}</p>
      <p><strong>Fiyat:</strong> ${ilan.fiyat} TL</p>
      <p><strong>Mahalle:</strong> ${ilan.mahalle}</p>
      <hr>
    `;
    container.appendChild(ilanDiv);
  });

  console.log(`✅ ${data.length} ilan listelendi.`);
}

// HTML tarafı için test betiği önerisi:
// <script type="module">
//   import { fetchApprovedAds } from './js/fetch-ads.js'
//   fetchApprovedAds()
// </script>
