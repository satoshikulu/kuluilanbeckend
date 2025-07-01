const { createStorageUrl } = require('./utils/storage');

// Test senaryoları
function testIlanAPI() {
  console.log('=== İlan API Storage URL Entegrasyon Test ===\n');
  
  const testSupabaseUrl = 'https://zwfidwzilulovjyzphqp.supabase.co';
  const testBucket = 'ilan-fotograflari';
  
  // Test 1: Tek resim URL oluşturma
  console.log('Test 1 - Tek resim URL oluşturma:');
  try {
    const resimUrl = createStorageUrl(testBucket, '/images.jpg', testSupabaseUrl);
    console.log('Resim: "/images.jpg"');
    console.log('Sonuç:', resimUrl);
    console.log('Beklenen:', 'https://zwfidwzilulovjyzphqp.supabase.co/storage/v1/object/public/ilan-fotograflari/images.jpg');
    console.log('Eşleşiyor mu:', resimUrl === 'https://zwfidwzilulovjyzphqp.supabase.co/storage/v1/object/public/ilan-fotograflari/images.jpg');
    console.log('');
  } catch (error) {
    console.error('Test 1 Hatası:', error.message);
  }
  
  // Test 2: Çoklu resim URL oluşturma
  console.log('Test 2 - Çoklu resim URL oluşturma:');
  try {
    const mediaFiles = ['/image1.jpg', 'image2.png', '///image3.gif///'];
    const mediaUrls = mediaFiles.map(file => createStorageUrl(testBucket, file, testSupabaseUrl));
    console.log('Media Files:', mediaFiles);
    console.log('Sonuç:', mediaUrls);
    console.log('');
  } catch (error) {
    console.error('Test 2 Hatası:', error.message);
  }
  
  // Test 3: Örnek ilan verisi simülasyonu
  console.log('Test 3 - Örnek ilan verisi simülasyonu:');
  try {
    const sampleIlan = {
      id: 1,
      ad: '3+1 Satılık Daire',
      fiyat: 500000,
      resim: '/ilan1.jpg',
      media: '/image1.jpg,/image2.png,/image3.jpg',
      kategori: 'satilik-ev',
      mahalle: 'Merkez',
      durum: 'onayli'
    };
    
    // addImageUrls fonksiyonunu simüle et
    const processIlan = (ilan) => {
      const processedIlan = { ...ilan };
      
      // Tek resim URL'si
      if (ilan.resim && ilan.resim.trim()) {
        try {
          processedIlan.resim_url = createStorageUrl(testBucket, ilan.resim, testSupabaseUrl);
        } catch (error) {
          processedIlan.resim_url = null;
        }
      } else {
        processedIlan.resim_url = null;
      }
      
      // Çoklu media URL'leri
      if (ilan.media && ilan.media.trim()) {
        try {
          const mediaFiles = ilan.media.split(',').map(file => file.trim()).filter(file => file);
          processedIlan.media_urls = mediaFiles.map(file => createStorageUrl(testBucket, file, testSupabaseUrl));
        } catch (error) {
          processedIlan.media_urls = [];
        }
      } else {
        processedIlan.media_urls = [];
      }
      
      return processedIlan;
    };
    
    const processedIlan = processIlan(sampleIlan);
    console.log('Orijinal İlan:', JSON.stringify(sampleIlan, null, 2));
    console.log('İşlenmiş İlan:', JSON.stringify(processedIlan, null, 2));
    console.log('');
  } catch (error) {
    console.error('Test 3 Hatası:', error.message);
  }
  
  // Test 4: Çoklu ilan simülasyonu
  console.log('Test 4 - Çoklu ilan simülasyonu:');
  try {
    const sampleIlanlar = [
      {
        id: 1,
        ad: '3+1 Satılık Daire',
        resim: '/ilan1.jpg',
        media: '/image1.jpg,/image2.png'
      },
      {
        id: 2,
        ad: '2+1 Kiralık Daire',
        resim: '/ilan2.jpg',
        media: '/image3.jpg,/image4.png,/image5.jpg'
      },
      {
        id: 3,
        ad: 'Satılık Arsa',
        resim: null,
        media: null
      }
    ];
    
    const processIlanlar = (ilanlar) => {
      return ilanlar.map(ilan => {
        const processedIlan = { ...ilan };
        
        if (ilan.resim && ilan.resim.trim()) {
          try {
            processedIlan.resim_url = createStorageUrl(testBucket, ilan.resim, testSupabaseUrl);
          } catch (error) {
            processedIlan.resim_url = null;
          }
        } else {
          processedIlan.resim_url = null;
        }
        
        if (ilan.media && ilan.media.trim()) {
          try {
            const mediaFiles = ilan.media.split(',').map(file => file.trim()).filter(file => file);
            processedIlan.media_urls = mediaFiles.map(file => createStorageUrl(testBucket, file, testSupabaseUrl));
          } catch (error) {
            processedIlan.media_urls = [];
          }
        } else {
          processedIlan.media_urls = [];
        }
        
        return processedIlan;
      });
    };
    
    const processedIlanlar = processIlanlar(sampleIlanlar);
    console.log('Orijinal İlanlar:', sampleIlanlar);
    console.log('İşlenmiş İlanlar:', processedIlanlar);
    console.log('');
  } catch (error) {
    console.error('Test 4 Hatası:', error.message);
  }
  
  console.log('=== Test Tamamlandı ===');
}

// Testi çalıştır
testIlanAPI(); 