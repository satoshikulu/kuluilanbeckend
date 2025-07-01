const { supabaseService, supabaseAnon } = require('../supabase');

/**
 * SUPABASE CLIENT KULLANIM ÖRNEKLERİ
 * 
 * Bu dosya, farklı senaryolarda hangi client'ın nasıl kullanılacağını gösterir.
 * 
 * 🔐 GÜVENLİK KURALLARI:
 * - Service Role Key: Sadece backend'de, RLS'yi bypass etmek gerektiğinde
 * - Anon Key: Kullanıcı işlemleri, RLS kurallarının geçerli olması gerektiğinde
 */

// =====================================================
// 1. SERVICE ROLE CLIENT KULLANIMI (Backend İşlemleri)
// =====================================================

/**
 * Admin işlemleri - Tüm kullanıcıların verilerine erişim
 */
async function adminGetAllUsers() {
  try {
    console.log('🔧 Admin: Tüm kullanıcıları getiriyor...');
    
    // Service role client kullan - RLS'yi bypass et
    const { data, error } = await supabaseService
      .from('kullanicilar')
      .select('*');
    
    if (error) throw error;
    
    console.log(`✅ ${data.length} kullanıcı bulundu`);
    return data;
  } catch (error) {
    console.error('❌ Admin işlem hatası:', error.message);
    throw error;
  }
}

/**
 * Admin işlemleri - Tüm ilanları yönetme
 */
async function adminGetAllIlanlar() {
  try {
    console.log('🔧 Admin: Tüm ilanları getiriyor...');
    
    // Service role client kullan - RLS'yi bypass et
    const { data, error } = await supabaseService
      .from('ilanlar')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`✅ ${data.length} ilan bulundu`);
    return data;
  } catch (error) {
    console.error('❌ Admin işlem hatası:', error.message);
    throw error;
  }
}

/**
 * Admin işlemleri - İlan durumunu değiştirme
 */
async function adminUpdateIlanDurum(ilanId, yeniDurum) {
  try {
    console.log(`🔧 Admin: İlan ${ilanId} durumunu ${yeniDurum} yapıyor...`);
    
    // Service role client kullan - RLS'yi bypass et
    const { data, error } = await supabaseService
      .from('ilanlar')
      .update({ durum: yeniDurum })
      .eq('id', ilanId)
      .select();
    
    if (error) throw error;
    
    console.log('✅ İlan durumu güncellendi');
    return data[0];
  } catch (error) {
    console.error('❌ Admin işlem hatası:', error.message);
    throw error;
  }
}

/**
 * Sistem işlemleri - Otomatik temizlik
 */
async function systemCleanupExpiredIlanlar() {
  try {
    console.log('🔧 Sistem: Süresi dolmuş ilanları temizliyor...');
    
    // 30 günden eski ilanları sil
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Service role client kullan - RLS'yi bypass et
    const { data, error } = await supabaseService
      .from('ilanlar')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .eq('durum', 'reddedildi');
    
    if (error) throw error;
    
    console.log(`✅ ${data?.length || 0} eski ilan silindi`);
    return data;
  } catch (error) {
    console.error('❌ Sistem işlem hatası:', error.message);
    throw error;
  }
}

// =====================================================
// 2. ANON CLIENT KULLANIMI (Kullanıcı İşlemleri)
// =====================================================

/**
 * Kullanıcı girişi - Auth işlemleri
 */
async function userLogin(email, password) {
  try {
    console.log(`🔐 Kullanıcı girişi: ${email}`);
    
    // Anon client kullan - Auth işlemleri için
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    console.log('✅ Kullanıcı girişi başarılı');
    return data;
  } catch (error) {
    console.error('❌ Giriş hatası:', error.message);
    throw error;
  }
}

/**
 * Kullanıcı kaydı - Auth işlemleri
 */
async function userSignup(email, password, userData) {
  try {
    console.log(`🔐 Kullanıcı kaydı: ${email}`);
    
    // Anon client kullan - Auth işlemleri için
    const { data, error } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    
    console.log('✅ Kullanıcı kaydı başarılı');
    return data;
  } catch (error) {
    console.error('❌ Kayıt hatası:', error.message);
    throw error;
  }
}

/**
 * Kullanıcının kendi ilanlarını getirme - RLS kuralları geçerli
 */
async function userGetOwnIlanlar(userToken) {
  try {
    console.log('👤 Kullanıcı: Kendi ilanlarını getiriyor...');
    
    // Anon client kullan - RLS kuralları geçerli
    const { data, error } = await supabaseAnon
      .from('ilanlar')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`✅ ${data.length} ilan bulundu (RLS ile filtrelendi)`);
    return data;
  } catch (error) {
    console.error('❌ Kullanıcı işlem hatası:', error.message);
    throw error;
  }
}

/**
 * Kullanıcının kendi ilanını ekleme - RLS kuralları geçerli
 */
async function userAddIlan(ilanData, userToken) {
  try {
    console.log('👤 Kullanıcı: Yeni ilan ekliyor...');
    
    // Anon client kullan - RLS kuralları geçerli
    const { data, error } = await supabaseAnon
      .from('ilanlar')
      .insert([ilanData])
      .select();
    
    if (error) throw error;
    
    console.log('✅ İlan eklendi (RLS ile korundu)');
    return data[0];
  } catch (error) {
    console.error('❌ Kullanıcı işlem hatası:', error.message);
    throw error;
  }
}

// =====================================================
// 3. KARŞILAŞTIRMA ÖRNEKLERİ
// =====================================================

/**
 * Aynı işlemi farklı client'larla yapma karşılaştırması
 */
async function compareClientUsage() {
  console.log('\n=== CLIENT KULLANIM KARŞILAŞTIRMASI ===\n');
  
  try {
    // 1. Service Role ile tüm ilanları getir (RLS bypass)
    console.log('1️⃣ Service Role Client - Tüm ilanlar:');
    const { data: allIlanlar } = await supabaseService
      .from('ilanlar')
      .select('count');
    console.log(`   Toplam ilan sayısı: ${allIlanlar?.length || 0}\n`);
    
    // 2. Anon Client ile ilanları getir (RLS aktif)
    console.log('2️⃣ Anon Client - RLS ile filtrelenmiş ilanlar:');
    const { data: filteredIlanlar } = await supabaseAnon
      .from('ilanlar')
      .select('count');
    console.log(`   Görülebilir ilan sayısı: ${filteredIlanlar?.length || 0}\n`);
    
    // 3. Farkı göster
    const difference = (allIlanlar?.length || 0) - (filteredIlanlar?.length || 0);
    console.log(`📊 Fark: ${difference} ilan RLS tarafından gizlendi\n`);
    
  } catch (error) {
    console.error('❌ Karşılaştırma hatası:', error.message);
  }
}

// =====================================================
// 4. GÜVENLİK ÖRNEKLERİ
// =====================================================

/**
 * Güvenli client seçimi örneği
 */
function selectClientForOperation(operationType, userContext = null) {
  console.log(`🔍 İşlem türü: ${operationType}`);
  
  switch (operationType) {
    case 'admin_read_all':
    case 'admin_write_all':
    case 'system_cleanup':
    case 'data_migration':
      console.log('   → Service Role Client kullanılmalı');
      return supabaseService;
      
    case 'user_auth':
    case 'user_read_own':
    case 'user_write_own':
    case 'public_read':
      console.log('   → Anon Client kullanılmalı (RLS aktif)');
      return supabaseAnon;
      
    default:
      console.log('   → Varsayılan: Anon Client (güvenli)');
      return supabaseAnon;
  }
}

/**
 * Güvenli veri okuma örneği
 */
async function secureDataRead(userId, isAdmin = false) {
  try {
    if (isAdmin) {
      // Admin: Service role ile tüm verileri oku
      console.log('👑 Admin: Tüm verileri okuyor...');
      const { data, error } = await supabaseService
        .from('ilanlar')
        .select('*');
      
      if (error) throw error;
      return data;
    } else {
      // Kullanıcı: Anon client ile sadece kendi verilerini oku
      console.log('👤 Kullanıcı: Kendi verilerini okuyor...');
      const { data, error } = await supabaseAnon
        .from('ilanlar')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('❌ Veri okuma hatası:', error.message);
    throw error;
  }
}

// =====================================================
// 5. TEST FONKSİYONLARI
// =====================================================

/**
 * Tüm örnekleri test et
 */
async function runAllExamples() {
  console.log('🚀 SUPABASE CLIENT KULLANIM ÖRNEKLERİ\n');
  
  try {
    // 1. Client karşılaştırması
    await compareClientUsage();
    
    // 2. Güvenli client seçimi
    console.log('=== GÜVENLİ CLIENT SEÇİMİ ===');
    selectClientForOperation('admin_read_all');
    selectClientForOperation('user_read_own');
    selectClientForOperation('public_read');
    
    // 3. Güvenli veri okuma
    console.log('\n=== GÜVENLİ VERİ OKUMA ===');
    await secureDataRead('user123', false); // Kullanıcı
    await secureDataRead('user123', true);  // Admin
    
    console.log('\n✅ Tüm örnekler tamamlandı!');
    
  } catch (error) {
    console.error('\n❌ Test hatası:', error.message);
  }
}

// =====================================================
// 6. EXPORT FONKSİYONLARI
// =====================================================

module.exports = {
  // Service Role fonksiyonları
  adminGetAllUsers,
  adminGetAllIlanlar,
  adminUpdateIlanDurum,
  systemCleanupExpiredIlanlar,
  
  // Anon Client fonksiyonları
  userLogin,
  userSignup,
  userGetOwnIlanlar,
  userAddIlan,
  
  // Yardımcı fonksiyonlar
  compareClientUsage,
  selectClientForOperation,
  secureDataRead,
  runAllExamples
};

// Basit Supabase bağlantı testi
async function testSupabaseConnection() {
  console.log('🔌 Supabase bağlantı testi başlatılıyor...');
  try {
    const { data, error } = await supabaseService
      .from('ilanlar')
      .select('*')
      .limit(1);
    if (error) throw error;
    console.log('✅ Supabase bağlantısı başarılı. Örnek veri:', data);
  } catch (err) {
    console.error('❌ Supabase bağlantı hatası:', err.message);
  }
}

// Test çalıştırma
if (require.main === module) {
  testSupabaseConnection();
  runAllExamples();
}