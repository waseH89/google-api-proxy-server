require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Pastikan ini diimpor
const app = express();
const port = 3000;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
console.log('Kunci API terbaca dari .env (5 karakter awal):', GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 5) : 'TIDAK TERBACA');

// --- MULAI PERUBAHAN DI SINI ---
const corsOptions = {
  origin: 'http://localhost:5000', // Izinkan hanya origin ini
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Izinkan method ini
  credentials: true, // Izinkan kredensial (jika ada, meskipun tidak relevan di sini)
  optionsSuccessStatus: 204 // Untuk preflight requests
};
app.use(cors(corsOptions)); // Gunakan konfigurasi CORS
// --- AKHIR PERUBAHAN DI SINI ---

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