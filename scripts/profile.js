// Fetch and update balance
async function fetchAndUpdateBalance(address) {
    const loader = document.getElementById('balance-loader');
    if (loader) {
        loader.style.display = 'inline-block'; // Show loader before fetching balance
    }

    try {
        const result = await chrome.storage.sync.get('authToken');
        const authToken = result.authToken;
        if (!authToken) {
            console.error('Authorization token is missing');
            loader && (loader.style.display = 'none'); // Hide loader if token is missing
            return;
        }

        const response = await fetch('http://13.233.172.115:3000/api/wallet-balance', {
            method: 'GET',
            headers: {
                'Authorization': `token ${authToken}`
            }
        });

        if (response.ok) {
            const responseData = await response.json();
            const balanceString = responseData.data;
            if (balanceString !== undefined) {
                const balance = parseFloat(balanceString);
                if (!isNaN(balance)) {
                    document.getElementById('balance').textContent = `AED ${balance.toFixed(3)}`;
                } else {
                    console.error('Balance is not a valid number:', balanceString);
                }
            } else {
                console.error('Balance not available in response data');
            }
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            chrome.storage.sync.remove('authToken', () => window.location.href = 'login.html');
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

// Fetch updated user profile from the API
async function fetchUpdatedUserProfile(authToken) {
    try {
        const response = await fetch('http://13.233.172.115:3000/api/user-profile', {
            method: 'GET',
            headers: {
                'Authorization': `token ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            chrome.storage.sync.remove('authToken', () => window.location.href = 'login.html');
        } else {
            console.error('Failed to fetch user profile:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['userInfo', 'authToken'], async (result) => {
        const userInfo = result.userInfo;
        const authToken = result.authToken;

        if (!userInfo || !authToken) {
            window.location.href = 'login.html';
            return;
        }

        const usernameElement = document.getElementById('username');
        const walletAddressElement = document.getElementById('wallet-address');

        if (usernameElement && walletAddressElement) {
            // Fetch updated profile
            const updatedProfile = await fetchUpdatedUserProfile(authToken);
            if (updatedProfile && updatedProfile.data) {
                const updatedUserInfo = {
                    ...userInfo,
                    name: `${updatedProfile.data.first_name} ${updatedProfile.data.last_name}`
                };
                chrome.storage.sync.set({ userInfo: updatedUserInfo });

                usernameElement.textContent = updatedUserInfo.name;
                walletAddressElement.textContent = updatedProfile.data.wallet_details[0].wallet_address || 'N/A';
            } else {
                usernameElement.textContent = userInfo.name || 'Guest';
                walletAddressElement.textContent = userInfo.address || 'N/A';
            }

            await fetchAndUpdateBalance(walletAddressElement.textContent); // Fetch balance

            setInterval(async () => {
                await fetchAndUpdateBalance(walletAddressElement.textContent);
            }, 4000);
        } else {
            console.error('One or more profile elements are missing in the DOM');
        }
    });

    // Copy address-link functionality
    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const walletAddressElement = document.getElementById('address-link');
            const copyMessageElement = document.getElementById('copy-message');
            
            if (walletAddressElement && walletAddressElement.dataset.fullAddress) {
                const fullAddress = walletAddressElement.dataset.fullAddress;
                navigator.clipboard.writeText(fullAddress).then(() => {
                    copyMessageElement.style.display = 'inline';
                    setTimeout(() => (copyMessageElement.style.display = 'none'), 1000);
                });
            }
        });
    }
    
    function formatAddress(address) {
        if (address.length > 10) {
            return address.slice(0, 6) + '...' + address.slice(-4);
        }
        return address;
    }
    
    const fullAddress = '0x13ad787D599B06da0';
    const formattedAddress = formatAddress(fullAddress);
    
    const walletAddressElement = document.getElementById('address-link');
    if (walletAddressElement) {
        walletAddressElement.textContent = formattedAddress;
        walletAddressElement.dataset.fullAddress = fullAddress; 
    }
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

});
async function lockWallet() {
    chrome.storage.sync.get(['authToken'], async function(result) {
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
function copyAddress() {
    const walletAddressElement = document.getElementById('wallet-address');
    const copyMessageElement = document.getElementById('copy-message');

    if (walletAddressElement && walletAddressElement.textContent !== 'N/A') {
        navigator.clipboard.writeText(walletAddressElement.textContent).then(() => {
            copyMessageElement.style.display = 'inline';
            setTimeout(() => (copyMessageElement.style.display = 'none'), 1000);
        }).catch(err => {
            console.error('Error copying text: ', err);
            alert('Failed to copy wallet address.');
        });
    } else {
        alert('No wallet address to copy.');
    }
}


