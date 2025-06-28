// api/index.js (Hyper-Simplified Test Function)

// Ini adalah fungsi serverless paling dasar untuk Vercel.
// Tidak ada Express, tidak ada dotenv, hanya fungsi langsung.
// Kita akan menambahkan header CORS secara manual di sini juga,
// sebagai lapisan pengaman jika vercel.json entah bagaimana gagal.

module.exports = (req, res) => {
  // Tambahkan header CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Log permintaan masuk (ini seharusnya muncul di runtime logs Vercel!)
  console.log('Fungsi serverless menerima permintaan!');
  console.log('Metode:', req.method);
  console.log('URL:', req.url);

  // Jika ini adalah permintaan preflight (OPTIONS), kirim respons 204
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }

  // Jika ini adalah permintaan POST (dari tombol Ambil Data)
  if (req.method === 'POST' && req.url === '/api/google-service') {
    // Kita tidak akan memanggil Google API di sini dulu
    // Cukup kirim respons dummy untuk melihat apakah koneksi berhasil
    return res.status(200).json({
      message: "Hello dari fungsi Vercel yang disederhanakan!",
      status: "SUCCESS",
      received_method: req.method,
      received_url: req.url
    });
  }

  // Untuk rute lain atau method yang tidak ditangani
  res.status(404).json({ message: "Not Found" });
};