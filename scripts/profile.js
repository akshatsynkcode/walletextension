// Redirect to login if no token or token is invalid
function redirectToLogin() {
    chrome.storage.sync.remove('authToken');
    window.location.href = 'login.html';
  }
  
  // Fetch and update balance
  async function fetchAndUpdateBalance() {
    const loader = document.getElementById('balance-loader');
    if (loader) {
        loader.style.display = 'inline-block'; // Show loader before fetching balance
    }
  
    try {
        const { authToken } = await chrome.storage.sync.get('authToken');
        if (!authToken) {
            console.error('Authorization token is missing');
            redirectToLogin();
            return;
        }
  
        const response = await fetch('https://log-iam-temp.finloge.com/api/ext-balance', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
  
        if (response.ok) {
            const { balance } = await response.json();
            document.getElementById('balance').textContent = `AED ${parseFloat(balance).toFixed(3)}`;
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            redirectToLogin();
        } else {
            console.error('Failed to fetch balance:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
    } finally {
        if (loader) {
            loader.style.display = 'none'; // Hide loader after balance is fetched
        }
    }
  }
  
  // Fetch and update transaction history
  async function fetchAndUpdateTransactionHistory() {
    const loader = document.getElementById('balance-loader');
    if (loader) {
        loader.style.display = 'inline-block'; // Show loader before fetching
    }
  
    try {
        const { authToken } = await chrome.storage.sync.get('authToken');
        if (!authToken) {
            console.error('Authorization token is missing');
            redirectToLogin();
            return;
        }
  
        const response = await fetch('https://log-iam-temp.finloge.com/api/ext-transaction', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
  
        if (response.ok) {
            const { data: transactions } = await response.json();
            if (transactions.length > 0) {
                updateTransactionHistoryUI(transactions); // Pass the transactions array
            }
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            redirectToLogin();
        } else {
            console.error('Failed to fetch transactions:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
    } finally {
        if (loader) {
            loader.style.display = 'none'; // Hide loader after transactions are fetched
        }
    }
  }
  
  // Function to update the UI with the fetched transaction history
  function updateTransactionHistoryUI(transactions) {
    const activityContainer = document.querySelector('.p-3');
    activityContainer.innerHTML = ''; // Clear any existing content
  
    transactions.forEach(transaction => {
        // Create a new card for each transaction
        const transactionCard = document.createElement('div');
        transactionCard.classList.add('card', 'mb-3', 'shadow-sm', 'border-0', 'activity-card');
  
        transactionCard.innerHTML = `
            <div class="row g-0 justify-content-center align-items-center">
                <!-- First Column: Transaction to -->
                <div class="col-4 col-md-4 ps-2">
                    <div class="card-body text-start activity-card-body p-1">
                        <h5 class="card-title font-14 font-regular m-0">To</h5>
                        <a href="#" class="address-link" style="color: rgba(0, 194, 255, 1);">${transaction.to_wallet_address}</a>
                    </div>
                </div>
                
                <!-- Second Column: Amount -->
                <div class="col-4 col-md-4 text-center">
                    <h5 class="card-title font-14 font-regular m-0">AED ${parseFloat(transaction.amount).toFixed(2)}</h5>
                    <p class="card-text font-12"><small class="light-black">${transaction.status}</small></p>
                </div>
                
                <!-- Third Column: Date of the Transaction -->
                <div class="col-4 col-md-4 text-end padding-right">
                    <p class="card-text font-12"><small class="light-black">${new Date(transaction.created_at).toLocaleDateString()}</small></p>
                </div>
            </div>
        `;
  
        activityContainer.appendChild(transactionCard);
    });
  }
  
  // Fetch updated user profile from the API
  async function fetchUpdatedUserProfile() {
    try {
        const { authToken } = await chrome.storage.sync.get('authToken');
        if (!authToken) {
            console.error('Authorization token is missing');
            redirectToLogin();
            return;
        }
  
        const response = await fetch('https://log-iam-temp.finloge.com/api/ext-profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
  
        if (response.ok) {
            const data = await response.json();
            return data;
        } else if (response.status === 404) {
            console.error('Token expired or invalid, redirecting to login.');
            redirectToLogin();
        } else {
            console.error('Failed to fetch user profile:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
  }
  
  // Lock wallet and redirect to login
  async function lockWallet() {
    const { authToken } = await chrome.storage.sync.get('authToken');
    if (!authToken) {
        console.error('No authToken found. Cannot log out.');
        return;
    }
  
    try {
        const response = await fetch('https://log-iam-temp.finloge.com/api/ext-logout', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
  
        if (response.ok) {
            const data = await response.json();
            if (data.message === "Successfully Logged Out") {
                chrome.storage.sync.remove(['authToken'], () => {
                    chrome.runtime.sendMessage({ action: 'lock_wallet' }, (response) => {
                        if (response.success) {
                            window.location.href = 'login.html';
                        } else {
                            console.error('Failed to close full-screen tab.');
                        }
                    });
                });
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
  
  // Event listener for DOM content loading
  document.addEventListener('DOMContentLoaded', async () => {
    const { authToken } = await chrome.storage.sync.get(['authToken']);
  
    if (!authToken) {
        redirectToLogin();
        return;
    }
  
    const usernameElement = document.getElementById('username');
    const walletAddressElement = document.getElementById('wallet-address');
  
    if (usernameElement && walletAddressElement) {
        // Fetch updated profile
        const updatedProfile = await fetchUpdatedUserProfile();
        if (updatedProfile) {
            const updatedUserInfo = {
                fullName: updatedProfile.fullName,
                walletAddress: updatedProfile.walletAddress,
            };
            walletAddressElement.textContent = updatedUserInfo.walletAddress || 'Guest';
            usernameElement.textContent = updatedUserInfo.fullName || 'N/A';
        }
  
        // Fetch balance
        await fetchAndUpdateBalance();
  
        // Fetch transaction history
        await fetchAndUpdateTransactionHistory();
  
        // Periodic balance update
        setInterval(fetchAndUpdateBalance, 4000);
    }
  
    // Copy wallet address functionality
    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const walletAddressElement = document.getElementById('wallet-address');
            const copyMessageElement = document.getElementById('copy-message');
  
            if (walletAddressElement && walletAddressElement.textContent !== 'N/A') {
                navigator.clipboard.writeText(walletAddressElement.textContent).then(() => {
                    copyMessageElement.style.display = 'inline';
                    setTimeout(() => (copyMessageElement.style.display = 'none'), 1000);
                });
            }
        });
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
  