require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Environment variables kontrolü
if (!process.env.SUPABASE_URL) {
  throw new Error('❌ SUPABASE_URL environment variable eksik! Lütfen .env dosyasında tanımlayın.');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable eksik! Lütfen .env dosyasında tanımlayın.');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('❌ SUPABASE_ANON_KEY environment variable eksik! Lütfen .env dosyasında tanımlayın.');
}

// Service Role Client - Backend işlemleri için (tam yetki)
const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Anon Client - Kullanıcı işlemleri için (RLS kuralları geçerli)
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

module.exports = { 
  supabase: supabaseService, // Varsayılan olarak service role client'ı export et
  supabaseService,           // Service role client (backend işlemleri)
  supabaseAnon               // Anon client (kullanıcı işlemleri)
}; 