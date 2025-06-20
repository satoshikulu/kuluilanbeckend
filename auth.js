import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from './firebase-config.js';

// Initialize Firebase Authentication
const auth = getAuth();

// Firebase Authentication functions
async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Giriş başarılı:", userCredential.user);
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

async function register(email, password) {
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

/**
 * Kullanıcı kayıt fonksiyonu
 * @param {string} email - Kullanıcının email adresi
 * @param {string} password - Kullanıcının şifresi
 * @returns {Promise} Kayıt işleminin sonucunu içeren Promise
 */
function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Kayıt başarılı:", userCredential.user);
            return {
                success: true,
                user: userCredential.user
            };
        })
        .catch((error) => {
            console.error("Kayıt hatası:", error.message);
            return {
                success: false,
                error: error.message
            };
        });
}

/**
 * Kullanıcı giriş fonksiyonu
 * @param {string} email - Kullanıcının email adresi
 * @param {string} password - Kullanıcının şifresi
 * @returns {Promise} Giriş işleminin sonucunu içeren Promise
 */
function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Giriş başarılı:", userCredential.user);
            // Admin kontrolü
            if (email === 'satoshinakamototokyo42@gmail.com') {
                // Admin dashboard'a yönlendir
                window.location.href = '/admin-dashboard.html';
            } else {
                // Normal kullanıcı dashboard'a yönlendir
                window.location.href = '/user-dashboard.html';
            }
            return {
                success: true,
                user: userCredential.user
            };
        })
        .catch((error) => {
            console.error("Giriş hatası:", error.message);
            return {
                success: false,
                error: error.message
            };
        });
}

// Form submit işleyicisi örneği - Kayıt
function handleRegisterFormSubmit(event) {
    event.preventDefault();
    
    const email = event.target.email.value;
    const password = event.target.password.value;
    
    register(email, password)
        .then((result) => {
            if (result.success) {
                // Başarılı kayıt sonrası yönlendirme veya UI güncelleme
                alert('Kayıt başarılı! Hoş geldiniz.');
                // Örnek: window.location.href = '/dashboard';
            } else {
                // Hata mesajını göster
                alert('Kayıt sırasında bir hata oluştu: ' + result.error);
            }
        });
}

// Form submit işleyicisi örneği - Giriş
function handleLoginFormSubmit(event) {
    event.preventDefault();
    
    const email = event.target.email.value;
    const password = event.target.password.value;
    
    login(email, password)
        .then((result) => {
            if (result.success) {
                // Başarılı giriş sonrası yönlendirme veya UI güncelleme
                alert('Giriş başarılı! Hoş geldiniz.');
                // Admin kontrolü
                if (email === 'satoshinakamototokyo42@gmail.com') {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/user-dashboard.html';
                }
            } else {
                // Hata mesajını göster
                alert('Giriş sırasında bir hata oluştu: ' + result.error);
            }
        });
}

// Admin şifresini güncelleme fonksiyonu
async function updateAdminPassword() {
    const email = 'satoshinakamototokyo42@gmail.com';
    const newPassword = 'sevimbebe4242';
    
    try {
        const user = await auth.fetchSignInMethodsForEmail(email);
        if (user.length > 0) {
            // Şifreyi güncelle
            const userCredential = await signInWithEmailAndPassword(auth, email, 'mevcut-sifre');
            await userCredential.user.updatePassword(newPassword);
            console.log('Şifre güncellendi!');
        } else {
            // Kullanıcı yoksa yeni bir hesap oluştur
            await createUserWithEmailAndPassword(auth, email, newPassword);
            console.log('Yeni admin hesap oluşturuldu!');
        }
    } catch (error) {
        console.error('Hata:', error.message);
    }
}

// Form örnekleri HTML:
/*
// Kayıt Formu
<form id="registerForm" onsubmit="handleRegisterFormSubmit(event)">
    <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required>
    </div>
    <div class="form-group">
        <label for="password">Şifre</label>
        <input type="password" id="password" name="password" required>
    </div>
    <button type="submit">Kayıt Ol</button>
</form>

// Giriş Formu
<form id="loginForm" onsubmit="handleLoginFormSubmit(event)">
    <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required>
    </div>
    <div class="form-group">
        <label for="password">Şifre</label>
        <input type="password" id="password" name="password" required>
    </div>
    <button type="submit">Giriş Yap</button>
</form>
*/

export { register, login, handleRegisterFormSubmit, handleLoginFormSubmit }; 