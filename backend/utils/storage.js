/**
 * Supabase Storage URL'sini güvenli bir şekilde oluşturur
 * @param {string} bucket - Storage bucket adı
 * @param {string} file - Dosya yolu
 * @param {string} supabaseUrl - Supabase proje URL'si (opsiyonel, env'den alınır)
 * @returns {string} Tam Supabase Storage URL'si
 */
function createStorageUrl(bucket, file, supabaseUrl = null) {
  try {
    // Supabase URL'sini al
    const baseUrl = supabaseUrl || process.env.SUPABASE_URL;
    
    if (!baseUrl) {
      throw new Error('Supabase URL bulunamadı. Lütfen SUPABASE_URL environment variable\'ını kontrol edin.');
    }
    
    if (!bucket) {
      throw new Error('Bucket adı gerekli.');
    }
    
    if (!file) {
      throw new Error('Dosya yolu gerekli.');
    }
    
    // Bucket ve file parametrelerini temizle
    const cleanBucket = bucket.replace(/^\/+|\/+$/g, ''); // Başındaki ve sonundaki slash'leri kaldır
    const cleanFile = file.replace(/^\/+|\/+$/g, ''); // Başındaki ve sonundaki slash'leri kaldır
    
    // Boş string kontrolü
    if (!cleanBucket) {
      throw new Error('Bucket adı boş olamaz.');
    }
    
    if (!cleanFile) {
      throw new Error('Dosya yolu boş olamaz.');
    }
    
    // URL'yi oluştur
    const storageUrl = `${baseUrl}/storage/v1/object/public/${cleanBucket}/${cleanFile}`;
    
    return storageUrl;
    
  } catch (error) {
    console.error('Storage URL oluşturma hatası:', error.message);
    throw error;
  }
}

/**
 * Birden fazla dosya için Storage URL'lerini oluşturur
 * @param {string} bucket - Storage bucket adı
 * @param {string[]} files - Dosya yolları dizisi
 * @param {string} supabaseUrl - Supabase proje URL'si (opsiyonel)
 * @returns {string[]} Tam Supabase Storage URL'leri dizisi
 */
function createMultipleStorageUrls(bucket, files, supabaseUrl = null) {
  if (!Array.isArray(files)) {
    throw new Error('Files parametresi bir dizi olmalıdır.');
  }
  
  return files.map(file => createStorageUrl(bucket, file, supabaseUrl));
}

module.exports = {
  createStorageUrl,
  createMultipleStorageUrls
}; 