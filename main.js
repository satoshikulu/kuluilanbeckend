import { login, register, logout, updateUIAfterLogin, updateUIAfterLogout, initializeAuth, getKullaniciIlanlari } from './firebase.js';

// Initialize Firebase Authentication
initializeAuth();

// Login form submit handler
document.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#login-email').value;
    const password = document.querySelector('#login-password').value;
    
    const result = await login(email, password);
    if (!result.success) {
        alert('Giriş başarısız: ' + result.error);
    }
});

// Register form submit handler
document.querySelector('#register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#register-email').value;
    const password = document.querySelector('#register-password').value;
    
    const result = await register(email, password);
    if (!result.success) {
        alert('Kayıt başarısız: ' + result.error);
    } else {
        alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
    }
});

// Make getKullaniciIlanlari globally available
window.getKullaniciIlanlari = getKullaniciIlanlari;
