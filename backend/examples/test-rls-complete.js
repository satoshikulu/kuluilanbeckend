// Supabase ve backend API RLS test scripti
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/../.env' });
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKEND_URL = 'http://localhost:3000';

const TEST_USER = {
  email: 'testuser@example.com',
  password: 'Test1234!'
};
const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'Admin1234!'
};

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureUser(supabase, { email, password }) {
  // Try sign up, if already exists, sign in
  let { user, error } = await supabase.auth.signUp({ email, password });
  if (error && error.message.includes('already registered')) {
    ({ user, error } = await supabase.auth.signInWithPassword({ email, password }));
  }
  if (error) throw error;
  return user;
}

async function run() {
  console.log('--- Supabase RLS ve Backend API Testleri Başlıyor ---');
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 1. Kullanıcı ve admin ile giriş/kayıt
  let user, admin;
  try {
    user = await ensureUser(anon, TEST_USER);
    admin = await ensureUser(anon, ADMIN_USER);
    console.log('Kullanıcı ve admin giriş/kayıt başarılı.');
  } catch (e) {
    console.error('Kullanıcı/admin giriş/kayıt hatası:', e.message);
    return;
  }

  // 2. Kullanıcı token al
  let { data: userSession, error: userSessionErr } = await anon.auth.signInWithPassword(TEST_USER);
  if (userSessionErr) return console.error('Kullanıcı token alınamadı:', userSessionErr.message);
  const userToken = userSession.session.access_token;

  // 3. Admin token al
  let { data: adminSession, error: adminSessionErr } = await anon.auth.signInWithPassword(ADMIN_USER);
  if (adminSessionErr) return console.error('Admin token alınamadı:', adminSessionErr.message);
  const adminToken = adminSession.session.access_token;

  // 4. Kullanıcı ilan ekler
  let ilanId;
  try {
    const ilan = {
      baslik: 'Test İlanı',
      aciklama: 'RLS test ilanı',
      mahalle: 'Test Mahallesi',
      onayli: false
    };
    const res = await fetch(`${BACKEND_URL}/ilan-ekle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(ilan)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'İlan eklenemedi');
    ilanId = json.id || json.data?.id;
    console.log('Kullanıcı ilan ekledi:', ilanId);
  } catch (e) {
    console.error('Kullanıcı ilan ekleme hatası:', e.message);
    return;
  }

  // 5. Kullanıcı kendi ilanını görebiliyor mu?
  try {
    const res = await fetch(`${BACKEND_URL}/ilanlarim`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const json = await res.json();
    if (json && Array.isArray(json) && json.some(i => i.id === ilanId)) {
      console.log('Kullanıcı kendi ilanını görebiliyor.');
    } else {
      throw new Error('Kullanıcı kendi ilanını göremiyor!');
    }
  } catch (e) {
    console.error(e.message);
  }

  // 6. Admin tüm ilanları görebiliyor mu?
  try {
    const res = await fetch(`${BACKEND_URL}/ilanlar`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (json && Array.isArray(json) && json.some(i => i.id === ilanId)) {
      console.log('Admin tüm ilanları görebiliyor.');
    } else {
      throw new Error('Admin ilanı göremiyor!');
    }
  } catch (e) {
    console.error(e.message);
  }

  // 7. Anonim kullanıcı sadece onaylı ilanları görebiliyor mu?
  try {
    const res = await fetch(`${BACKEND_URL}/ilanlar`);
    const json = await res.json();
    if (json && Array.isArray(json) && json.every(i => i.onayli === true)) {
      console.log('Anonim kullanıcı sadece onaylı ilanları görebiliyor.');
    } else {
      throw new Error('Anonim kullanıcı onaysız ilan görebiliyor veya ilan yok!');
    }
  } catch (e) {
    console.error(e.message);
  }

  // 8. Temizlik: Eklenen ilanı sil (service role ile doğrudan Supabase'den)
  try {
    const { error } = await service.from('ilanlar').delete().eq('id', ilanId);
    if (!error) console.log('Test ilanı silindi.');
  } catch (e) {
    // ignore
  }

  console.log('--- Testler tamamlandı ---');
}

run(); 