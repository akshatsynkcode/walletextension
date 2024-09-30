document.getElementById('login-btn').addEventListener('click', async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.getElementById('login-btn');
    const loader = document.getElementById('loader');
  
    errorMessage.textContent = '';
    
    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password.';
        return;
    }
  
    // Show the loader and hide the login button
    loginButton.style.display = 'none';
    loader.style.display = 'block';
  
    try {
        const response = await fetch('https://log-iam-temp.finloge.com/api/mobile-login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
  
        const data = await response.json();
  
        if (response.ok && data.success) {
            const walletDetails = data.data.wallet_details[0];
  
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
                    // Hide the loader and show the login button
                    loader.style.display = 'none';
                    loginButton.style.display = 'block';
                    return;
                }
  
                // Redirect to profile.html in full-screen
                window.location.href = 'profile.html';
  
                // Open the popup.html for the wallet directly as a popup
                chrome.runtime.sendMessage({ action: "openPopup" });
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

window.onload = function () {
    chrome.storage.local.get(['userInfo'], function (result) {
        if (result.userInfo) {
            window.location.href = 'profile.html';
        }
    });
}