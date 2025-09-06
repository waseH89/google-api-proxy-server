const { app, BrowserWindow, Tray, Menu, clipboard, globalShortcut, Notification, screen, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Store = require('electron-store');
const { jwtDecode } = require('jwt-decode');

let lastCopiedText = '';
let serverUrl = 'http://localhost:3000';
const devSettingsPath = path.join(__dirname, 'settings.json');
const prodSettingsPath = path.join(process.resourcesPath, 'settings.json');

try {
    const configPathToUse = fs.existsSync(prodSettingsPath) ? prodSettingsPath : devSettingsPath;
    if (fs.existsSync(configPathToUse)) {
        const settingsFile = fs.readFileSync(configPathToUse, 'utf-8');
        const settings = JSON.parse(settingsFile);
        if (settings.serverUrl) {
            serverUrl = settings.serverUrl;
        }
    } else {
        fs.writeFileSync(configPathToUse, JSON.stringify({ serverUrl: 'http://127.0.0.1:3000' }, null, 2), 'utf-8');
        serverUrl = 'http://127.0.0.1:3000';
    }
} catch (error) {
    console.error('DESKTOP: Gagal membaca settings.json, menggunakan alamat default.', error);
}

const store = new Store();
let tray = null, generatorWindow = null, thinkingWindow = null, copiedWindow = null, settingsWindow = null, subscriptionWindow = null, waitWindow = null;
let aiTextResultCache = '', isInternalCopy = false;
let loginWindow = null;
let googleLoginWindow = null;
let paymentWindow = null;

function isValid(accelerator) { return accelerator && accelerator.includes('+') && !accelerator.endsWith('+'); }

function loadHotkeys() {
    hotkeys = {
        openImageGenerator: store.get('hotkey.image', 'Control+Shift+E'),
        copyTextResult: store.get('hotkey.text', 'Control+Shift+X'),
        processCopiedText: store.get('hotkey.process', 'Control+Shift+C')
    };
    if (!isValid(hotkeys.openImageGenerator)) hotkeys.openImageGenerator = 'Control+Shift+E';
    if (!isValid(hotkeys.copyTextResult)) hotkeys.copyTextResult = 'Control+Shift+X';
    if (!isValid(hotkeys.processCopiedText)) hotkeys.processCopiedText = 'Control+Shift+C';
}

function createMainWindows() {
    generatorWindow = new BrowserWindow({ width: 1000, height: 700, show: false, title: "Image Generator", webPreferences: { preload: path.join(__dirname, 'preload.js') } });
    generatorWindow.loadFile(path.join(__dirname, 'image-generator.html'));
    generatorWindow.on('close', (e) => { if (!app.isQuiting) { e.preventDefault(); generatorWindow.hide(); } });

    settingsWindow = new BrowserWindow({ width: 600, height: 450, show: false, title: "Pengaturan", webPreferences: { preload: path.join(__dirname, 'preload-settings.js') } });
    settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
    settingsWindow.on('close', (e) => { if (!app.isQuiting) { e.preventDefault(); settingsWindow.hide(); } });

    subscriptionWindow = new BrowserWindow({ width: 800, height: 600, show: false, title: "Langganan", webPreferences: { preload: path.join(__dirname, 'preload-subscription.js') } });
    subscriptionWindow.loadFile(path.join(__dirname, 'subscription.html'));
    subscriptionWindow.on('close', (e) => { if (!app.isQuiting) { e.preventDefault(); subscriptionWindow.hide(); } });

    const notifOptions = { width: 250, height: 80, frame: false, transparent: true, alwaysOnTop: true, show: false, resizable: false, skipTaskbar: true };
    
    thinkingWindow = new BrowserWindow(notifOptions);
    thinkingWindow.loadFile(path.join(__dirname, 'thinking.html'));

    copiedWindow = new BrowserWindow(notifOptions);
    copiedWindow.loadFile(path.join(__dirname, 'copied.html'));

    waitWindow = new BrowserWindow(notifOptions);
    waitWindow.loadFile(path.join(__dirname, 'wait.html'));
}

function processText(text) {
    aiTextResultCache = '';
    if (!text || text.trim() === '') return;
    const startTime = Date.now();
    thinkingWindow.show();
    
    const token = store.get('accessToken');
    axios.post(`${serverUrl}/api/process-text`, { text: text }, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        aiTextResultCache = res.data.result;
        new Notification({ title: 'Asisten AI', body: `Teks selesai! Tekan ${hotkeys.copyTextResult} untuk menyalin.` }).show();
    })
    .catch(error => handleApiError(error, 'Teks'))
    .finally(() => {
        const remainingTime = 500 - (Date.now() - startTime);
        setTimeout(() => thinkingWindow.hide(), Math.max(0, remainingTime));
    });
}

function processLastCopiedText() {
    if (!lastCopiedText || lastCopiedText.trim() === '') return;
    processText(lastCopiedText);
}

function copyTextResult() {
    if (!aiTextResultCache) {
        if (waitWindow) {
            waitWindow.show();
            setTimeout(() => { waitWindow.hide(); }, 2000);
        }
        return;
    }
    isInternalCopy = true;
    clipboard.writeText(aiTextResultCache);
    if (copiedWindow) {
        copiedWindow.show();
        setTimeout(() => {
            copiedWindow.hide();
            isInternalCopy = false;
        }, 1500);
    } else {
        isInternalCopy = false;
    }
}

function shutdownMainApp() {
    [generatorWindow, settingsWindow, subscriptionWindow, thinkingWindow, copiedWindow, waitWindow, googleLoginWindow, paymentWindow, loginWindow].forEach(win => {
        if (win && !win.isDestroyed()) { win.destroy(); }
    });
    generatorWindow = settingsWindow = subscriptionWindow = thinkingWindow = copiedWindow = waitWindow = googleLoginWindow = paymentWindow = loginWindow = null;
}

function logout() {
    store.delete('accessToken');
    if (tray) tray.destroy();
    tray = null;
    globalShortcut.unregisterAll();
    shutdownMainApp();
    createLoginWindow();
}

function buildTrayMenu() {
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Buka Image Generator', accelerator: hotkeys.openImageGenerator, click: () => generatorWindow.show() },
        { label: 'Proses Teks dari Clipboard', accelerator: hotkeys.processCopiedText, click: processLastCopiedText },
        { label: 'Salin Hasil Teks', accelerator: hotkeys.copyTextResult, click: copyTextResult },
        { type: 'separator' },
        { label: 'Pengaturan', click: () => settingsWindow.show() },
        { type: 'separator' },
        { label: 'Logout', click: logout },
        { label: 'Keluar', click: () => { app.isQuiting = true; app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);
}

function initializeMainApp() {
    if (tray) return;
    loadHotkeys();
    createMainWindows();
    tray = new Tray(path.join(__dirname, 'icon.ico'));
    tray.setToolTip('Asisten AI Multifungsi');
    buildTrayMenu();
    
    globalShortcut.register(hotkeys.openImageGenerator, () => generatorWindow.isVisible() ? generatorWindow.hide() : generatorWindow.show());
    globalShortcut.register(hotkeys.copyTextResult, copyTextResult);
    globalShortcut.register(hotkeys.processCopiedText, processLastCopiedText);
    
    const clipboardEx = require('electron-clipboard-extended');
    clipboardEx.on('text-changed', () => {
        if (isInternalCopy) return;
        lastCopiedText = clipboardEx.readText();
        new Notification({ title: 'Teks Disalin', body: `Tekan ${hotkeys.processCopiedText} untuk memproses dengan AI.` }).show();
    }).startWatching();
}

function createLoginWindow() {
    if (loginWindow) {
        loginWindow.focus();
        return;
    }
    loginWindow = new BrowserWindow({
        width: 400,
        height: 500,
        resizable: false,
        title: "Login",
        webPreferences: {
            preload: path.join(__dirname, 'preload-login.js'),
        }
    });
    loginWindow.loadFile(path.join(__dirname, 'login.html'));
    loginWindow.on('closed', () => { loginWindow = null; });
}

function createGoogleLoginWindow() {
    if (googleLoginWindow) {
        googleLoginWindow.focus();
        return;
    }
    googleLoginWindow = new BrowserWindow({
        width: 600,
        height: 700,
        title: "Login Akun Google",
        webPreferences: {
            preload: path.join(__dirname, 'preload-google.js'),
        }
    });
    googleLoginWindow.loadURL(`${serverUrl}/api/auth/google`);

    googleLoginWindow.on('closed', () => {
        googleLoginWindow = null;
        if (!store.get('accessToken') && !app.isQuiting) {
            createLoginWindow();
        }
    });
}

function handleApiError(error, source = 'Umum') {
    if (error.response && error.response.status === 402) {
        if (subscriptionWindow && !subscriptionWindow.isDestroyed()) {
            subscriptionWindow.show();
            subscriptionWindow.webContents.send('show-page', error.response.data.error, error.response.data.message);
        }
    } else {
        console.error(`Error (${source}):`, error.message);
    }
}

app.whenReady().then(() => {
    app.setAppUserModelId("Asisten AI Multifungsi");

    if (store.get('accessToken')) {
        initializeMainApp();
    } else {
        createLoginWindow();
    }
});

app.on('before-quit', () => {
    if (tray) tray.destroy();
    shutdownMainApp();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', (event) => {
    // Dibiarkan kosong untuk mencegah aplikasi keluar saat semua jendela ditutup
});

// --- HANDLER UNTUK SEMUA KOMUNIKASI IPC ---

ipcMain.on('login:google', () => {
    createGoogleLoginWindow();
});

ipcMain.on('google-login-token', (event, token) => {
    if (token) {
        store.set('accessToken', token);
        if (googleLoginWindow) googleLoginWindow.close();
        if (loginWindow) loginWindow.close();
        initializeMainApp();
    }
});

ipcMain.handle('payment:create-transaction', async (event, productId, price) => {
    try {
        const token = store.get('accessToken');
        const initialAccountInfo = await axios.get(`${serverUrl}/api/user/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        const initialCredits = initialAccountInfo.data.imageCredits;
        const response = await axios.post(`${serverUrl}/api/create-transaction`, { productId, price }, { headers: { 'Authorization': `Bearer ${token}` } });
        const redirectUrl = response.data.redirect_url;
        if (!redirectUrl) throw new Error('URL pembayaran tidak diterima dari server.');
        
        paymentWindow = new BrowserWindow({ width: 800, height: 700, title: "Pembayaran" });
        paymentWindow.loadURL(redirectUrl);

        paymentWindow.on('closed', () => {
            paymentWindow = null;
            if (subscriptionWindow) subscriptionWindow.hide();
            let pollCount = 0;
            const maxPolls = 12;
            const pollInterval = setInterval(async () => {
                try {
                    pollCount++;
                    const currentAccountInfo = await axios.get(`${serverUrl}/api/user/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                    const currentCredits = currentAccountInfo.data.imageCredits;
                    if (currentCredits > initialCredits) {
                        const addedCredits = currentCredits - initialCredits;
                        new Notification({ title: 'Pembayaran Berhasil!', body: `${addedCredits} kuota gambar telah ditambahkan ke akun Anda.` }).show();
                        clearInterval(pollInterval);
                    } else if (pollCount >= maxPolls) {
                        clearInterval(pollInterval);
                    }
                } catch (err) {
                    console.error("Gagal polling info akun:", err.message);
                    clearInterval(pollInterval);
                }
            }, 5000);
        });
        return { success: true };
    } catch (error) {
        console.error('Gagal memproses transaksi:', error.message);
        return { error: error.message };
    }
});

ipcMain.handle('generate-image', async (event, prompt, aspectRatio, style, negativePrompt) => {
    try {
        const token = store.get('accessToken');
        const response = await axios.post(`${serverUrl}/api/generate-image`, 
            { prompt, aspectRatio, style, negativePrompt },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        return { base64Image: response.data.base64Image };
    } catch (error) {
        handleApiError(error, 'Gambar');
        return { error: error.message };
    }
});

ipcMain.handle('download-image', async (event, dataUrl) => {
    const { filePath } = await dialog.showSaveDialog({ defaultPath: `ai-image-${Date.now()}.png` });
    if (filePath) {
        fs.writeFileSync(filePath, Buffer.from(dataUrl.split('base64,')[1], 'base64'));
    }
});

ipcMain.handle('get-hotkeys', () => hotkeys);

ipcMain.handle('set-hotkeys', (event, newHotkeys) => {
    if (!isValid(newHotkeys.openImageGenerator) || !isValid(newHotkeys.copyTextResult) || !isValid(newHotkeys.processCopiedText)) {
        return { success: false };
    }
    globalShortcut.unregisterAll();
    const success1 = globalShortcut.register(newHotkeys.openImageGenerator, () => generatorWindow.isVisible() ? generatorWindow.hide() : generatorWindow.show());
    const success2 = globalShortcut.register(newHotkeys.copyTextResult, copyTextResult);
    const success3 = globalShortcut.register(newHotkeys.processCopiedText, processLastCopiedText);
    if (success1 && success2 && success3) {
        store.set('hotkey.image', newHotkeys.openImageGenerator);
        store.set('hotkey.text', newHotkeys.copyTextResult);
        store.set('hotkey.process', newHotkeys.processCopiedText);
        hotkeys = newHotkeys;
        buildTrayMenu();
        return { success: true };
    } else {
        globalShortcut.unregisterAll();
        globalShortcut.register(hotkeys.openImageGenerator, () => generatorWindow.isVisible() ? generatorWindow.hide() : generatorWindow.show());
        globalShortcut.register(hotkeys.copyTextResult, copyTextResult);
        globalShortcut.register(hotkeys.processCopiedText, processLastCopiedText);
        return { success: false };
    }
});

ipcMain.on('logout', logout);

ipcMain.handle('get-account-info', async () => {
    try {
        const token = store.get('accessToken');
        if (!token) throw new Error("Token tidak ditemukan");
        
        const response = await axios.get(`${serverUrl}/api/user/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Gagal mengambil info akun:', error.message);
        return null;
    }
});

ipcMain.on('close-subscription-window', () => {
    if (subscriptionWindow) {
        subscriptionWindow.hide();
    }
});
