-- =====================================================
-- İLANLAR TABLOSUNA MAHALLE SÜTUNU EKLEME
-- =====================================================
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. Mahalle sütununu ekle
ALTER TABLE ilanlar ADD COLUMN IF NOT EXISTS mahalle TEXT;

-- 2. Mevcut kayıtlara varsayılan mahalle değeri ata (opsiyonel)
UPDATE ilanlar SET mahalle = 'Belirtilmemiş' WHERE mahalle IS NULL;

-- 3. Mahalle sütununu NOT NULL yap (opsiyonel - gelecekteki kayıtlar için)
-- ALTER TABLE ilanlar ALTER COLUMN mahalle SET NOT NULL;

-- 4. Mahalle sütunu için index oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_ilanlar_mahalle ON ilanlar(mahalle);

-- 5. Kontrol sorgusu
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ilanlar' 
AND column_name = 'mahalle';

-- =====================================================
-- RLS POLİTİKALARINI GÜNCELLE (EĞER GEREKİRSE)
-- =====================================================

-- Mahalle bazlı filtreleme için yeni politika (opsiyonel)
-- CREATE POLICY "Mahalle bazlı filtreleme" ON ilanlar
--     FOR SELECT USING (
--         auth.role() = 'anon' AND 
--         (durum = 'onayli' OR durum = 'approved')
--     );

-- =====================================================
-- TEST SORGULARI
-- =====================================================

-- Mahalle sütununun eklendiğini kontrol et
SELECT 
    id,
    ad,
    mahalle,
    created_at
FROM ilanlar 
LIMIT 5;

-- Mahalle bazlı ilan sayısı
SELECT 
    mahalle,
    COUNT(*) as ilan_sayisi
FROM ilanlar 
WHERE durum = 'onayli'
GROUP BY mahalle
ORDER BY ilan_sayisi DESC;

-- =====================================================
-- NOTLAR
-- =====================================================
/*
✅ MAHALLE SÜTUNU EKLENDİ

YAPILAN İŞLEMLER:
1. ✅ Mahalle sütunu eklendi (TEXT tipinde)
2. ✅ Mevcut kayıtlara varsayılan değer atandı
3. ✅ Performans için index oluşturuldu
4. ✅ Kontrol sorguları eklendi

SONRAKI ADIMLAR:
1. Frontend'de mahalle input alanı ekle
2. Backend API'de mahalle alanını işle
3. RLS politikalarını test et
*/ 