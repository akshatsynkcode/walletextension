document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loader = document.getElementById('loader');
    const loginButton = document.getElementById('login-btn');

    // Check if user is already logged in and redirect if necessary
    chrome.storage.local.get(['userInfo'], (result) => {
        if (result.userInfo) {
            window.location.href = 'popup.html';  // User is already logged in, redirect to main popup
        }
    });

    // Handle the login when the login button is clicked
    document.getElementById('login-btn').addEventListener('click', async function login() {
        const email = emailInput.value;
        const password = passwordInput.value;
        
        errorMessage.textContent = '';  // Clear previous error messages

        // Validate input
        if (!email || !password) {
            errorMessage.textContent = 'Please enter both email and password.';
            return;
        }

        // Show the loader and hide the login button
        loginButton.style.display = 'none';
        loader.style.display = 'block';

        try {
            const response = await fetch('https://log-iam.finloge.com/api/mobile-login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const walletDetails = data.data.wallet_details[0];

                // Store the user info and auth token in chrome storage
                chrome.storage.local.set({
                    userInfo: {
                        name: walletDetails.full_name,
                        address: walletDetails.wallet_address,
                        balance: walletDetails.balance
                    },
                    authToken: data.token
                }, function () {
                    if (chrome.runtime.lastError) {
                        console.error('Error setting userInfo:', chrome.runtime.lastError);
                        errorMessage.textContent = 'Failed to store user info.';
                        loader.style.display = 'none';
                        loginButton.style.display = 'block';
                        return;
                    }

                    // Redirect to popup.html after successful login
                    window.location.href = 'popup.html';

                    // Send message to open the popup window for the wallet
                    chrome.runtime.sendMessage({ action: 'openPopup' });
                });

            } else {
                errorMessage.textContent = data.message || 'Login failed, please try again.';
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorMessage.textContent = 'An error occurred during login. Please try again.';
        } finally {
            // Hide the loader and show the login button
            loader.style.display = 'none';
            loginButton.style.display = 'block';
        }
    });
});
