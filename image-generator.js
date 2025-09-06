const promptInput = document.getElementById('prompt-input');
const styleSelect = document.getElementById('style-select');
const negativePromptInput = document.getElementById('negative-prompt-input');
const generateButton = document.getElementById('generate-button');
const downloadButton = document.getElementById('download-button');
const loader = document.getElementById('loader');
const resultImage = document.getElementById('result-image');
const errorText = document.createElement('p');
errorText.className = 'error-text';
document.querySelector('.output-area').appendChild(errorText);

generateButton.addEventListener('click', async () => {
    const prompt = promptInput.value;
    const style = styleSelect.value;
    const negativePrompt = negativePromptInput.value;
    const selectedRatio = document.querySelector('input[name="aspect_ratio"]:checked').value;

    if (!prompt.trim()) return;

    loader.style.display = 'block';
    resultImage.style.display = 'none';
    errorText.style.display = 'none';
    generateButton.disabled = true;
    downloadButton.disabled = true;
    
    try {
        const result = await window.api.generateImage(prompt, selectedRatio, style, negativePrompt);
        
        if (result.isQuotaError) {
            // main.js sudah menangani pembukaan jendela langganan
            return; 
        }

        if (result.base64Image) {
            resultImage.src = `data:image/png;base64,${result.base64Image}`;
            resultImage.style.display = 'block';
            downloadButton.disabled = false;
        } else {
            errorText.textContent = 'Gagal membuat gambar. Coba prompt lain atau periksa kuota Anda.';
            errorText.style.display = 'block';
        }
    } catch (e) {
        errorText.textContent = 'Terjadi error: ' + e.message;
        errorText.style.display = 'block';
    } finally {
        loader.style.display = 'none';
        generateButton.disabled = false;
    }
});

downloadButton.addEventListener('click', () => {
    if (resultImage.src) {
        window.api.downloadImage(resultImage.src);
    }
});
