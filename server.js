require('dotenv').config();
const express = require('express');
// const cors = require('cors'); // HAPUS ATAU KOMENTARI BARIS INI
const app = express();
const port = 3000;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
console.log('Kunci API terbaca dari .env (5 karakter awal):', GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 5) : 'TIDAK TERBACA');

// --- MULAI PERUBAHAN DI SINI: MIDDLEWARE CORS KUSTOM ---
app.use((req, res, next) => {
  // Mengizinkan origin dari front-end Anda (localhost:5000)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5000');
  // Mengizinkan metode yang Anda gunakan (POST dan OPTIONS untuk preflight)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  // Mengizinkan header yang mungkin dikirim oleh browser
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Penting jika Anda mengirim kredensial (seperti cookie/header otorisasi), tapi untuk sekarang biarkan false jika tidak ada
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Harus string 'true'

  // Menangani permintaan preflight (OPTIONS request)
  if (req.method === 'OPTIONS') {
    res.status(204).send(); // Merespons dengan status 204 (No Content) dan header CORS
    return; // Hentikan eksekusi middleware lebih lanjut
  }

  next(); // Lanjutkan ke middleware atau route berikutnya
});
// --- AKHIR PERUBAHAN CORS KUSTOM ---

app.use(express.json());

app.post('/api/google-service', async (req, res) => {
    const { endpoint, params } = req.body;

    try {
        const queryParams = new URLSearchParams(params).toString();
        const googleApiUrl = `https://maps.googleapis.com/${endpoint}?key=${GOOGLE_API_KEY}&${queryParams}`;

        console.log('--- Permintaan ke Google API ---');
        console.log('URL yang akan dipanggil:', googleApiUrl);
        console.log('Endpoint:', endpoint);
        console.log('Parameter:', params);

        const response = await fetch(googleApiUrl);
        const data = await response.json();

        console.log('Respons mentah dari Google:', data);

        res.json(data);
    } catch (error) {
        console.error('Error saat memanggil Google API di server:', error);
        res.status(500).json({ error: 'Gagal mengambil data dari Google API di server', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server proxy berjalan di http://localhost:${port}`);
});