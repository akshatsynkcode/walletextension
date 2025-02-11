function redirectToLogin() {
  chrome.storage.sync.remove(['authToken', 'connectedSites']);
  window.location.href = 'login.html';
}

function showFullScreenLoader() {
    document.getElementById('full-screen-loader').style.display = 'flex';
  }
  
  // Hide the full-screen loader
  function hideFullScreenLoader() {
    document.getElementById('full-screen-loader').style.display = 'none';
  }
function truncateWalletAddress(walletAddress, startChars = 6, endChars = 6, separator = '.......') {
  if (!walletAddress || walletAddress.length <= startChars + endChars) {
      return walletAddress; // Return the full address if it's too short to truncate
  }
  return `${walletAddress.substring(0, startChars)}${separator}${walletAddress.substring(walletAddress.length - endChars)}`;
}

// // Lock wallet and redirect to login
async function lockWallet() {
  const { authToken } = await chrome.storage.sync.get('authToken');
  if (!authToken) {
      console.error('No authToken found. Cannot log out.');
      return;
  }

  try {
      const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-logout', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
          const data = await response.json();
          if (data.message === "Successfully Logged Out") {
              chrome.storage.sync.remove(['authToken', 'connectedSites'], () => {
                  chrome.runtime.sendMessage({ action: 'lock_wallet' }, (response) => {
                      if (response.success) {
                          window.location.href = 'login.html';
                      } else {
                          console.error('Failed to close full-screen tab.');
                      }
                  });
              });
              chrome.runtime.sendMessage({ action: 'logout' });
          } else {
              alert('Logout failed. Please try again.');
          }
      } else {
          alert('Logout failed. Please try again.');
      }
  } catch (error) {
      console.error('Error during logout:', error);
      alert('An error occurred during logout. Please try again.' + response.status);
  }
}
async function fetchUpdatedUserProfile() {
    showFullScreenLoader();  // Show loader before making the API call
    const { authToken } = await chrome.storage.sync.get('authToken');
    if (!authToken) {
      console.error('Authorization token is missing');
      redirectToLogin();
      hideFullScreenLoader();  // Hide loader when redirecting
      return;
    }
  
    try {
      const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-profile', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
  
      if (response.ok) {
        const data = await response.json();
        renderConnectedSites(data.connected_sites);  // Render connected sites from the response
  
        const updatedUserInfo = {
          fullName: data.fullName,
          walletAddress: data.walletAddress,
          email: data.email
        };
  
        // Render wallet ID, username, and email in the correct order
        const walletAddressElement = document.getElementById('wallet-address');
        const usernameElement = document.getElementById('username');
        const emailElement = document.getElementById('email');
  
        // Set the text content in the correct order
        walletAddressElement.setAttribute('data-full-address', updatedUserInfo.walletAddress);
        walletAddressElement.textContent = truncateWalletAddress(updatedUserInfo.walletAddress) || 'Guest';
        usernameElement.textContent = updatedUserInfo.fullName || 'N/A';
        emailElement.textContent = updatedUserInfo.email || 'N/A';
  
        hideFullScreenLoader();  // Hide loader after the data is fetched successfully
        return data;
      } else if (response.status === 404) {
        console.error('Token expired or invalid, redirecting to login.');
        redirectToLogin();
        hideFullScreenLoader();  // Hide loader if token is invalid
      } else {
        console.error('Failed to fetch user profile:', response.statusText);
        hideFullScreenLoader();  // Hide loader in case of error
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      hideFullScreenLoader();  // Hide loader on error
    }
  }
function renderConnectedSites(sites) {
    if (!sites) {
        console.error('No connected sites data available');
        return;
    }

    const container = document.querySelector('.d-flex.flex-column'); // The container where connected sites should be appended
    container.innerHTML = ''; // Clear existing content

    sites.forEach(site => {
        const siteDiv = document.createElement('div');
        siteDiv.className = 'w-100 mb-4';
        siteDiv.innerHTML = `
            <div class="dropdown dropdown-menu-end w-100">
                <a class="btn btn-transparent custom-btn dropdown-toggle py-3 font-14 w-100 d-flex justify-content-between align-items-center"
                    type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <div class="d-flex align-items-center">
                        <img src="${site.service_image}" alt="" class="img-fluid me-2 custom-img">
                        <span class="mx-4">${site.service_name}</span>
                        <span class="text-color-cs">${site.service_url}</span>
                    </div>
                    <i class="fas fa-chevron-down me-3 text-color-cs-drop f-16"></i>
                </a>
                <ul class="dropdown-menu ms-4">
                    <li><button class="dropdown-item btn btn-transparent text-color-cs">Forget Site</button></li>
                    <li><button class="dropdown-item btn btn-transparent text-color-cs">Disconnect</button></li>
                </ul>
            </div>
        `;
        container.appendChild(siteDiv);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchUpdatedUserProfile(); // Fetch and render profile and connected sites on load
});

  document.addEventListener('DOMContentLoaded', async () => {
    const { authToken } = await chrome.storage.sync.get(['authToken']);
  
    if (!authToken) {
        redirectToLogin();
        return;
    }
  
    const usernameElement = document.getElementById('username');
    const walletAddressElement = document.getElementById('wallet-address');
    const emailElement = document.getElementById('email');
    const copyButton = document.getElementById('copy-button');
    const copyMessage = document.getElementById('copy-message');
    if(copyButton){
        copyButton.addEventListener('click', () => {
            const fullWalletAddress = walletAddressElement.getAttribute('data-full-address'); // Get full address

            if (fullWalletAddress) {
                navigator.clipboard.writeText(fullWalletAddress)
                .then(() => {
                    copyMessage.style.display = 'inline';
                    setTimeout(() => {
                    copyMessage.style.display = 'none';
                    }, 1000);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
            }
        });
    }
  
    if (usernameElement && walletAddressElement) {
        // Fetch updated profile
        const updatedProfile = await fetchUpdatedUserProfile();
        if (updatedProfile) {
            const updatedUserInfo = {
                fullName: updatedProfile.fullName,
                walletAddress: updatedProfile.walletAddress,
                email: updatedProfile.email
            };
            walletAddressElement.setAttribute('data-full-address', updatedUserInfo.walletAddress);
            walletAddressElement.textContent = truncateWalletAddress(updatedUserInfo.walletAddress) || 'Guest';
            usernameElement.textContent = updatedUserInfo.fullName || 'N/A';
            emailElement.textContent = updatedProfile.email || 'N/A';

        }
        
        // Fetch transaction history
        // await fetchAndUpdateTransactionHistory(currentPage);
  
        // Periodic balance update
    }
    // Logout functionality
    const lockButton = document.getElementById('lock-wallet-btn');
    if (lockButton) {
        lockButton.addEventListener('click', () => {
            const lockModal = new bootstrap.Modal(document.getElementById('exampleModal'));
            lockModal.show();
            const confirmButton = document.querySelector('.yes-btn');
            confirmButton.addEventListener('click', () => {
                lockModal.hide();
                lockWallet();
            }, { once: true });
        });
    }
  });