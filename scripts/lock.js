document.getElementById('lock-wallet-btn').addEventListener('click', async () => {
  // Show confirmation dialog
  if (confirm('Are you sure you want to lock the wallet?')) {
      // Retrieve the authentication token
      chrome.storage.local.get('authToken', async (data) => {
          const authToken = data.authToken;

          try {
              const response = await fetch('https://log-iam.finloge.com/api/mobile-logout/', {
                  method: 'POST',
                  headers: {
                      'Authorization': `token ${authToken}`,
                      'Content-Type': 'application/json'
                  }
              });
              if (response.ok) {
                  // Clear user information from storage
                  chrome.storage.local.remove(['userInfo', 'authToken'], () => {
                      // Redirect to login screen in popup
                      chrome.runtime.sendMessage({ action: 'logout' }, () => {
                          if (chrome.runtime.lastError) {
                              console.error('Error sending logout message:', chrome.runtime.lastError);
                          }
                      });

                      // Close current full-screen tab if it's a tabbed window
                      if (window.location.href.includes('profile.html')) {
                          window.close(); // Closes the current tab
                      }
                  });
              } else {
                  console.error('Failed to log out');
                  alert('Logout failed. Please try again.');
              }
          } catch (error) {
              console.error('Error during logout:', error);
              alert('An error occurred during logout. Please try again.');
          }
      });
  }
});
