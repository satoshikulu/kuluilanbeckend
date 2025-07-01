const { createStorageUrl, createMultipleStorageUrls } = require('./utils/storage');

// Test senaryoları
function testStorageUrl() {
  console.log('=== Supabase Storage URL Test ===\n');
  
  const testSupabaseUrl = 'https://zwfidwzilulovjyzphqp.supabase.co';
  
  // Test 1: Normal durum
  try {
    const url1 = createStorageUrl('ilan-fotograflari/', '/images.jpg', testSupabaseUrl);
    console.log('Test 1 - Normal durum:');
    console.log('Bucket: "ilan-fotograflari/"');
    console.log('File: "/images.jpg"');
    console.log('Sonuç:', url1);
    console.log('');
  } catch (error) {
    console.error('Test 1 Hatası:', error.message);
  }
  
  // Test 2: Çoklu slash
  try {
    const url2 = createStorageUrl('///ilan-fotograflari///', '///images.jpg///', testSupabaseUrl);
    console.log('Test 2 - Çoklu slash:');
    console.log('Bucket: "///ilan-fotograflari///"');
    console.log('File: "///images.jpg///"');
    console.log('Sonuç:', url2);
    console.log('');
  } catch (error) {
    console.error('Test 2 Hatası:', error.message);
  }
  
  // Test 3: Boş string
  try {
    const url3 = createStorageUrl('', 'images.jpg', testSupabaseUrl);
    console.log('Test 3 - Boş bucket:');
    console.log('Bucket: ""');
    console.log('File: "images.jpg"');
    console.log('Sonuç:', url3);
    console.log('');
  } catch (error) {
    console.error('Test 3 Hatası:', error.message);
  }
  
  // Test 4: Çoklu dosya
  try {
    const urls = createMultipleStorageUrls('ilan-fotograflari', [
      '/image1.jpg',
      'image2.png',
      '///image3.gif///'
    ], testSupabaseUrl);
    console.log('Test 4 - Çoklu dosya:');
    console.log('Bucket: "ilan-fotograflari"');
    console.log('Files: ["/image1.jpg", "image2.png", "///image3.gif///"]');
    console.log('Sonuç:', urls);
    console.log('');
  } catch (error) {
    console.error('Test 4 Hatası:', error.message);
  }
  
  // Test 5: Özel Supabase URL ile
  try {
    const customUrl = createStorageUrl(
      'ilan-fotograflari/', 
      '/images.jpg', 
      testSupabaseUrl
    );
    console.log('Test 5 - Özel URL ile:');
    console.log('Bucket: "ilan-fotograflari/"');
    console.log('File: "/images.jpg"');
    console.log('Custom URL: "https://zwfidwzilulovjyzphqp.supabase.co"');
    console.log('Sonuç:', customUrl);
    console.log('');
  } catch (error) {
    console.error('Test 5 Hatası:', error.message);
  }
  
  // Test 6: Sizin verdiğiniz örnek
  try {
    const exampleUrl = createStorageUrl('ilan-fotograflari/', '/images.jpg', testSupabaseUrl);
    console.log('Test 6 - Sizin örneğiniz:');
    console.log('Bucket: "ilan-fotograflari/"');
    console.log('File: "/images.jpg"');
    console.log('Beklenen: https://zwfidwzilulovjyzphqp.supabase.co/storage/v1/object/public/ilan-fotograflari/images.jpg');
    console.log('Sonuç:', exampleUrl);
    console.log('Eşleşiyor mu:', exampleUrl === 'https://zwfidwzilulovjyzphqp.supabase.co/storage/v1/object/public/ilan-fotograflari/images.jpg');
    console.log('');
  } catch (error) {
    console.error('Test 6 Hatası:', error.message);
  }
}

// Testi çalıştır
testStorageUrl(); 