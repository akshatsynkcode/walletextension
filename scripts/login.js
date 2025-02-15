const baseApiUrl = 'https://dev-wallet-api.dubaicustoms.network';

document.getElementById('login-btn').addEventListener('click', async function login(event) {
    event.preventDefault();  // Prevent default form submission behavior

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.getElementById('login-btn');
    const loader = document.getElementById('loader');

    errorMessage.textContent = '';  // Clear any previous errors

    // Validate input fields
    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password.';
        return;
    }

    // Show the loader and hide the login button
    loginButton.disabled = true;  // Disable button to prevent multiple clicks
    loader.style.display = 'block';
    loginButton.style.display = 'none';

    try {
        const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-login', {  // Updated to proxy server URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Store the token in chrome.storage.sync
            chrome.storage.sync.set({
                authToken: data.token,
                connectedSites: data.connected_sites,
                email:data.email
            }, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error setting authToken:', chrome.runtime.lastError);
                    errorMessage.textContent = 'Failed to store auth token.';
                    loader.style.display = 'none';
                    loginButton.style.display = 'block';
                    return;
                }
                // Redirect to profile.html after successful login
                window.location.href = 'profile.html';
            });
            chrome.runtime.sendMessage({ action: 'login' });

        } else {
            // Display the login error message from the response
            errorMessage.textContent = data.message || 'Login failed, please try again.';
        }
    } catch (error) {
        console.error('Error during login:', error);
        errorMessage.textContent = 'An error occurred during login. Please try again.';
    } finally {
        // Hide the loader and show the login button
        loader.style.display = 'none';
        loginButton.style.display = 'block';
        loginButton.disabled = false;  // Re-enable the button
    }
});

// Check if the user is already logged in (authToken in chrome.storage.sync)
window.onload = function () {
    chrome.storage.sync.get(['authToken'], function (result) {
        if (result.authToken) {
            // If auth token is found, redirect to profile
            window.location.href = 'profile.html';
        }
    });
};

  const togglePassword = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');

  togglePassword.addEventListener('click', function() {
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("forgot-password").addEventListener("click", function (event) {
        event.preventDefault();
        let IAM_URL = "";
        if (baseApiUrl.includes('dev')){
            IAM_URL = "https://ime.finloge.com/forgot-password/";
        }
        else{
            IAM_URL = "https://ime.dubaicustoms.network/forgot-password/";
        }
        window.open(IAM_URL, "_blank", "noopener,noreferrer");
    });
});