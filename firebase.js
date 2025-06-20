// Firebase SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOw_AAy7WWU1SU1Cj0isvMJSaZRbg4L_k",
    authDomain: "kulu-emlak.firebaseapp.com",
    projectId: "kulu-emlak",
    storageBucket: "kulu-emlak.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:1234567890123456789012"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Authentication functions
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Giriş başarılı:", userCredential.user);
        if (email === 'satoshinakamototokyo42@gmail.com') {
            window.location.href = '/admin-dashboard.html';
        } else {
            window.location.href = '/user-dashboard.html';
        }
        return {
            success: true,
            user: userCredential.user
        };
    } catch (error) {
        console.error("Giriş hatası:", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

export async function register(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Kayıt başarılı:", userCredential.user);
        return {
            success: true,
            user: userCredential.user
        };
    } catch (error) {
        console.error("Kayıt hatası:", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

export async function logout() {
    try {
        await signOut(auth);
        updateUIAfterLogout();
    } catch (error) {
        console.error("Çıkış hatası:", error);
    }
}

// UI Update functions
export function updateUIAfterLogin(user) {
    const navbar = document.querySelector('.navbar');
    const loginBtn = navbar.querySelector('.login-btn');
    const adminBtn = navbar.querySelector('.admin-btn');
    
    if (user.email === 'satoshinakamototokyo42@gmail.com') {
        adminBtn.style.display = 'block';
    }
    
    loginBtn.textContent = `Hoş Geldin, ${user.email}`;
    loginBtn.onclick = () => logout();
}

export function updateUIAfterLogout() {
    const navbar = document.querySelector('.navbar');
    const loginBtn = navbar.querySelector('.login-btn');
    const adminBtn = navbar.querySelector('.admin-btn');
    
    loginBtn.textContent = 'Giriş Yap';
    loginBtn.onclick = () => showLogin();
    adminBtn.style.display = 'none';
}

// Initialize Firebase Authentication
export function initializeAuth() {
    onAuthStateChanged(auth, user => {
        if (user) {
            updateUIAfterLogin(user);
        }
    });
}

// Admin email check
const adminEmail = "satoshinakamototokyo42@gmail.com";

// Make getKullaniciIlanlari globally available
export async function getKullaniciIlanlari() {
    const { getKullaniciIlanlari } = await import('./ilan-ekle.js');
    // Hide other sections and show ilanlarListesi
    document.getElementById('ilanEkleForm').style.display = 'none';
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('kategoriler').style.display = 'none';
    document.getElementById('ilanlarListesi').style.display = 'block';
    // Clear the regular listings container
    document.getElementById('ilanlarContainer').innerHTML = '';
    // Call the function
    return getKullaniciIlanlari();
}
