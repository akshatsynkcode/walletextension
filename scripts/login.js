document.getElementById('login-btn').addEventListener('click', async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = '';

  if (!email || !password) {
    errorMessage.textContent = 'Please enter both email and password.';
    return;
  }

  try {
    const response = await fetch('https://log-iam.finloge.com/api/mobile-login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Storing the user and wallet details from the response using chrome.storage.local
      const walletDetails = data.data.wallet_details[0]; // Assuming the first entry is the correct one

      chrome.storage.local.set({
        userInfo: {
          name: walletDetails.full_name,
          address: walletDetails.wallet_address,
          balance: walletDetails.balance
        },
        authToken: data.token  // Storing the authentication token for future API calls
      }, function () {
        if (chrome.runtime.lastError) {
          console.error('Error setting userInfo:', chrome.runtime.lastError);
          errorMessage.textContent = 'Failed to store user info.';
          return;
        }
        // Redirect to the profile page after successful login and storage
        window.location.href = 'profile.html';
      });

    } else {
      errorMessage.textContent = data.message || 'Login failed, please try again.';
    }
  } catch (error) {
    console.error('Error during login:', error);
    errorMessage.textContent = 'An error occurred during login. Please try again.';
  }
});
