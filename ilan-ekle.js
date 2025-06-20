document.addEventListener('DOMContentLoaded', function() {
    // Form ve adım elementleri
    const form = document.getElementById('ilanForm');
    const steps = document.querySelectorAll('.step');
    const stepCards = document.querySelectorAll('.step-card');
    let currentStep = 1;
    let map, marker;

    // Harita başlatma
    function initMap() {
        // Kulu'nun yaklaşık koordinatları
        const kuluCoords = [39.0951, 33.0794];
        
        map = L.map('map').setView(kuluCoords, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Haritaya tıklama olayı
        map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            
            // Önceki marker'ı kaldır
            if (marker) {
                map.removeLayer(marker);
            }
            
            // Yeni marker ekle
            marker = L.marker([lat, lng]).addTo(map);
            
            // Form alanlarını güncelle
            document.querySelector('input[name="latitude"]').value = lat;
            document.querySelector('input[name="longitude"]').value = lng;
            
            // Hata mesajını temizle
            document.querySelector('#step3 .error-message').textContent = '';
        });
    }

    // Adım geçişleri
    function showStep(stepNumber) {
        stepCards.forEach(card => card.classList.remove('active'));
        document.getElementById(`step${stepNumber}`).classList.add('active');
        
        steps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            if (stepNum === stepNumber) {
                step.classList.add('active');
            } else if (stepNum < stepNumber) {
                step.classList.add('completed');
            }
        });

        currentStep = stepNumber;
    }

    // Form validasyonu
    function validateStep(stepNumber) {
        const currentCard = document.getElementById(`step${stepNumber}`);
        const inputs = currentCard.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        let errorMessage = '';

        inputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                errorMessage = 'Lütfen tüm zorunlu alanları doldurun.';
            }
        });

        // Özel validasyonlar
        if (stepNumber === 3) {
            const lat = document.querySelector('input[name="latitude"]').value;
            const lng = document.querySelector('input[name="longitude"]').value;
            if (!lat || !lng) {
                isValid = false;
                errorMessage = 'Lütfen haritadan bir konum seçin.';
            }
        }

        if (!isValid) {
            currentCard.querySelector('.error-message').textContent = errorMessage;
        } else {
            currentCard.querySelector('.error-message').textContent = '';
        }

        return isValid;
    }

    // Medya yükleme işlemleri
    const medyaEkleCheckbox = document.getElementById('medyaEkle');
    const medyaYuklemeDiv = document.getElementById('medyaYukleme');
    const previewDiv = document.getElementById('preview');

    medyaEkleCheckbox.addEventListener('change', function() {
        medyaYuklemeDiv.style.display = this.checked ? 'block' : 'none';
    });

    document.querySelector('input[name="medya"]').addEventListener('change', function(e) {
        previewDiv.innerHTML = '';
        const files = e.target.files;

        for (let file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'preview-image';
                    previewDiv.appendChild(img);
                }
                reader.readAsDataURL(file);
            }
        }
    });

    // Adım geçiş butonları
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function() {
            const stepNumber = parseInt(this.closest('.step-card').id.replace('step', ''));
            if (validateStep(stepNumber)) {
                showStep(stepNumber + 1);
            }
        });
    });

    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function() {
            const stepNumber = parseInt(this.closest('.step-card').id.replace('step', ''));
            showStep(stepNumber - 1);
        });
    });

    // Form gönderimi
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateStep(currentStep)) {
            return;
        }

        try {
            const formData = new FormData(this);
            const hasMedya = medyaEkleCheckbox.checked && formData.get('medya').size > 0;

            // Save to Firestore
            const savedIlan = await saveData(formData);
            
            if (!savedIlan) {
                throw new Error('İlan kaydedilemedi.');
            }

            // If there are media files, handle them separately
            if (hasMedya) {
                // Here you would typically upload the media files to storage
                // and update the document with the media URLs
                alert('❗️ Medya yükleme özelliği yakında eklenecektir.');
            } else {
                alert('❗️ Bu ilan henüz görsel içermemektedir. 24 saat içinde görsel eklemezseniz ilan pasif duruma alınacaktır.');
            }

            alert('İlanınız başarıyla eklendi!');
            window.location.href = '/'; // Ana sayfaya yönlendir

        } catch (error) {
            console.error('İlan ekleme hatası:', error);
            alert(error.message || 'İlan eklenirken bir hata oluştu.');
        }
    });

    // Haritayı başlat
    initMap();
}); 
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase-config.js";
import { auth } from "./firebase-config.js";

/**
 * Fetches all listings from Firestore and displays them in the ilanListesi div
 * @returns {Promise<Array>} Array of listing objects
 */
async function getIlanlar() {
    try {
        const querySnapshot = await getDocs(collection(db, "ilanlar"));
        const ilanlar = [];

        querySnapshot.forEach((doc) => {
            ilanlar.push({ id: doc.id, ...doc.data() });
        });

        // HTML'e yazdır
        const ilanListesi = document.getElementById("ilanListesi");
        ilanListesi.innerHTML = ""; // Önceki verileri temizle

        // Add some basic styling to the container
        ilanListesi.style.display = "grid";
        ilanListesi.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
        ilanListesi.style.gap = "20px";
        ilanListesi.style.padding = "20px";

        ilanlar.forEach((ilan) => {
            const div = document.createElement("div");
            div.className = "ilan-card";
            div.style.background = "white";
            div.style.borderRadius = "10px";
            div.style.padding = "20px";
            div.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            div.style.transition = "transform 0.2s ease-in-out";
            
            div.onmouseover = () => div.style.transform = "translateY(-5px)";
            div.onmouseout = () => div.style.transform = "translateY(0)";

            div.innerHTML = `
                <h3 style="margin-bottom: 15px; color: #2c3e50; font-size: 1.4rem;">${ilan.baslik || 'Başlık Yok'}</h3>
                <p style="color: #e74c3c; font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
                    ${ilan.fiyat ? ilan.fiyat.toLocaleString() + ' TL' : 'Fiyat Belirtilmemiş'}
                </p>
                <p style="color: #7f8c8d; margin-bottom: 8px;">
                    <i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>
                    ${ilan.konum || 'Konum Belirtilmemiş'}
                </p>
                <p style="color: #7f8c8d; margin-bottom: 8px;">
                    <i class="fas fa-phone" style="margin-right: 5px;"></i>
                    ${ilan.telefon || 'Telefon Belirtilmemiş'}
                </p>
                ${ilan.aciklama ? `<p style="color: #34495e; margin-top: 15px; font-size: 0.9rem;">${ilan.aciklama}</p>` : ''}
                <hr style="margin: 15px 0; border-color: #ecf0f1;">
            `;
            
            ilanListesi.appendChild(div);
        });

        return ilanlar;
    } catch (error) {
        console.error("İlanlar getirilirken hata oluştu:", error);
        const ilanListesi = document.getElementById("ilanListesi");
        ilanListesi.innerHTML = `
            <div style="color: #e74c3c; text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>İlanlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
            </div>
        `;
        return [];
    }
}

// ... existing code ...

import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase-config.js";
import { auth } from "./firebase-config.js";

/**
 * Saves a new listing to Firestore with user UID
 * @param {Object} formData - Form data containing listing details
 * @returns {Promise<Object>} The saved listing data with document ID
 */
async function saveData(formData = null) {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
        alert("Lütfen önce giriş yapın.");
        return null;
    }

    try {
        // If formData is provided, use it; otherwise use default data
        const ilan = formData ? {
            uid: user.uid,
            baslik: formData.get('baslik'),
            fiyat: Number(formData.get('fiyat')),
            konum: `${formData.get('ilce') || ''} ${formData.get('mahalle') || ''}`.trim(),
            telefon: formData.get('telefon'),
            aciklama: formData.get('aciklama'),
            kategori: formData.get('kategori'),
            alt_kategori: formData.get('alt_kategori'),
            metrekare: formData.get('metrekare') ? Number(formData.get('metrekare')) : null,
            oda_sayisi: formData.get('oda_sayisi'),
            isitma_tipi: formData.get('isitma_tipi'),
            bina_yasi: formData.get('bina_yasi') ? Number(formData.get('bina_yasi')) : null,
            kat: formData.get('kat'),
            aidat: formData.get('aidat') ? Number(formData.get('aidat')) : null,
            depozito: formData.get('depozito') ? Number(formData.get('depozito')) : null,
            esya_durumu: formData.get('esya_durumu'),
            imar_durumu: formData.get('imar_durumu'),
            tapu_durumu: formData.get('tapu_durumu'),
            kaks: formData.get('kaks') ? Number(formData.get('kaks')) : null,
            yaklasma_mesafesi: formData.get('yaklasma_mesafesi') ? Number(formData.get('yaklasma_mesafesi')) : null,
            yol_genisligi: formData.get('yol_genisligi') ? Number(formData.get('yol_genisligi')) : null,
            arsa_ozellikleri: formData.getAll('arsa_ozellikleri'),
            media: formData.get('media') ? formData.get('media').name : null,
            tarih: new Date().toISOString(),
            onayli: false // Yeni ilanlar varsayılan olarak onaysız
        } : {
            uid: user.uid,
            baslik: "Satılık Daire",
            fiyat: 250000,
            konum: "Konya/Kulu",
            telefon: "0555 123 45 67",
            tarih: new Date().toISOString(),
            onayli: false
        };

        // Add the document to Firestore
        const docRef = await addDoc(collection(db, "ilanlar"), ilan);
        console.log("İlan başarıyla kaydedildi, ID:", docRef.id);

        // Return the saved data with the document ID
        return { id: docRef.id, ...ilan };
    } catch (error) {
        console.error("İlan kaydedilirken hata oluştu:", error);
        throw error; // Re-throw the error for handling in the calling function
    }
}

// Export the functions
export { getIlanlar, saveData };

import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "./firebase-config.js";

/**
 * Fetches and displays listings belonging to the current user
 * @returns {Promise<Array>} Array of user's listings
 */
async function getKullaniciIlanlari() {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
        alert("Lütfen önce giriş yapın.");
        return [];
    }

    try {
        const ilanlarRef = collection(db, "ilanlar");
        const q = query(ilanlarRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const kullaniciIlanlari = [];
        querySnapshot.forEach((doc) => {
            kullaniciIlanlari.push({ id: doc.id, ...doc.data() });
        });

        // HTML'e yazdır
        const ilanListesi = document.getElementById("ilanListesi");
        ilanListesi.innerHTML = ""; // Önceki verileri temizle

        // Add some basic styling to the container
        ilanListesi.style.display = "grid";
        ilanListesi.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
        ilanListesi.style.gap = "20px";
        ilanListesi.style.padding = "20px";

        if (kullaniciIlanlari.length === 0) {
            ilanListesi.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <i class="fas fa-info-circle" style="font-size: 2rem; color: #3498db; margin-bottom: 15px;"></i>
                    <h3 style="color: #2c3e50; margin-bottom: 10px;">Henüz İlanınız Bulunmuyor</h3>
                    <p style="color: #7f8c8d;">İlan vermek için "İlan Ver" butonunu kullanabilirsiniz.</p>
                    <button onclick="showIlanEkle()" class="btn btn-primary mt-3">
                        <i class="fas fa-plus-circle me-1"></i>İlan Ver
                    </button>
                </div>
            `;
            return [];
        }

        kullaniciIlanlari.forEach((ilan) => {
            const div = document.createElement("div");
            div.className = "ilan-card";
            div.style.background = "white";
            div.style.borderRadius = "10px";
            div.style.padding = "20px";
            div.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            div.style.transition = "transform 0.2s ease-in-out";
            div.style.position = "relative";
            
            div.onmouseover = () => div.style.transform = "translateY(-5px)";
            div.onmouseout = () => div.style.transform = "translateY(0)";

            // Onay durumu badge'i
            const onayBadge = ilan.onayli 
                ? '<span style="position: absolute; top: 10px; right: 10px; background: #2ecc71; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;"><i class="fas fa-check-circle me-1"></i>Onaylı</span>'
                : '<span style="position: absolute; top: 10px; right: 10px; background: #f1c40f; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem;"><i class="fas fa-clock me-1"></i>Onay Bekliyor</span>';

            div.innerHTML = `
                ${onayBadge}
                <h3 style="margin-bottom: 15px; color: #2c3e50; font-size: 1.4rem; padding-right: 80px;">${ilan.baslik || 'Başlık Yok'}</h3>
                <p style="color: #e74c3c; font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
                    ${ilan.fiyat ? ilan.fiyat.toLocaleString() + ' TL' : 'Fiyat Belirtilmemiş'}
                </p>
                <p style="color: #7f8c8d; margin-bottom: 8px;">
                    <i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>
                    ${ilan.konum || 'Konum Belirtilmemiş'}
                </p>
                <p style="color: #7f8c8d; margin-bottom: 8px;">
                    <i class="fas fa-phone" style="margin-right: 5px;"></i>
                    ${ilan.telefon || 'Telefon Belirtilmemiş'}
                </p>
                ${ilan.aciklama ? `<p style="color: #34495e; margin-top: 15px; font-size: 0.9rem;">${ilan.aciklama}</p>` : ''}
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="duzenleIlan('${ilan.id}')" class="btn btn-sm btn-primary">
                        <i class="fas fa-edit me-1"></i>Düzenle
                    </button>
                    <button onclick="silIlan('${ilan.id}')" class="btn btn-sm btn-danger">
                        <i class="fas fa-trash me-1"></i>Sil
                    </button>
                </div>
                <hr style="margin: 15px 0; border-color: #ecf0f1;">
            `;
            
            ilanListesi.appendChild(div);
        });

        return kullaniciIlanlari;
    } catch (error) {
        console.error("Kullanıcı ilanları getirilirken hata oluştu:", error);
        const ilanListesi = document.getElementById("ilanListesi");
        ilanListesi.innerHTML = `
            <div style="grid-column: 1 / -1; color: #e74c3c; text-align: center; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>İlanlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
            </div>
        `;
        return [];
    }
}

// İlan düzenleme fonksiyonu (placeholder)
function duzenleIlan(ilanId) {
    alert('İlan düzenleme özelliği yakında eklenecektir.');
}

// İlan silme fonksiyonu (placeholder)
async function silIlan(ilanId) {
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) {
        return;
    }
    alert('İlan silme özelliği yakında eklenecektir.');
}

// Export the functions
export { getIlanlar, saveData, getKullaniciIlanlari };
