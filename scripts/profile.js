// Fetch and update balance
async function fetchAndUpdateBalance(address) {
    const loader = document.getElementById('balance-loader');
    if (loader) {
        loader.style.display = 'inline-block';
    }
    try {
        const { authToken } = await chrome.storage.local.get('authToken');
        if (!authToken) {
            console.error('Authorization token is missing');
            loader && (loader.style.display = 'none');
            return;
        }

        const response = await fetch('https://log-iam-temp.finloge.com/api/wallet-balance/', {
            method: 'GET',
            headers: {
                'Authorization': `token ${authToken}`,
                'Content-Type': 'application/json',
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
            chrome.storage.local.remove('authToken', () => window.location.href = 'login.html');
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

// Fetch updated username from the API
async function fetchUpdatedUserProfile(token) {
    try {
        const response = await fetch('https://log-iam-temp.finloge.com/api/user-profile/', {
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            chrome.storage.local.remove('authToken', () => window.location.href = 'login.html');
        } else {
            console.error('Failed to fetch user profile:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['userInfo', 'authToken'], async (result) => {
        const { userInfo, authToken } = result;
        if (!userInfo) {
            window.location.href = 'login.html';
        }

        const usernameElement = document.getElementById('username');
        const walletAddressElement = document.getElementById('wallet-address');
        const balanceElement = document.getElementById('balance');

        if (usernameElement && walletAddressElement && balanceElement) {
            if (authToken) {
                const updatedProfile = await fetchUpdatedUserProfile(authToken);
                if (updatedProfile && updatedProfile.username) {
                    const updatedUserInfo = { ...userInfo, name: updatedProfile.username };
                    chrome.storage.local.set({ userInfo: updatedUserInfo });
                    usernameElement.textContent = updatedUserInfo.name;
                } else {
                    usernameElement.textContent = userInfo.name || 'Guest';
                }
                await fetchAndUpdateBalance(userInfo.address);
                setInterval(async () => {
                    try {
                        await fetchAndUpdateBalance(userInfo.address);
                    } catch (error) {
                        console.error('Error fetching balance in setInterval:', error);
                    }
                }, 4000);
            } else {
                usernameElement.textContent = userInfo.name || 'Guest';
                walletAddressElement.textContent = userInfo.address || 'N/A';
            }
        } else {
            console.error('One or more profile elements are missing in the DOM');
        }
    });

    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const walletAddressElement = document.getElementById('wallet-address');
            const copyMessageElement = document.getElementById('copy-message');
            if (walletAddressElement && walletAddressElement.textContent !== 'N/A') {
                navigator.clipboard.writeText(walletAddressElement.textContent).then(() => {
                    copyMessageElement.style.display = 'inline';
                    setTimeout(() => (copyMessageElement.style.display = 'none'), 2000);
                });
            }
        });
    }
});

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
