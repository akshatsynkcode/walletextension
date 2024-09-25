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
                  return;
              }

              // Notify the background script to refresh the popup
              chrome.runtime.sendMessage({ action: "refreshPopup" });

              // Redirect to profile.html
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
