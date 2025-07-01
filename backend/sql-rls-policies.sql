-- =====================================================
-- İLANLAR TABLOSU İÇİN RLS POLİTİKALARI
-- =====================================================

-- 1. Önce RLS'yi aktif et
ALTER TABLE ilanlar ENABLE ROW LEVEL SECURITY;

-- 2. user_id sütununu ekle (eğer yoksa)
-- ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
-- ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS created_by TEXT;

-- =====================================================
-- RLS POLİTİKALARI
-- =====================================================

-- 1. Tüm kullanıcılar onaylı ilanları görebilir
CREATE POLICY "Onaylı ilanları herkes görebilir" ON ilanlar
    FOR SELECT USING (durum = 'onayli' OR durum = 'approved');

-- 2. Kullanıcılar kendi ilanlarını görebilir (onaylı olmasa bile)
CREATE POLICY "Kullanıcılar kendi ilanlarını görebilir" ON ilanlar
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Kullanıcılar kendi ilanlarını ekleyebilir
CREATE POLICY "Kullanıcılar kendi ilanlarını ekleyebilir" ON ilanlar
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Kullanıcılar kendi ilanlarını güncelleyebilir
CREATE POLICY "Kullanıcılar kendi ilanlarını güncelleyebilir" ON ilanlar
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Kullanıcılar kendi ilanlarını silebilir
CREATE POLICY "Kullanıcılar kendi ilanlarını silebilir" ON ilanlar
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Admin kullanıcılar tüm işlemleri yapabilir
CREATE POLICY "Admin tüm işlemleri yapabilir" ON ilanlar
    FOR ALL USING (
        auth.role() = 'admin' OR 
        auth.role() = 'service_role' OR
        (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin'
    );

-- 7. Anonim kullanıcılar sadece onaylı ilanları görebilir
CREATE POLICY "Anonim kullanıcılar onaylı ilanları görebilir" ON ilanlar
    FOR SELECT USING (
        auth.role() = 'anon' AND (durum = 'onayli' OR durum = 'approved')
    );

-- =====================================================
-- OPSİYONEL: GELİŞMİŞ POLİTİKALAR
-- =====================================================

-- 8. Kullanıcılar sadece belirli durumlarda ilan ekleyebilir
-- CREATE POLICY "Kullanıcılar sadece beklemede durumunda ilan ekleyebilir" ON ilanlar
--     FOR INSERT WITH CHECK (
--         auth.uid() = user_id AND 
--         (durum = 'beklemede' OR durum = 'pending' OR durum IS NULL)
--     );

-- 9. Kullanıcılar sadece kendi ilanlarının durumunu 'beklemede' yapabilir
-- CREATE POLICY "Kullanıcılar sadece kendi ilanlarının durumunu değiştirebilir" ON ilanlar
--     FOR UPDATE USING (
--         auth.uid() = user_id AND 
--         (durum = 'beklemede' OR durum = 'pending')
--     );

-- =====================================================
-- POLİTİKA KONTROL SORGULARI
-- =====================================================

-- Mevcut politikaları listele
SELECT 
    policyname as "Politika Adı",
    cmd as "Komut Türü",
    CASE 
        WHEN permissive THEN 'İZİN VER'
        ELSE 'REDDET'
    END as "Politika Türü",
    roles as "Uygulandığı Roller",
    qual as "WHERE Koşulu",
    with_check as "WITH CHECK Koşulu"
FROM pg_policies 
WHERE tablename = 'ilanlar'
ORDER BY policyname;

-- RLS durumunu kontrol et
SELECT 
    c.relname as "Tablo Adı",
    c.relrowsecurity as "RLS Aktif",
    CASE 
        WHEN c.relrowsecurity THEN 'GÜVENLİK AKTİF'
        ELSE 'GÜVENLİK PASİF'
    END as "Güvenlik Durumu"
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'ilanlar';

-- =====================================================
-- TEST SORGULARI
-- =====================================================

-- Test 1: Onaylı ilanları listele
-- SELECT COUNT(*) FROM ilanlar WHERE durum = 'onayli';

-- Test 2: Kullanıcının kendi ilanlarını listele (auth.uid() ile)
-- SELECT COUNT(*) FROM ilanlar WHERE user_id = auth.uid();

-- =====================================================
-- POLİTİKA SİLME (GEREKİRSE)
-- =====================================================

-- Tüm politikaları silmek için:
-- DROP POLICY IF EXISTS "Onaylı ilanları herkes görebilir" ON ilanlar;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını görebilir" ON ilanlar;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını ekleyebilir" ON ilanlar;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını güncelleyebilir" ON ilanlar;
-- DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını silebilir" ON ilanlar;
-- DROP POLICY IF EXISTS "Admin tüm işlemleri yapabilir" ON ilanlar;
-- DROP POLICY IF EXISTS "Anonim kullanıcılar onaylı ilanları görebilir" ON ilanlar;

-- RLS'yi kapatmak için:
-- ALTER TABLE ilanlar DISABLE ROW LEVEL SECURITY; 