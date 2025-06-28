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

// Menampilkan sebagian kunci API untuk tujuan debugging saat startup lokal atau di log Vercel
console.log('Kunci API terbaca dari .env (5 karakter awal):', GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 5) : 'TIDAK TERBACA');

// Middleware untuk mengurai body permintaan JSON
// Ini adalah middleware pertama yang berjalan setelah aplikasi dibuat
app.use(express.json());

// Endpoint API untuk mem-proxy permintaan ke Google API
app.post('/api/google-service', async (req, res) => {
    // Menerima 'endpoint' Google API dan 'params' dari body permintaan front-end
    const { endpoint, params } = req.body;

    // Periksa apakah kunci API ada
    if (!GOOGLE_API_KEY) {
        console.error('GOOGLE_API_KEY tidak ditemukan di variabel lingkungan.');
        return res.status(500).json({ error: 'Kunci API Google tidak ditemukan di server.' });