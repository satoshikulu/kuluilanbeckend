-- =====================================================
-- İLANLAR TABLOSU RLS KURULUMU
-- =====================================================
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. user_id sütununu ekle (zaten yoksa)
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. RLS aktif et
ALTER TABLE ilanlar ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLİTİKALARI
-- =====================================================

-- 3. Politika 1: Kendi ilanını görebilsin
CREATE POLICY "Kendi ilanlarını görebilir"
ON ilanlar
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Politika 2: Kendi ilanını ekleyebilsin
CREATE POLICY "Kendi ilanını ekleyebilir"
ON ilanlar
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Politika 3: Kendi ilanını güncelleyebilsin
CREATE POLICY "Kendi ilanını güncelleyebilir"
ON ilanlar
FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Politika 4: Kendi ilanını silebilsin
CREATE POLICY "Kendi ilanını silebilir"
ON ilanlar
FOR DELETE
USING (auth.uid() = user_id);

-- 7. (Opsiyonel) Admin her şeyi görebilsin
CREATE POLICY "Admin her şeyi görebilir"
ON ilanlar
FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- KONTROL SORGULARI
-- =====================================================

-- RLS durumunu kontrol et
SELECT 
    c.relname as "Tablo Adı",
    c.relrowsecurity as "RLS Aktif",
    CASE 
        WHEN c.relrowsecurity THEN '✅ AKTİF'
        ELSE '❌ PASİF'
    END as "Durum"
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'ilanlar';

-- Oluşturulan politikaları listele
SELECT 
    policyname as "Politika Adı",
    cmd as "İşlem Türü",
    CASE 
        WHEN permissive THEN '✅ İZİN VER'
        ELSE '❌ REDDET'
    END as "Tür",
    qual as "WHERE Koşulu",
    with_check as "WITH CHECK Koşulu"
FROM pg_policies 
WHERE tablename = 'ilanlar'
ORDER BY policyname;

-- =====================================================
-- NOTLAR
-- =====================================================
/*
ÖNEMLİ NOTLAR:

1. auth.uid() sadece JWT (örneğin Supabase oturum token) varsa çalışır
2. Backend tarafında user_id manuel ekleniyorsa, bu RLS kuralları geçerli olur
3. Service role (backend) tüm işlemleri yapabilir
4. Anonim kullanıcılar hiçbir şey göremez (güvenlik için)

TEST ETMEK İÇİN:
- Supabase Dashboard > Authentication > Users ile test kullanıcısı oluştur
- Frontend'den giriş yap ve API çağrısı yap
- Sadece kendi ilanlarını görebildiğini kontrol et
*/ 