document.addEventListener('DOMContentLoaded', function() {
    // Fetch and update the wallet balance
    async function fetchAndUpdateBalance(address, authToken) {
        const loader = document.getElementById('balance-loader');
        if (loader) {
            loader.style.display = 'inline-block'; // Show the loader
        }

        try {
            const response = await fetch(`https://log-iam-temp.finloge.com/api/wallet-balance/`, {
                method: 'GET',
                headers: {
                    'Authorization': `token ${authToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                const balanceElement = document.getElementById('balance');
                if (balanceElement) {
                    const balance = parseFloat(data.data); // Convert the balance to a number
                    balanceElement.textContent = `AED ${balance.toFixed(3)}`; // Format balance to 3 decimal places
                    if (loader) {
                        loader.style.display = 'none'; // Hide the loader after fetching the balance
                    }
                }
            } else {
                console.error('Failed to fetch balance:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    }

    // Function to lock the wallet and log out
    async function lockWallet() {
        chrome.storage.local.get(['authToken'], async function(result) {
            const authToken = result.authToken;

            if (!authToken) {
                console.error('No authToken found. Cannot log out.');
                return;
            }

            try {
                const response = await fetch(`https://log-iam-temp.finloge.com/api/mobile-logout/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${authToken}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    chrome.storage.local.remove(['userInfo', 'authToken'], function() {
                        chrome.runtime.sendMessage({ action: 'lock_wallet' }, function(response) {
                            if (response.success) {
                                window.close();
                            } else {
                                console.error('Failed to close full-screen tab.');
                            }
                        });
                    });
                } else {
                    console.error('Failed to log out.');
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout. Please try again.');
            }
        });
    }

    // Check if the lock button exists and set event listener
    const lockButton = document.getElementById('lock-wallet-btn');
    if (lockButton) {
        lockButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to lock the wallet?')) {
                lockWallet();
            }
        });
    }

    // Fetch user info and update UI
    chrome.storage.local.get(['userInfo', 'authToken'], async function(result) {
        const userInfo = result.userInfo;
        const authToken = result.authToken;

        if (!userInfo) {
            window.close(); // Close if no user info is found
        } else {
            const usernameElement = document.getElementById('username');
            const addressElement = document.getElementById('address');

            if (usernameElement && addressElement) {
                usernameElement.textContent = userInfo.name;
                addressElement.textContent = userInfo.address;

                if (authToken) {
                    await fetchAndUpdateBalance(userInfo.address, authToken);
                    setInterval(() => fetchAndUpdateBalance(userInfo.address, authToken), 4000);
                }
            }
        }
    });

    // Function to handle address copy
    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            const walletAddressElement = document.getElementById('address');
            const copyMessageElement = document.getElementById('copy-message');

            if (walletAddressElement && walletAddressElement.textContent !== 'N/A') {
                navigator.clipboard.writeText(walletAddressElement.textContent).then(() => {
                    if (copyMessageElement) {
                        copyMessageElement.style.display = 'inline'; // Show copied message
                        setTimeout(() => { copyMessageElement.style.display = 'none'; }, 1000);
                    }
                }).catch(err => {
                    console.error('Failed to copy address:', err);
                });
            } else {
                alert('No wallet address to copy.');
            }
        });
    }
});
