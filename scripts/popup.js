// Fetch user info and update UI
chrome.storage.sync.get(['authToken'], async function(result) {
    const authToken = result.authToken;

    if (!authToken) {
        window.close(); // Close if no authToken is found
    } else {
        try {
            // Fetch User Profile Information
            const userInfoResponse = await fetch('https://log-iam-temp.finloge.com/api/ext-profile', {
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
                    const balanceInfoResponse = await fetch('https://log-iam-temp.finloge.com/api/ext-balance', {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });

                    const balanceInfoData = await balanceInfoResponse.json();

                    if (balanceInfoResponse.ok) {
                        const balanceElement = document.getElementById('balance');
                        if (balanceElement) {
                            balanceElement.textContent = `AED ${balanceInfoData.balance.toFixed(3)}`;
                        }
                    } else if (balanceInfoResponse.status === 401) {
                        chrome.storage.sync.remove('authToken', () => {
                            window.location.href = 'popup-login.html';
                        });
                    }
                } else {
                    console.error('Username or address element not found');
                }
            } else if (userInfoResponse.status === 401) {
                chrome.storage.sync.remove('authToken', () => {
                    window.location.href = 'popup-login.html';
                });
            } else {
                console.error('Failed to fetch user info:', userInfoResponse.status);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            alert('An error occurred while fetching user info. Please try again.');
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
    const result = await chrome.storage.sync.get('authToken');
    const authToken = result.authToken;

    if (!authToken) {
        console.error('No authToken found. Cannot log out.');
        return;
    }

    try {
        // The logout API is a GET request
        const response = await fetch('https://log-iam-temp.finloge.com/api/ext-logout', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
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
        alert('An error occurred during logout. Please try again.');
    }
}