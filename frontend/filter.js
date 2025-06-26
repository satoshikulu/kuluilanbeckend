// Ortak filtreleme ve ilan listeleme scripti
// Supabase ayarlarını buraya ekleyin
const SUPABASE_URL = 'VITE_SUPABASE_URL'; // .env'den alınacak şekilde değiştirin
const SUPABASE_KEY = 'VITE_SUPABASE_ANON_KEY';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Form submit ile URL parametrelerini güncelle
window.aramaYap = function(event) {
    event.preventDefault();
    const form = event.target;
    const params = new URLSearchParams();
    // Tüm input/selectleri oku
    Array.from(form.elements).forEach(el => {
        if (el.name && el.value && el.value !== 'Tümü') {
            params.set(el.name, el.value);
        }
    });
    // Aynı sayfaya yönlendir
    const page = window.location.pathname.split('/').pop();
    window.location.href = `${page}?${params.toString()}`;
}

// Sayfa yüklendiğinde ilanları çek ve göster
window.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const kategori = params.get('kategori');
    const mahalle = params.get('mahalle');
    const fiyat = params.get('fiyat');
    const oda = params.get('oda');
    const metrekare = params.get('metrekare');
    let query = supabase.from('ilanlar').select('*');
    if (kategori) query = query.ilike('kategori', `%${kategori}%`);
    if (mahalle) query = query.ilike('mahalle', `%${mahalle}%`);
    if (fiyat) {
        const [min, max] = fiyat.split('-');
        if (min) query = query.gte('fiyat', Number(min));
        if (max) query = query.lte('fiyat', Number(max));
    }
    if (oda) query = query.ilike('oda', `%${oda}%`);
    if (metrekare) {
        const [min, max] = metrekare.split('-');
        if (min) query = query.gte('metrekare', Number(min));
        if (max) query = query.lte('metrekare', Number(max));
    }
    const { data, error } = await query;
    const list = document.getElementById('property-list');
    if (!list) return;
    list.innerHTML = '';
    if (error) {
        list.innerHTML = `<div class='text-danger'>Bir hata oluştu: ${error.message}</div>`;
        return;
    }
    if (!data || data.length === 0) {
        list.innerHTML = '<div>Sonuç bulunamadı.</div>';
        return;
    }
    data.forEach(ilan => {
        const img = (ilan.media || '').split(',')[0]?.trim() || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
        const card = document.createElement('div');
        card.className = 'col-md-6';
        card.innerHTML = `
            <div class="property-card" data-aos="fade-up">
                <img src="${img}" alt="${ilan.baslik}" class="property-image">
                <div class="property-content">
                    <h3 class="property-title">${ilan.baslik}</h3>
                    <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${ilan.mahalle}</p>
                    <div class="property-features">
                        ${ilan.oda ? `<span class='feature'><i class='fas fa-bed'></i> ${ilan.oda}</span>` : ''}
                        ${ilan.metrekare ? `<span class='feature'><i class='fas fa-ruler-combined'></i> ${ilan.metrekare}m²</span>` : ''}
                    </div>
                    <div class="property-price">${ilan.fiyat} TL</div>
                    <a href="#" class="property-btn">İncele</a>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
    if (window.AOS) window.AOS.refresh();
}); 