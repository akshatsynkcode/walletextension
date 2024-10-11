document.addEventListener('DOMContentLoaded', function() {

    // Fetch and update the wallet balance
    async function fetchAndUpdateBalance(address, authToken) {
        const loader = document.getElementById('balance-loader');
        if (loader) {
            loader.style.display = 'inline-block'; // Show the loader
        }

        try {
            const response = await fetch(`http://13.233.172.115:3000/api/wallet-balance`, {
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
        } finally {
            if (loader) {
                loader.style.display = 'none';
            }
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
                const response = await fetch(`http://13.233.172.115:3000/api/mobile-logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${authToken}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // Successfully logged out, remove user info
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
                        console.error('Logout failed. Please try again.');
                        alert('Logout failed. Please try again.');
                    }
                } else {
                    console.error('Failed to log out:', response.statusText);
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout. Please try again.');
            }
        });
    }

    // Event listener for lock button
    const lockButton = document.getElementById('lock-wallet-btn');
    if (lockButton) {
        if (!lockButton.hasAttribute('listener-added')) {
            lockButton.setAttribute('listener-added', 'true');
            lockButton.addEventListener('click', function() {
                const lockModal = new bootstrap.Modal(document.getElementById('exampleModal'));
                lockModal.show();

                const confirmButton = document.querySelector('.yes-btn');
                confirmButton.addEventListener('click', function() {
                    lockModal.hide();
                    lockWallet();
                }, { once: true });
            });
        }
    }

    // Fetch user info and update UI
    chrome.storage.local.get(['userInfo', 'authToken'], async function(result) {
        const userInfo = result.userInfo;
        const authToken = result.authToken;

        if (!userInfo) {
            window.close();
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
                        copyMessageElement.style.display = 'inline';
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

    document.addEventListener('DOMContentLoaded', function() {
        const mainContent = document.querySelector('.popup-container');
        const connectWalletScreen = document.getElementById('connect-wallet-screen');
    
        function showConnectWalletScreen() {
            mainContent.style.display = 'none';
            connectWalletScreen.style.display = 'block';
        }
    
        function hideConnectWalletScreen() {
            mainContent.style.display = 'block';
            connectWalletScreen.style.display = 'none';
        }
    
        // Approve button handler
        document.getElementById('approve-connection-btn').addEventListener('click', function() {
            chrome.runtime.sendMessage({ action: 'approve_connection' }, function() {
                hideConnectWalletScreen();
                window.close(); // Close the popup
            });
        });
    
        // Reject button handler
        document.getElementById('reject-connection-btn').addEventListener('click', function() {
            chrome.runtime.sendMessage({ action: 'reject_connection' }, function() {
                hideConnectWalletScreen();
                window.close(); // Close the popup
            });
        });
    
        // Listen for the message to show the connect wallet approval screen
        chrome.runtime.onMessage.addListener(function(message) {
            if (message.action === 'show_connect_wallet') {
                showConnectWalletScreen();
            }
        });
    });
    
    
});

document.getElementById('expand-btn').addEventListener('click', function(event) {
    event.preventDefault();
    // Open the login.html in a new fullscreen window
    window.open('login.html', '_blank');
});