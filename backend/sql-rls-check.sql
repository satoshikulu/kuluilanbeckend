-- =====================================================
-- SUPABASE RLS (Row-Level Security) KONTROL SORGULARI
-- =====================================================

-- 1. İLANLAR TABLOSUNDA RLS'NİN AKTİF OLUP OLMADIĞINI KONTROL ET
-- =====================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_aktif
FROM pg_tables 
WHERE tablename = 'ilanlar';

-- Alternatif sorgu (daha detaylı bilgi için):
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    CASE 
        WHEN c.relrowsecurity THEN 'AKTİF'
        ELSE 'PASİF'
    END as rls_durum
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'ilanlar' 
AND c.relkind = 'r';

-- =====================================================
-- 2. İLANLAR TABLOSUNDA TANIMLI RLS POLİTİKALARINI LİSTELE
-- =====================================================

-- Tüm RLS politikalarını listele
SELECT 
    schemaname,
    tablename,
    policyname as policy_adi,
    permissive,
    roles,
    cmd,
    qual as policy_kosulu,
    with_check as check_kosulu
FROM pg_policies 
WHERE tablename = 'ilanlar'
ORDER BY policyname;

-- Daha okunabilir format için:
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
ORDER BY p.policyname;

-- =====================================================
-- 3. İLANLAR TABLOSUNUN GENEL GÜVENLİK DURUMU
-- =====================================================

-- Tablo güvenlik ayarlarını kontrol et
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
WHERE c.relname = 'ilanlar';

-- =====================================================
-- 4. MEVCUT KULLANICI ROLÜNÜ VE YETKİLERİNİ KONTROL ET
-- =====================================================

-- Mevcut kullanıcı bilgisi
SELECT current_user as "Mevcut Kullanıcı";

-- Kullanıcının rolleri
SELECT 
    r.rolname as "Rol Adı",
    r.rolsuper as "Süper Kullanıcı",
    r.rolinherit as "Rol Mirası",
    r.rolcreaterole as "Rol Oluşturabilir",
    r.rolcreatedb as "DB Oluşturabilir",
    r.rolcanlogin as "Giriş Yapabilir"
FROM pg_roles r
WHERE r.rolname = current_user;

-- =====================================================
-- 5. İLANLAR TABLOSUNA ERİŞİM YETKİLERİNİ KONTROL ET
-- =====================================================

-- Tablo yetkilerini kontrol et
SELECT 
    grantee as "Yetki Verilen",
    privilege_type as "Yetki Türü",
    is_grantable as "Yetki Verilebilir"
FROM information_schema.table_privileges 
WHERE table_name = 'ilanlar'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- =====================================================
-- 6. RLS POLİTİKALARININ DETAYLI ANALİZİ
-- =====================================================

-- RLS politikalarının detaylı analizi
WITH policy_details AS (
    SELECT 
        p.policyname,
        p.cmd,
        p.permissive,
        p.roles,
        p.qual,
        p.with_check,
        CASE 
            WHEN p.cmd = 'ALL' THEN 'TÜM İŞLEMLER'
            WHEN p.cmd = 'SELECT' THEN 'OKUMA'
            WHEN p.cmd = 'INSERT' THEN 'EKLEME'
            WHEN p.cmd = 'UPDATE' THEN 'GÜNCELLEME'
            WHEN p.cmd = 'DELETE' THEN 'SİLME'
            ELSE p.cmd
        END as islem_turu
    FROM pg_policies p
    WHERE p.tablename = 'ilanlar'
)
SELECT 
    policyname as "Politika Adı",
    islem_turu as "İşlem Türü",
    CASE 
        WHEN permissive THEN 'İZİN VER'
        ELSE 'REDDET'
    END as "Politika Türü",
    roles as "Hedef Roller",
    qual as "WHERE Koşulu",
    with_check as "WITH CHECK Koşulu"
FROM policy_details
ORDER BY policyname;

-- =====================================================
-- 7. RLS TEST SORGULARI
-- =====================================================

-- RLS'nin çalışıp çalışmadığını test et
-- (Bu sorguları sadece test ortamında çalıştırın)

-- Test 1: Basit SELECT sorgusu
-- SELECT COUNT(*) FROM ilanlar;

-- Test 2: RLS politikalarının etkisini görmek için
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM ilanlar LIMIT 5;

-- =====================================================
-- 8. RLS POLİTİKASI OLUŞTURMA ÖRNEKLERİ
-- =====================================================

/*
-- Örnek 1: Tüm kullanıcıların onaylı ilanları görebilmesi
CREATE POLICY "Onaylı ilanları herkes görebilir" ON ilanlar
    FOR SELECT USING (durum = 'onayli');

-- Örnek 2: Kullanıcıların sadece kendi ilanlarını düzenleyebilmesi
CREATE POLICY "Kullanıcılar kendi ilanlarını düzenleyebilir" ON ilanlar
    FOR UPDATE USING (auth.uid() = user_id);

-- Örnek 3: Admin kullanıcıların tüm işlemleri yapabilmesi
CREATE POLICY "Admin tüm işlemleri yapabilir" ON ilanlar
    FOR ALL USING (auth.role() = 'admin');
*/

-- =====================================================
-- SONUÇ ÖZETİ
-- =====================================================

-- Özet rapor için bu sorguları sırayla çalıştırın:
-- 1. İlk sorgu: RLS'nin aktif olup olmadığını gösterir
-- 2. İkinci sorgu: Mevcut politikaları listeler
-- 3. Üçüncü sorgu: Tablo güvenlik durumunu gösterir
-- 4. Dördüncü sorgu: Kullanıcı yetkilerini gösterir 