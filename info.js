const { shell } = require('electron');

const queryParams = new URLSearchParams(window.location.search);
const SERVER_URL = queryParams.get('serverUrl');

document.addEventListener('DOMContentLoaded', async () => {
    const titleEl = document.getElementById('info-title');
    const messageEl = document.getElementById('info-message');
    const linkEl = document.getElementById('info-link');
    const imageEl = document.getElementById('info-image');

    if (!SERVER_URL) {
        if(titleEl) titleEl.textContent = "Error: serverUrl tidak ditemukan.";
        return;
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/info-terkini`);
        const info = await response.json();

        if (info.show) {
            if (info.imageUrl && imageEl) {
                imageEl.src = info.imageUrl;
                imageEl.style.display = 'block';
            }
            if (info.title && titleEl) {
                titleEl.textContent = info.title;
            }
            if (info.message && messageEl) {
                messageEl.textContent = info.message;
            }
            if (info.linkUrl && info.linkText && linkEl) {
                linkEl.style.display = 'inline-block';
                linkEl.textContent = info.linkText;
                linkEl.href = info.linkUrl;
            }
        } else {
            window.close();
        }
    } catch (error) {
        console.error("Gagal mengambil info terkini:", error);
        window.close();
    }

    if(linkEl) {
        linkEl.addEventListener('click', (e) => {
            e.preventDefault();
            const url = e.target.href;
            if (url && url !== '#') {
                shell.openExternal(url);
            }
        });
    }
});