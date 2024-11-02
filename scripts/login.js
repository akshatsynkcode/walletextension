document.getElementById('login-btn').addEventListener('click', async function login(event) {
    event.preventDefault();  // Prevent default form submission behavior

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.getElementById('login-btn');
    const loginLoader = document.getElementById('login-loader');

    errorMessage.textContent = '';  // Clear any previous errors

    // Validate input fields
    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password.';
        return;
    }

    // Show the loader and hide the login button
    loginButton.disabled = true;  // Disable button to prevent multiple clicks
    loginLoader.style.display = 'block';
    loginButton.style.display = 'none';

    try {
        const response = await fetch('http://13.233.172.115:3000/api/ext-login', {  // Updated to proxy server URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            const loginScreen = document.getElementById('login-screen');
            loginScreen.style.display = 'none';
            const otpScreen = document.getElementById('otp-screen');
            otpScreen.style.display = 'block'
        } else {
            // Display the login error message from the response
            errorMessage.textContent = data.message || 'Login failed, please try again.';
        }
    } catch (error) {
        console.error('Error during login:', error);
        errorMessage.textContent = 'An error occurred during login. Please try again.';
        loginLoader.style.display = 'none';
        loginButton.style.display = 'block';
        loginButton.disabled = false;
    } 
    // finally {
    //     // Hide the loginLoader and show the login button
    //     loginLoader.style.display = 'none';
    //     loginButton.style.display = 'block';
    //     loginButton.disabled = false;  // Re-enable the button
    // }


});


document.getElementById('verify-otp-btn').addEventListener('click', async function verifyOtp(event) {
    event.preventDefault();  // Prevent default form submission behavior

    const otp = document.getElementById('otp').value;
    const email = document.getElementById('email').value;
    const verifyOtpButton = document.getElementById('verify-otp-btn');
    const otpLoader = document.getElementById('otp-loader');
    const errorMessage = document.getElementById('otp-error-message');

    errorMessage.textContent = '';  // Clear any previous errors

    // Validate input fields
    if (!otp) {
        errorMessage.textContent = 'Please enter OTP';
        return;
    }

    // Show the loader and hide the login button
    verifyOtpButton.disabled = true;  // Disable button to prevent multiple clicks
    otpLoader.style.display = 'block';
    verifyOtpButton.style.display = 'none';

    try {
        const response = await fetch(`http://13.233.172.115:3000/api/ext-login?email=${encodeURIComponent(email)}&userOtp=${encodeURIComponent(otp)}`, {  // Updated to proxy server URL
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Store the token in chrome.storage.sync
            chrome.storage.sync.set({
                authToken: data.token
            }, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error setting authToken:', chrome.runtime.lastError);
                    errorMessage.textContent = 'Failed to store auth token.';
                    otpLoader.style.display = 'none';
                    verifyOtpButton.style.display = 'block';
                    return;
                }
                // Redirect to profile.html after successful login
                window.location.href = 'profile.html';
            });

        } else {
            // Display the login error message from the response
            errorMessage.textContent = data.message || 'Login failed, please try again.';
        }
    } catch (error) {
        console.error('Error during login:', error);
        errorMessage.textContent = 'An error occurred during login. Please try again.';
    }
    finally {
        // Hide the loginLoader and show the login button
        otpLoader.style.display = 'none';
        verifyOtpButton.style.display = 'block';
        verifyOtpButton.disabled = false;  // Re-enable the button
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
