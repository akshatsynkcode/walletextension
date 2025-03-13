const baseApiUrl = 'https://dev-wallet-api.dubaicustoms.network';
document.addEventListener("DOMContentLoaded", function () {
    const isPopup = document.querySelector(".popup-login-container") !== null;
    const baseApiUrl = 'https://dev-wallet-api.dubaicustoms.network';
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loader = document.getElementById('loader');
    const loginButton = document.getElementById('login-btn');
    const expandButton = document.getElementById('expand-btn');

    if (expandButton) {
        expandButton.addEventListener("click", function () {
            window.open("login.html", "_blank");
        });
    }

    chrome.storage.sync.get(['authToken'], function (result) {
        if (result.authToken) {
            window.location.href = 'profile.html';
        }
    });

    if (loginButton) {
        loginButton.addEventListener('click', async function login(event) {  // Added async here ✅
            event.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            errorMessage.textContent = '';

            if (!email || !password) {
                errorMessage.textContent = 'Please enter both email and password.';
                return;
            }

            loginButton.disabled = true;
            loader.style.display = 'block';
            loginButton.style.display = 'none';

            try {
                const response = await fetch(`${baseApiUrl}/api/ext-login`, {  
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    chrome.storage.sync.set({
                        authToken: data.token,
                        connectedSites: data.connected_sites,
                        email: data.email
                    }, function () {
                        if (chrome.runtime.lastError) {
                            console.error('Error setting authToken:', chrome.runtime.lastError);
                            errorMessage.textContent = 'Failed to store auth token.';
                        } else {
                            chrome.runtime.sendMessage({ action: "reset_popup" });
                            if(isPopup) {
                                window.location.href = 'popup.html';
                            } else {
                                window.location.href = 'profile.html';
                            }
                        }
                    });
                    chrome.runtime.sendMessage({ action: 'login' });

                } else {
                    errorMessage.textContent = data.message || 'Login failed, please try again.';
                }
            } catch (error) {
                console.error('Error during login:', error);
                errorMessage.textContent = 'An error occurred during login. Please try again.';
            } finally {
                loader.style.display = 'none';
                loginButton.style.display = 'block';
                loginButton.disabled = false;
            }
        });
    } else {
        console.warn("login-btn not found!");
    }

    const togglePassword = document.getElementById('toggle-password');
    togglePassword.addEventListener('click', function () {
        // Toggle the type between password and text
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
    
        // Change the eye icon based on password visibility
        const icon = togglePassword.querySelector('i');
        if (type === 'password') {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });

    const forgotPassword = document.getElementById("forgot-password")
    forgotPassword.addEventListener("click", async function (event) {
        event.preventDefault();
            // Define the API URL based on the environment
            const apiUrl = baseApiUrl.includes('dev')
                ? 'https://dev-wallet-api.dubaicustoms.network/api/forgot-password'
                : 'https://wallet-api.dubaicustoms.network/api/forgot-password';  // Assuming you have a production URL
            try {
                // Fetch the forgot password URL from the API
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Network response was not ok.');
                const data = await response.json();
                const IAM_URL = data.forgotPassword;
                // Open the URL in a new tab
                window.open(IAM_URL, "_blank", "noopener,noreferrer");
            } catch (error) {
                console.error('There was a problem with the fetch operation:', error);
            }
    });
});
