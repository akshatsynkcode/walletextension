const baseApiUrl = 'https://dev-wallet-api.dubaicustoms.network';

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loader = document.getElementById('loader');
    const loginButton = document.getElementById('login-btn');
    const expandButton = document.getElementById('expand-btn'); // Get the expand button by ID

    // Add event listener for the expand button
    expandButton.addEventListener('click', () => {
        window.open('login.html', '_blank'); // Redirect to the full login page in a new tab
    });

    // Check if user is already logged in and redirect if necessary
    chrome.storage.sync.get(['authToken'], (result) => {
        if (result.authToken) {
            console.log('User is already logged in');
            window.location.href = 'popup.html';  // Redirect to main popup
        }
    });

    // Handle the login when the login button is clicked
    loginButton.addEventListener('click', async function login(event) {
        event.preventDefault();  // Prevent default form submission behavior

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
            const response = await fetch(`${baseApiUrl}/api/ext-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Store the auth token in chrome storage
                chrome.storage.sync.set({
                    authToken: data.token,
                    connectedSites: data.connected_sites,
                    email:data.email
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error setting authToken:', chrome.runtime.lastError);
                        errorMessage.textContent = 'Failed to store auth token.';
                        loader.style.display = 'none';
                        loginButton.style.display = 'block';
                        return;
                    }                    

                    // Redirect to popup.html after successful login
                    window.location.href = 'popup.html';
                });
            } else {
                errorMessage.textContent = data.message || 'Login failed, please try again.';
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorMessage.textContent ='Login failed, please try again.';
        } finally {
            // Hide the loader and show the login button
            loader.style.display = 'none';
            loginButton.style.display = 'block';
        }
    });

    // Toggle password visibility
    const togglePassword = document.getElementById('toggle-password');
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      this.querySelector('i').classList.toggle('fa-eye-slash');
      this.querySelector('i').classList.toggle('fa-eye');
    });

    // Redirect to forgot password
    document.getElementById("forgot-password").addEventListener("click", function (event) {
        event.preventDefault();
        const IAM_URL = baseApiUrl.includes('dev') ? "https://log-iam-temp.finloge.com/forgot-password/" : "https://ime.dubaicustoms.network/forgot-password/";
        window.open(IAM_URL, "_blank", "noopener,noreferrer");
    });
});
