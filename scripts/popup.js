document.addEventListener('DOMContentLoaded', function() {
    // Fetch and update the wallet balance
    async function fetchAndUpdateBalance(address, authToken) {
        const loader = document.getElementById('balance-loader');
        if (loader) {
            loader.style.display = 'inline-block'; // Show the loader
        }

        try {
            const response = await fetch('https://log-iam-temp.finloge.com/api/ext-balance', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const balanceElement = document.getElementById('balance');
                if (balanceElement) {
                    const balance = parseFloat(data.balance); // Convert the balance to a number
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
        chrome.storage.sync.get(['authToken'], async function(result) {
            const authToken = result.authToken;

            if (!authToken) {
                console.error('No authToken found. Cannot log out.');
                return;
            }

            try {
                // Updated to use the correct GET method for logout
                const response = await fetch('https://log-iam-temp.finloge.com/api/ext-logout', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.message === "Successfully Logged Out") {
                        // Successfully logged out, remove user info
                        chrome.storage.sync.remove(['userInfo', 'authToken'], function() {
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
        // Ensure only one event listener is added
        if (!lockButton.hasAttribute('listener-added')) {
            lockButton.setAttribute('listener-added', 'true');
            lockButton.addEventListener('click', function() {
                // Open modal to confirm lock
                const lockModal = new bootstrap.Modal(document.getElementById('exampleModal'));
                lockModal.show();
                
                const confirmButton = document.querySelector('.yes-btn');
                confirmButton.addEventListener('click', function() {
                    lockModal.hide();
                    lockWallet();
                }, { once: true });  // Ensure only one event listener is added for confirmation
            });
        }
    }

    // Fetch user info and update UI
    chrome.storage.sync.get(['userInfo', 'authToken'], async function(result) {
        const userInfo = result.userInfo;
        const authToken = result.authToken;

        if (!userInfo) {
            window.close(); // Close if no user info is found
        } else {
            const usernameElement = document.getElementById('username');
            const addressElement = document.getElementById('address');

            if (usernameElement && addressElement) {
                usernameElement.textContent = userInfo.fullName;
                addressElement.textContent = userInfo.walletAddress;

                if (authToken) {
                    await fetchAndUpdateBalance(userInfo.walletAddress, authToken);
                    setInterval(() => fetchAndUpdateBalance(userInfo.walletAddress, authToken), 4000);
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

// Event listener for the "Expand Screen" button
document.getElementById('expand-btn').addEventListener('click', function(event) {
    event.preventDefault();
    // Open the profile.html in a new fullscreen window
    window.open('profile.html', '_blank');
});
