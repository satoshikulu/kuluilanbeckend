import { createClient } from '@supabase/supabase-js';

// Supabase bağlantısı
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Giriş
async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error('Giriş hatası:', error.message);
        return { success: false, error: error.message };
    }

    console.log('Giriş başarılı:', data.user);

    if (email === 'satoshinakamototokyo42@gmail.com') {
        window.location.href = '/admin-dashboard.html';
    } else {
        window.location.href = '/user-dashboard.html';
    }

    return { success: true, user: data.user };
}

// Kayıt
async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        console.error('Kayıt hatası:', error.message);
        return { success: false, error: error.message };
    }

    console.log('Kayıt başarılı:', data.user);
    return { success: true, user: data.user };
}

// Form submit - Kayıt
function handleRegisterFormSubmit(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    register(email, password).then((result) => {
        if (result.success) {
            alert('Kayıt başarılı! Lütfen e-postanızı kontrol edin.');
        } else {
            alert('Kayıt hatası: ' + result.error);
        }
    });
}

// Form submit - Giriş
function handleLoginFormSubmit(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    login(email, password).then((result) => {
        if (result.success) {
            alert('Giriş başarılı!');
        } else {
            alert('Giriş hatası: ' + result.error);
        }
    });
}

export { register, login, handleRegisterFormSubmit, handleLoginFormSubmit };
