// Memuat variabel lingkungan dari file .env (misalnya GOOGLE_API_KEY)
require('dotenv').config();

// Mengimpor modul Express untuk membuat aplikasi web
const express = require('express');

// Membuat instance aplikasi Express
const app = express();

// Port ini hanya relevan untuk pengujian lokal, tidak digunakan di Vercel
const port = 3000;

// Mengambil kunci API Google dari variabel lingkungan
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Menampilkan sebagian kunci API untuk tujuan debugging saat startup lokal
console.log('Kunci API terbaca dari .env (5 karakter awal):', GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 5) : 'TIDAK TERBACA');

// Middleware CORS Kustom untuk mengizinkan permintaan dari front-end lokal
// Ini adalah solusi untuk error 'Access-Control-Allow-Origin'
app.use((req, res, next) => {
  // Mengizinkan origin dari front-end lokal Anda (port 5000)
  // Ganti 'http://localhost:5000' jika Anda menggunakan port lain untuk serve
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5000');

  // Mengizinkan method yang akan digunakan (POST dan OPTIONS untuk preflight)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Mengizinkan header yang mungkin dikirim oleh browser
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Tambahkan Authorization jika di masa depan pakai token
  
  // Penting untuk mengizinkan browser mengirim/menerima kredensial (misalnya cookies),
  // meskipun tidak relevan di sini, ini adalah praktik baik untuk CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Menangani permintaan preflight (OPTIONS request) yang dikirim browser sebelum POST/PUT/DELETE
  if (req.method === 'OPTIONS') {
    res.status(204).send(); // Merespons dengan status 204 (No Content) dan header CORS
    return; // Hentikan eksekusi middleware lebih lanjut
  }

  next(); // Lanjutkan ke middleware atau route berikutnya
});

// Middleware untuk mengurai body permintaan JSON
app.use(express.json());

// Endpoint API untuk mem-proxy permintaan ke Google API
app.post('/api/google-service', async (req, res) => {
    // Menerima 'endpoint' Google API dan 'params' dari body permintaan front-end
    const { endpoint, params } = req.body;

    // Periksa apakah kunci API ada
    if (!GOOGLE_API_KEY) {
        console.error('GOOGLE_API_KEY tidak ditemukan di variabel lingkungan.');
        return res.status(500).json({ error: 'Kunci API Google tidak ditemukan di server.' });
    }

    try {
        // Membangun string query parameter untuk URL Google API
        const queryParams = new URLSearchParams(params).toString();

        // Membangun URL lengkap ke Google API
        // Contoh: https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSy...&address=Monumen+Nasional
        const googleApiUrl = `https://maps.googleapis.com/${endpoint}?key=${GOOGLE_API_KEY}&${queryParams}`;

        // Log permintaan ke Google API untuk debugging di log Vercel
        console.log('--- Permintaan ke Google API ---');
        console.log('URL yang akan dipanggil:', googleApiUrl);
        console.log('Endpoint:', endpoint);
        console.log('Parameter:', params);

        // Melakukan permintaan fetch ke Google API
        const response = await fetch(googleApiUrl);
        const data = await response.json(); // Mengambil respons JSON dari Google

        // Log respons mentah dari Google untuk debugging
        console.log('Respons mentah dari Google:', data);

        // Mengirim respons dari Google API kembali ke front-end
        res.json(data);
    } catch (error) {
        console.error('Error saat memanggil Google API di server:', error);
        res.status(500).json({ error: 'Gagal mengambil data dari Google API di server', details: error.message });
    }
});

// Penting untuk Vercel: Mengekspor aplikasi Express
// Vercel akan menjalankan 'app' ini sebagai server