// Basit Supabase bağlantı testi
require('dotenv').config();
const { supabase } = require('./supabase');

async function testSupabaseConnection() {
  try {
    // 'ilanlar' tablosundan ilk 1 kaydı çekerek bağlantıyı test et
    const { data, error } = await supabase.from('ilanlar').select('*').limit(1);
    if (error) {
      console.error('❌ Supabase bağlantı hatası:', error.message);
      return;
    }
    console.log('✅ Supabase bağlantısı başarılı. Örnek veri:', data);
  } catch (err) {
    console.error('❌ Supabase testinde beklenmeyen hata:', err);
  }
}

testSupabaseConnection();
