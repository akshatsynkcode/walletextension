document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['userInfo'], (result) => {
        if (result.userInfo) {
            // Populate the popup with user information
            // Or direct them to the main wallet functionality
        } else {
            // User is not logged in
            document.body.innerHTML = '<p>Please complete the login in the full-screen page first.</p>';
            // Optionally disable buttons or other interactions
        }
    });

    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
    
        try {
            const response = await fetch('https://log-iam.finloge.com/api/mobile-login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                chrome.storage.local.set({
                    userInfo: data.data.wallet_details[0],
                    authToken: data.token  // Store the authToken for later use
                }, () => {
                    window.location.href = 'popup.html';
                });
            } else {
                errorMessage.textContent = data.message || 'Login failed, please try again.';
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorMessage.textContent = 'An error occurred during login. Please try again.';
        }
    });
});
