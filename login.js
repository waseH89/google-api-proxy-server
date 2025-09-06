// Tunggu hingga seluruh halaman HTML dimuat
document.addEventListener('DOMContentLoaded', () => {

    // Cari tombol login Google berdasarkan ID-nya
    const loginButton = document.getElementById('google-login-btn');

    // Pastikan tombolnya ada sebelum menambahkan event listener
    if (loginButton) {
        // Tambahkan event listener yang hanya akan berjalan SAAT TOMBOL DIKLIK
        loginButton.addEventListener('click', () => {
            // Kirim sinyal ke main.js untuk memulai otentikasi Google
            window.loginAPI.authGoogle();
        });
    } else {
        console.error('Tombol login dengan ID "google-login-btn" tidak ditemukan.');
    }

});