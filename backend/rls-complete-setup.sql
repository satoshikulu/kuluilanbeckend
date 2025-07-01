-- =====================================================
-- KULU-EMLAK BACKEND - TAM RLS KURULUMU
-- =====================================================
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- Tüm RLS politikalarını ve güvenlik ayarlarını kurar
-- =====================================================

-- 1. İLANLAR TABLOSU YAPISINI KONTROL ET VE GÜNCELLE
-- =====================================================

-- user_id sütununu ekle (eğer yoksa)
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- created_by sütununu ekle (eğer yoksa)
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS created_by TEXT;

-- updated_by sütununu ekle (eğer yoksa)
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- 2. RLS'Yİ AKTİF ET
-- =====================================================
ALTER TABLE ilanlar ENABLE ROW LEVEL SECURITY;

-- 3. MEVCUT POLİTİKALARI TEMİZLE (EĞER VARSA)
-- =====================================================
DROP POLICY IF EXISTS "Kendi ilanlarını görebilir" ON ilanlar;
DROP POLICY IF EXISTS "Kendi ilanını ekleyebilir" ON ilanlar;
DROP POLICY IF EXISTS "Kendi ilanını güncelleyebilir" ON ilanlar;
DROP POLICY IF EXISTS "Kendi ilanını silebilir" ON ilanlar;
DROP POLICY IF EXISTS "Admin her şeyi görebilir" ON ilanlar;
DROP POLICY IF EXISTS "Onaylı ilanları herkes görebilir" ON ilanlar;
DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını görebilir" ON ilanlar;
DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını ekleyebilir" ON ilanlar;
DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını güncelleyebilir" ON ilanlar;
DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını silebilir" ON ilanlar;
DROP POLICY IF EXISTS "Admin tüm işlemleri yapabilir" ON ilanlar;
DROP POLICY IF EXISTS "Anonim kullanıcılar onaylı ilanları görebilir" ON ilanlar;

-- 4. YENİ RLS POLİTİKALARINI OLUŞTUR
-- =====================================================

-- Politika 1: Tüm kullanıcılar onaylı ilanları görebilir
CREATE POLICY "Onaylı ilanları herkes görebilir" ON ilanlar
    FOR SELECT USING (durum = 'onayli' OR durum = 'approved');

-- Politika 2: Kullanıcılar kendi ilanlarını görebilir (onaylı olmasa bile)
CREATE POLICY "Kullanıcılar kendi ilanlarını görebilir" ON ilanlar
    FOR SELECT USING (auth.uid() = user_id);

-- Politika 3: Kullanıcılar kendi ilanlarını ekleyebilir
CREATE POLICY "Kullanıcılar kendi ilanlarını ekleyebilir" ON ilanlar
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politika 4: Kullanıcılar kendi ilanlarını güncelleyebilir
CREATE POLICY "Kullanıcılar kendi ilanlarını güncelleyebilir" ON ilanlar
    FOR UPDATE USING (auth.uid() = user_id);

-- Politika 5: Kullanıcılar kendi ilanlarını silebilir
CREATE POLICY "Kullanıcılar kendi ilanlarını silebilir" ON ilanlar
    FOR DELETE USING (auth.uid() = user_id);

-- Politika 6: Admin kullanıcılar tüm işlemleri yapabilir
CREATE POLICY "Admin tüm işlemleri yapabilir" ON ilanlar
    FOR ALL USING (
        auth.role() = 'admin' OR 
        auth.role() = 'service_role' OR
        (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
    );

-- Politika 7: Anonim kullanıcılar sadece onaylı ilanları görebilir
CREATE POLICY "Anonim kullanıcılar onaylı ilanları görebilir" ON ilanlar
    FOR SELECT USING (
        auth.role() = 'anon' AND (durum = 'onayli' OR durum = 'approved')
    );

-- 5. KULLANICILAR TABLOSU İÇİN RLS (OPSİYONEL)
-- =====================================================

-- Kullanıcılar tablosu için RLS aktif et (eğer varsa)
ALTER TABLE kullanicilar ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi verilerini görebilir
CREATE POLICY "Kullanıcılar kendi verilerini görebilir" ON kullanicilar
    FOR SELECT USING (auth.uid()::text = telefon OR auth.uid() = id);

-- Kullanıcılar kendi verilerini güncelleyebilir
CREATE POLICY "Kullanıcılar kendi verilerini güncelleyebilir" ON kullanicilar
    FOR UPDATE USING (auth.uid()::text = telefon OR auth.uid() = id);

-- 6. TRIGGER FONKSİYONLARI (OPSİYONEL)
-- =====================================================

-- İlan eklenirken otomatik olarak user_id ve created_by ekle
CREATE OR REPLACE FUNCTION set_ilan_user_info()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    NEW.created_by = auth.email();
    NEW.updated_by = auth.email();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İlan güncellenirken updated_by güncelle
CREATE OR REPLACE FUNCTION update_ilan_user_info()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.email();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ları oluştur
DROP TRIGGER IF EXISTS set_ilan_user_info_trigger ON ilanlar;
CREATE TRIGGER set_ilan_user_info_trigger
    BEFORE INSERT ON ilanlar
    FOR EACH ROW
    EXECUTE FUNCTION set_ilan_user_info();

DROP TRIGGER IF EXISTS update_ilan_user_info_trigger ON ilanlar;
CREATE TRIGGER update_ilan_user_info_trigger
    BEFORE UPDATE ON ilanlar
    FOR EACH ROW
    EXECUTE FUNCTION update_ilan_user_info();

-- 7. KONTROL SORGULARI
-- =====================================================

-- RLS durumunu kontrol et
SELECT 
    c.relname as "Tablo Adı",
    c.relrowsecurity as "RLS Aktif",
    CASE 
        WHEN c.relrowsecurity THEN '✅ GÜVENLİK AKTİF'
        ELSE '❌ GÜVENLİK PASİF'
    END as "Güvenlik Durumu"
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('ilanlar', 'kullanicilar')
ORDER BY c.relname;

-- Oluşturulan politikaları listele
SELECT 
    tablename as "Tablo",
    policyname as "Politika Adı",
    cmd as "İşlem Türü",
    CASE 
        WHEN permissive THEN '✅ İZİN VER'
        ELSE '❌ REDDET'
    END as "Tür",
    qual as "WHERE Koşulu",
    with_check as "WITH CHECK Koşulu"
FROM pg_policies 
WHERE tablename IN ('ilanlar', 'kullanicilar')
ORDER BY tablename, policyname;

-- 8. TEST VERİLERİ (OPSİYONEL)
-- =====================================================

-- Test kullanıcısı oluştur (eğer yoksa)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role)
-- VALUES (
--     gen_random_uuid(),
--     'test@kuluemlak.com',
--     crypt('test123', gen_salt('bf')),
--     now(),
--     now(),
--     now(),
--     'user'
-- ) ON CONFLICT (email) DO NOTHING;

-- 9. GÜVENLİK KONTROL LİSTESİ
-- =====================================================

/*
✅ RLS KURULUM TAMAMLANDI

GÜVENLİK KONTROL LİSTESİ:

1. ✅ RLS aktif edildi
2. ✅ user_id sütunu eklendi
3. ✅ Politikalar oluşturuldu
4. ✅ Admin yetkileri tanımlandı
5. ✅ Anonim erişim kısıtlandı
6. ✅ Trigger'lar eklendi (opsiyonel)

TEST EDİLECEKLER:

1. Kullanıcı girişi yapıp kendi ilanlarını görebilme
2. Kullanıcı sadece kendi ilanlarını düzenleyebilme
3. Anonim kullanıcılar sadece onaylı ilanları görebilme
4. Admin tüm ilanları görebilme ve düzenleyebilme
5. Kullanıcı başka kullanıcının ilanlarına erişememe

NOTLAR:

- auth.uid() sadece JWT token varsa çalışır
- Service role tüm işlemleri yapabilir
- Backend'de user_id manuel ekleniyorsa RLS çalışır
- Frontend'den Authorization header ile token gönderilmeli
*/

-- 10. YARDIMCI FONKSİYONLAR
-- =====================================================

-- Kullanıcının ilan sayısını getiren fonksiyon
CREATE OR REPLACE FUNCTION get_user_ilan_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM ilanlar 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının onaylı ilan sayısını getiren fonksiyon
CREATE OR REPLACE FUNCTION get_user_approved_ilan_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM ilanlar 
        WHERE user_id = user_uuid AND (durum = 'onayli' OR durum = 'approved')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- KURULUM TAMAMLANDI
-- ===================================================== 