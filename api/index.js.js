// api/index.js (Hyper-Minimalist Function)

module.exports = (req, res) => {
  // Log permintaan masuk (ini seharusnya muncul di runtime logs Vercel!)
  console.log('--- Minimal Serverless Function Invoked ---');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);

  // Handle OPTIONS (preflight) request - (meskipun vercel.json akan menangani ini, ini sebagai backup)
  if (req.method === 'OPTIONS') {
    // Karena vercel.json seharusnya mengembalikan 204, ini mungkin tidak terpanggil.
    // Tapi kita tetap memasukkannya untuk robustness.
    return res.status(204).send();
  }

  // Handle POST request
  if (req.method === 'POST' && req.url.startsWith('/api/google-service')) { // Gunakan startsWith untuk API path
    return res.status(200).json({
      message: "Hello from minimalist Vercel function!",
      status: "SUCCESS_MINIMAL",
      received_method: req.method,
      received_url: req.url,
      body: req.body // Mungkin kosong jika tanpa Express body-parser
    });
  }

  // Handle other methods/routes not expected
  res.status(404).json({ message: "Not Found - Minimalist Function" });
};