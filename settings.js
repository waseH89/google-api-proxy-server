window.addEventListener('load', () => {
    // --- Deklarasi Variabel ---
    const menuItems = document.querySelectorAll('.sidebar li');
    const panels = document.querySelectorAll('.content-panel');
    
    // Panel Hotkey
    const imageHotkeyInput = document.getElementById('image-hotkey');
    const textHotkeyInput = document.getElementById('text-hotkey');
    const processHotkeyInput = document.getElementById('process-hotkey');
    const saveButton = document.getElementById('save-button');
    const statusMessage = document.getElementById('status-message');
    
    // Panel Akun
    const accountEmail = document.getElementById('account-email');
    const accountTier = document.getElementById('account-tier');
    const imageCredits = document.getElementById('image-credits');
    const textCredits = document.getElementById('text-credits');
    const tokenExpiry = document.getElementById('token-expiry');
    const logoutButton = document.getElementById('logout-button');

    let newHotkeys = {};

    // --- Logika untuk Pindah Tab ---
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            menuItems.forEach(i => i.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            item.classList.add('active');
            const targetPanel = document.getElementById(item.dataset.target);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            if (item.dataset.target === 'account-panel') {
                loadAccountInfo();
            }
        });
    });

    // --- Logika untuk Panel Hotkey ---
    async function loadHotkeys() {
        try {
            const hotkeys = await window.settingsAPI.getHotkeys();
            if (hotkeys) {
                imageHotkeyInput.value = hotkeys.openImageGenerator;
                textHotkeyInput.value = hotkeys.copyTextResult;
                processHotkeyInput.value = hotkeys.processCopiedText;
                newHotkeys = { ...hotkeys };
            }
        } catch (error) {
            console.error("Gagal memuat hotkey:", error);
            statusMessage.textContent = 'Gagal memuat hotkey.';
        }
    }

    function recordHotkey(event, inputElement) {
        event.preventDefault();
        let parts = [];
        if (event.ctrlKey) parts.push('Control');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');
        const key = event.key.toUpperCase();
        if (!['CONTROL', 'ALT', 'SHIFT', ''].includes(key) && !parts.includes(key)) {
            parts.push(key);
        }
        const hotkeyString = parts.join('+');
        if (parts.length > 1) {
            inputElement.value = hotkeyString;
        }
    }

    imageHotkeyInput.addEventListener('keydown', (e) => {
        recordHotkey(e, imageHotkeyInput);
        newHotkeys.openImageGenerator = imageHotkeyInput.value;
    });

    textHotkeyInput.addEventListener('keydown', (e) => {
        recordHotkey(e, textHotkeyInput);
        newHotkeys.copyTextResult = textHotkeyInput.value;
    });
    
    processHotkeyInput.addEventListener('keydown', (e) => {
        recordHotkey(e, processHotkeyInput);
        newHotkeys.processCopiedText = processHotkeyInput.value;
    });

    saveButton.addEventListener('click', async () => {
        try {
            const result = await window.settingsAPI.setHotkeys(newHotkeys);
            if (result.success) {
                statusMessage.textContent = 'Hotkey berhasil disimpan!';
            } else {
                statusMessage.textContent = 'Gagal menyimpan. Hotkey mungkin sudah digunakan.';
                loadHotkeys(); // Muat kembali hotkey yang valid
            }
        } catch (error) {
            console.error("Error saat menyimpan hotkey:", error);
            statusMessage.textContent = 'Terjadi error.';
        }
        setTimeout(() => statusMessage.textContent = '', 3000);
    });

    // --- Logika untuk Panel Akun ---
    async function loadAccountInfo() {
        if (!accountEmail || !tokenExpiry) return;

        accountEmail.textContent = 'Memuat...';
        accountTier.textContent = '...';
        imageCredits.textContent = '...';
        textCredits.textContent = '...';
        tokenExpiry.textContent = 'Memuat...';

        try {
            const info = await window.settingsAPI.getAccountInfo();
            
            if (info && info.email && info.tier) {
                accountEmail.textContent = info.email;
                accountTier.textContent = info.tier.charAt(0).toUpperCase() + info.tier.slice(1);
                imageCredits.textContent = info.imageCredits;
                
                // --- KODE BARU DIMASUKKAN DI SINI ---
                // Memeriksa nilai textCredits, jika -1 tampilkan 'Tak Terbatas'
                if (info.textCredits === -1) {
                    textCredits.textContent = 'Tak Terbatas';
                } else {
                    textCredits.textContent = info.textCredits;
                }
                // --- AKHIR DARI KODE BARU ---

                tokenExpiry.textContent = new Date(info.endDate).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
            } else {
                throw new Error("Data akun yang diterima tidak lengkap atau kosong.");
            }
        } catch (error) {
            console.error("Gagal memuat info akun:", error);
            accountEmail.textContent = 'Gagal memuat info akun.';
            accountTier.textContent = '-';
            imageCredits.textContent = '-';
            textCredits.textContent = '-';
            tokenExpiry.textContent = '-';
        }
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', () => window.settingsAPI.logout());
    } else {
        console.error("Tombol Logout tidak ditemukan di HTML!");
    }

    // --- Panggilan Inisialisasi ---
    loadAccountInfo();
    loadHotkeys();
});