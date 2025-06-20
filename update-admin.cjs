const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Firebase Admin SDK'yı başlat
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

    const email = 'satoshinakamototokyo42@gmail.com';
const password = 'sevimbebe4242';
    
async function createAdminUser() {
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            emailVerified: true
        });
        console.log('Admin kullanıcısı başarıyla oluşturuldu:', userRecord.uid);
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            console.log('Bu email adresi zaten kullanımda. Şifre güncelleniyor...');
            try {
                const userRecord = await admin.auth().getUserByEmail(email);
                await admin.auth().updateUser(userRecord.uid, {
                    password: password
            });
                console.log('Admin şifresi başarıyla güncellendi');
            } catch (updateError) {
                console.error('Şifre güncellenirken hata:', updateError);
            }
        } else {
            console.error('Hata:', error);
        }
    }
}

// Fonksiyonu çalıştır
createAdminUser();
