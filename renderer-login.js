document.addEventListener('DOMContentLoaded', () => {
    const googleLoginButton = document.getElementById('google-login-btn');
    if (googleLoginButton) {
        googleLoginButton.addEventListener('click', () => {
            // Mengirim sinyal 'auth:google' ke main.js saat tombol diklik
            window.loginAPI.authGoogle();
        });
    }
});