const { supabase } = require('../supabase');

/**
 * İlanlar tablosunun RLS durumunu kontrol eder
 * @returns {Promise<Object>} RLS durumu ve politikaları
 */
async function checkRLSStatus() {
  try {
    console.log('🔍 RLS Durumu Kontrol Ediliyor...\n');

    // 1. RLS'nin aktif olup olmadığını kontrol et
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            c.relname as "Tablo Adı",
            c.relrowsecurity as "RLS Aktif",
            c.relforcerowsecurity as "RLS Zorunlu",
            CASE 
              WHEN c.relrowsecurity THEN 'GÜVENLİK AKTİF'
              ELSE 'GÜVENLİK PASİF'
            END as "Güvenlik Durumu"
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = 'ilanlar'
        `
      });

    if (rlsError) {
      console.error('❌ RLS durumu kontrol edilemedi:', rlsError.message);
      return { error: rlsError.message };
    }

    // 2. Mevcut RLS politikalarını listele
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            p.policyname as "Politika Adı",
            p.cmd as "Komut Türü",
            CASE 
              WHEN p.permissive THEN 'İZİN VER'
              ELSE 'REDDET'
            END as "Politika Türü",
            p.roles as "Uygulandığı Roller",
            p.qual as "WHERE Koşulu",
            p.with_check as "WITH CHECK Koşulu"
          FROM pg_policies p
          WHERE p.tablename = 'ilanlar'
          ORDER BY p.policyname
        `
      });

    if (policiesError) {
      console.error('❌ Politikalar listelenemedi:', policiesError.message);
      return { error: policiesError.message };
    }

    // 3. Tablo yetkilerini kontrol et
    const { data: privileges, error: privilegesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            grantee as "Yetki Verilen",
            privilege_type as "Yetki Türü",
            is_grantable as "Yetki Verilebilir"
          FROM information_schema.table_privileges 
          WHERE table_name = 'ilanlar'
          AND table_schema = 'public'
          ORDER BY grantee, privilege_type
        `
      });

    if (privilegesError) {
      console.error('❌ Yetkiler kontrol edilemedi:', privilegesError.message);
      return { error: privilegesError.message };
    }

    // 4. Mevcut kullanıcı bilgisini al
    const { data: currentUser, error: userError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT current_user as "Mevcut Kullanıcı"`
      });

    if (userError) {
      console.error('❌ Kullanıcı bilgisi alınamadı:', userError.message);
      return { error: userError.message };
    }

    const result = {
      rlsStatus: rlsStatus?.[0] || null,
      policies: policies || [],
      privileges: privileges || [],
      currentUser: currentUser?.[0] || null,
      summary: {
        rlsEnabled: rlsStatus?.[0]?.['RLS Aktif'] || false,
        policyCount: policies?.length || 0,
        hasPolicies: (policies?.length || 0) > 0
      }
    };

    // Sonuçları konsola yazdır
    console.log('📊 RLS DURUMU:');
    console.log('================');
    if (result.rlsStatus) {
      console.log(`Tablo: ${result.rlsStatus['Tablo Adı']}`);
      console.log(`RLS Aktif: ${result.rlsStatus['RLS Aktif'] ? '✅ EVET' : '❌ HAYIR'}`);
      console.log(`RLS Zorunlu: ${result.rlsStatus['RLS Zorunlu'] ? '✅ EVET' : '❌ HAYIR'}`);
      console.log(`Durum: ${result.rlsStatus['Güvenlik Durumu']}`);
    }

    console.log('\n👤 MEVCUT KULLANICI:');
    console.log('====================');
    if (result.currentUser) {
      console.log(`Kullanıcı: ${result.currentUser['Mevcut Kullanıcı']}`);
    }

    console.log('\n🔐 RLS POLİTİKALARI:');
    console.log('====================');
    if (result.policies.length > 0) {
      result.policies.forEach((policy, index) => {
        console.log(`${index + 1}. ${policy['Politika Adı']}`);
        console.log(`   İşlem: ${policy['Komut Türü']}`);
        console.log(`   Tür: ${policy['Politika Türü']}`);
        console.log(`   Roller: ${policy['Uygulandığı Roller']?.join(', ') || 'Tümü'}`);
        if (policy['WHERE Koşulu']) {
          console.log(`   WHERE: ${policy['WHERE Koşulu']}`);
        }
        if (policy['WITH CHECK Koşulu']) {
          console.log(`   WITH CHECK: ${policy['WITH CHECK Koşulu']}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ Hiç RLS politikası tanımlanmamış!');
    }

    console.log('\n🔑 TABLO YETKİLERİ:');
    console.log('===================');
    if (result.privileges.length > 0) {
      result.privileges.forEach((priv, index) => {
        console.log(`${index + 1}. ${priv['Yetki Verilen']} - ${priv['Yetki Türü']} ${priv['Yetki Verilebilir'] ? '(Verilebilir)' : ''}`);
      });
    } else {
      console.log('❌ Yetki bilgisi alınamadı');
    }

    console.log('\n📋 ÖZET:');
    console.log('========');
    console.log(`RLS Aktif: ${result.summary.rlsEnabled ? '✅' : '❌'}`);
    console.log(`Politika Sayısı: ${result.summary.policyCount}`);
    console.log(`Güvenlik Durumu: ${result.summary.hasPolicies ? '🔒 Güvenli' : '⚠️ Güvensiz'}`);

    return result;

  } catch (error) {
    console.error('❌ RLS kontrol hatası:', error.message);
    return { error: error.message };
  }
}

/**
 * RLS politikası oluşturma örnekleri
 * @returns {Object} Örnek RLS politikaları
 */
function getRLSExamples() {
  return {
    examples: [
      {
        name: "Onaylı ilanları herkes görebilir",
        sql: `CREATE POLICY "Onaylı ilanları herkes görebilir" ON ilanlar
    FOR SELECT USING (durum = 'onayli');`,
        description: "Sadece onaylı ilanların görüntülenmesine izin verir"
      },
      {
        name: "Kullanıcılar kendi ilanlarını düzenleyebilir",
        sql: `CREATE POLICY "Kullanıcılar kendi ilanlarını düzenleyebilir" ON ilanlar
    FOR UPDATE USING (auth.uid() = user_id);`,
        description: "Kullanıcıların sadece kendi ilanlarını güncelleyebilmesini sağlar"
      },
      {
        name: "Admin tüm işlemleri yapabilir",
        sql: `CREATE POLICY "Admin tüm işlemleri yapabilir" ON ilanlar
    FOR ALL USING (auth.role() = 'admin');`,
        description: "Admin rolündeki kullanıcıların tüm işlemleri yapabilmesini sağlar"
      },
      {
        name: "Anonim kullanıcılar sadece okuyabilir",
        sql: `CREATE POLICY "Anonim kullanıcılar sadece okuyabilir" ON ilanlar
    FOR SELECT USING (true);`,
        description: "Giriş yapmamış kullanıcıların sadece okuma yapabilmesini sağlar"
      }
    ],
    enableRLS: `ALTER TABLE ilanlar ENABLE ROW LEVEL SECURITY;`,
    disableRLS: `ALTER TABLE ilanlar DISABLE ROW LEVEL SECURITY;`
  };
}

/**
 * RLS test fonksiyonu
 * @returns {Promise<Object>} Test sonuçları
 */
async function testRLS() {
  try {
    console.log('🧪 RLS Test Ediliyor...\n');

    // Basit SELECT testi
    const { data: selectTest, error: selectError } = await supabase
      .from('ilanlar')
      .select('id, ad')
      .limit(1);

    console.log('SELECT Test Sonucu:');
    console.log('Veri alındı:', selectTest ? '✅' : '❌');
    console.log('Hata:', selectError ? selectError.message : 'Yok');
    console.log('Kayıt sayısı:', selectTest?.length || 0);

    return {
      selectTest: {
        success: !selectError,
        data: selectTest,
        error: selectError?.message
      }
    };

  } catch (error) {
    console.error('❌ RLS test hatası:', error.message);
    return { error: error.message };
  }
}

module.exports = {
  checkRLSStatus,
  getRLSExamples,
  testRLS
}; 