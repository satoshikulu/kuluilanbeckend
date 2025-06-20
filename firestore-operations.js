import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

/**
 * Yeni bir ilan verisini Firestore'a kaydeder
 * @param {Object} ilanData - Kaydedilecek ilan verisi
 * @returns {Promise<string>} Eklenen dökümanın ID'si
 */
async function saveData(ilanData = null) {
    // Eğer veri gönderilmezse örnek veri kullan
    const ilan = ilanData || {
        baslik: "Satılık Daire",
        fiyat: 250000,
        konum: "Konya/Kulu",
        telefon: "0555 123 45 67",
        tarih: new Date().toISOString(),
        onayli: false,
        aktif: true
    };

    try {
        const docRef = await addDoc(collection(db, "ilanlar"), ilan);
        console.log("Veri başarıyla eklendi, ID:", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Veri eklenirken hata oluştu:", e);
        throw e;
    }
}

/**
 * Tüm ilanları Firestore'dan getirir
 * @returns {Promise<Array>} İlanların listesi
 */
async function getAllIlanlar() {
    try {
        const querySnapshot = await getDocs(collection(db, "ilanlar"));
        const ilanlar = [];
        querySnapshot.forEach((doc) => {
            ilanlar.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return ilanlar;
    } catch (e) {
        console.error("İlanlar getirilirken hata oluştu:", e);
        throw e;
    }
}

/**
 * Belirli bir ilanı günceller
 * @param {string} ilanId - Güncellenecek ilanın ID'si
 * @param {Object} yeniVeri - Güncellenecek yeni veriler
 * @returns {Promise<void>}
 */
async function updateIlan(ilanId, yeniVeri) {
    try {
        const ilanRef = doc(db, "ilanlar", ilanId);
        await updateDoc(ilanRef, yeniVeri);
        console.log("İlan başarıyla güncellendi:", ilanId);
    } catch (e) {
        console.error("İlan güncellenirken hata oluştu:", e);
        throw e;
    }
}

/**
 * Belirli bir ilanı siler
 * @param {string} ilanId - Silinecek ilanın ID'si
 * @returns {Promise<void>}
 */
async function deleteIlan(ilanId) {
    try {
        const ilanRef = doc(db, "ilanlar", ilanId);
        await deleteDoc(ilanRef);
        console.log("İlan başarıyla silindi:", ilanId);
    } catch (e) {
        console.error("İlan silinirken hata oluştu:", e);
        throw e;
    }
}

export { saveData, getAllIlanlar, updateIlan, deleteIlan }; 