window.addEventListener('DOMContentLoaded', () => {
    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');
    const subscriptionSection = document.getElementById('subscription-section');
    const topUpSection = document.getElementById('top-up-section');
    const closeLink = document.getElementById('close-link');

    // Mengambil SEMUA tombol pembelian
    const purchaseButtons = document.querySelectorAll('.plan-button');

    // Menampilkan halaman yang benar
    window.api.onShowPage((reason, message) => {
        purchaseButtons.forEach(btn => {
            btn.disabled = false;
            // Mengembalikan teks tombol sesuai konteks
            if (btn.parentElement.parentElement.id === 'top-up-section') {
                btn.textContent = "Beli Kuota";
            } else {
                btn.textContent = "Pilih Paket";
            }
        });

        if (mainTitle) mainTitle.textContent = message;

        if (reason === 'TRIAL_ENDED') {
            if (subscriptionSection) subscriptionSection.style.display = 'block';
            if (topUpSection) topUpSection.style.display = 'none';
            if (mainSubtitle) mainSubtitle.textContent = 'Pilih paket langganan bulanan untuk melanjutkan.';
        } else if (reason === 'QUOTA_EXHAUSTED') {
            if (subscriptionSection) subscriptionSection.style.display = 'none';
            if (topUpSection) topUpSection.style.display = 'block';
            if (mainSubtitle) mainSubtitle.textContent = 'Beli kuota tambahan untuk melanjutkan.';
        }
    });

    // Event listener untuk tombol tutup
    if (closeLink) {
        closeLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.api.closeWindow();
        });
    }

    // Menambahkan event listener ke SETIAP tombol pembelian
    purchaseButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const productId = button.dataset.productId;
            const price = parseInt(button.dataset.price, 10);

            purchaseButtons.forEach(btn => {
                btn.disabled = true;
                btn.textContent = "Memproses...";
            });

            const result = await window.api.createTransaction(productId, price);

            if (result.error) {
                alert(`Gagal membuat transaksi: ${result.error}`);
                // Aktifkan kembali tombol jika gagal
                window.api.onShowPage(null, 'Terjadi Kesalahan'); // Panggil ulang untuk reset
            }
        });
    });
});