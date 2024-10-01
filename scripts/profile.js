// Fetch and update balance
async function fetchAndUpdateBalance(address) {
    const loader = document.getElementById('balance-loader');
    if (loader) {
        loader.style.display = 'inline-block'; // Show loader before fetching balance
    }

    try {
        const result = await chrome.storage.local.get('authToken');
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
            chrome.storage.local.remove('authToken', () => window.location.href = 'login.html');
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
                chrome.storage.local.set({ userInfo: updatedUserInfo });

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

    // Copy wallet address functionality
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
