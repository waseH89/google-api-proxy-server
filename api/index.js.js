// api/index.js (sebelumnya server.js)
require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000; // Hanya untuk referensi lokal

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
console.log('Kunci API terbaca dari .env (5 karakter awal):', GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 5) : 'TIDAK TERBACA');

app.use(express.json());

app.post('/api/google-service', async (req, res) => {
    const { endpoint, params } = req.body;

    if (!GOOGLE_API_KEY) {
        console.error('GOOGLE_API_KEY tidak ditemukan di variabel lingkungan.');
        return res.status(500).json({ error: 'Kunci API Google tidak ditemukan di server.' });
    }

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

module.exports = app; // Penting untuk Vercel