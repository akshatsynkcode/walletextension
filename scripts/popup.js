// Fetch user info and update UI
chrome.storage.sync.get(['authToken'], async function(result) {
    const authToken = result.authToken;

    if (!authToken) {
        window.location.href = 'popup-login.html';
    } else {
        try {
            // Fetch User Profile Information
            const userInfoResponse = await fetch('https://wallet-api.dubaicustoms.network/api/ext-profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            const userInfoData = await userInfoResponse.json();

            if (userInfoResponse.ok) {
                const usernameElement = document.getElementById('username');
                const addressElement = document.getElementById('address');

                if (usernameElement && addressElement) {
                    usernameElement.textContent = userInfoData.fullName || 'N/A';
                    addressElement.textContent = userInfoData.walletAddress || 'N/A';

                    // Fetch Balance Information
                    const balanceInfoResponse = await fetch('https://wallet-api.dubaicustoms.network/api/ext-balance', {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });

                    const balanceInfoData = await balanceInfoResponse.json();

                    if (balanceInfoResponse.ok) {
                        const balanceElement = document.getElementById('balance');
                        if (balanceElement) {
                            balanceElement.textContent = `AED ${formatAmount(balanceInfoData.balance.toFixed(3))}`;
                        }
                    } else if (balanceInfoResponse.status === 401) {
                        chrome.storage.sync.remove('authToken', () => {
                            chrome.runtime.sendMessage({ action: 'lock_wallet' }, (response) => {
                                if (response.success) {
                                    window.location.href = 'popup-login.html';
                                } else {
                                    chrome.tabs.create({
                                        url: chrome.runtime.getURL('login.html'),
                                        active: true
                                    }, (tab) => {
                                        fullscreenTabId = tab.id;
                                    });
                                }
                            })
                        });
                    }
                } else {
                    console.error('Username or address element not found');
                }
            } else if (userInfoResponse.status === 401) {
                chrome.storage.sync.remove('authToken', () => {
                    chrome.runtime.sendMessage({ action: 'lock_wallet' }, (response) => {
                        if (response.success) {
                            window.location.href = 'popup-login.html';
                        } else {
                            chrome.tabs.create({
                                url: chrome.runtime.getURL('login.html'),
                                active: true
                            }, (tab) => {
                                fullscreenTabId = tab.id;
                            });
                        }
                    })
                });
            } else {
                console.error('Failed to fetch user info:', userInfoResponse.status);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            alert('An error occurred while fetching user info. Please try again.' + userInfoResponse.status);
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
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

    const expandButton = document.getElementById('expand-btn');
    if (expandButton) {
        expandButton.addEventListener('click', function(event) {
            event.preventDefault();
            window.open('profile.html', '_blank');
        });
    }
});

async function lockWallet() {
    const { authToken } = await chrome.storage.sync.get('authToken');
    if (!authToken) {
        console.error('No authToken found. Cannot log out.');
        return;
    }

    try {
        const response = await fetch('https://wallet-api.dubaicustoms.network/api/ext-logout', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.message === "Successfully Logged Out") {
                chrome.storage.sync.remove(['authToken'], () => {
                    chrome.runtime.sendMessage({ action: 'lock_wallet' }, (response) => {
                        if (response.success) {
                            window.location.href = 'popup-login.html';
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


const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const walletAddressElement = document.getElementById('address');
            const copyMessageElement = document.getElementById('copy-message');
  
            if (walletAddressElement && walletAddressElement.textContent !== 'N/A') {
                navigator.clipboard.writeText(walletAddressElement.textContent).then(() => {
                    copyMessageElement.style.display = 'inline';
                    setTimeout(() => (copyMessageElement.style.display = 'none'), 1000);
                });
            }
        });
    }

    function formatAmount(amount) {
        // Check if the amount is a number
        if (isNaN(amount)) return amount;
    
        // Handle numbers greater than 1,000 and format them accordingly
        if (amount >= 1e9) {
            return (amount / 1e9).toFixed(1) + 'B'; // Billion
        } else if (amount >= 1e6) {
            return (amount / 1e6).toFixed(1) + 'M'; // Million
        } else if (amount >= 1e3) {
            return (amount / 1e3).toFixed(1) + 'K'; // Thousand
        } else {
            return amount.toFixed(2); // If it's less than 1,000, just show the number with two decimals
        }
    }