// Import necessary modules from polkadot/api
import { ApiPromise, WsProvider } from '@polkadot/api';

// Fetch and update balance
// Fetch and update balance
async function fetchAndUpdateBalance(address) {
    try {
        // Retrieve token from local storage
        const { authToken } = await chrome.storage.local.get('authToken');

        if (!authToken) {
            console.error('Authorization token is missing');
            return;
        }

        const response = await fetch('https://log-iam.finloge.com/api/wallet-balance/', {
            method: 'GET',
            headers: {
                'Authorization': `token ${authToken}`,
                'Content-Type': 'application/json',
            }
        });

        console.log('Balance fetch response:', response);

        if (response.ok) {
            const responseData = await response.json();
            console.log('Balance data:', responseData);

            // Assuming the balance is in responseData.data
            const balance = responseData.data; 
            if (balance !== undefined) {
                const decimals = 18; // Assuming 18 decimals for demonstration
                const humanBalance = balance / Math.pow(10, decimals);
                document.getElementById('balance').textContent = `AED ${balance.toFixed(3)}`; // Displaying the raw balance from the API
            } else {
                console.error('Balance not available in response data');
            }
        } else {
            console.error('Failed to fetch balance:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

// Fetch updated username from the API
async function fetchUpdatedUserProfile(token) {
    try {
        const response = await fetch('https://log-iam.finloge.com/api/user-profile/', {
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
            }
        });

        console.log('Profile fetch response:', response);

        if (response.ok) {
            const data = await response.json();
            console.log('Profile data:', data);
            return data; // Assuming the response contains updated user data
        } else {
            console.error('Failed to fetch user profile:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

window.onload = async function () {
    chrome.storage.local.get(['userInfo', 'authToken'], async function (result) {
        const userInfo = result.userInfo;
        const authToken = result.authToken;

        console.log('UserInfo from storage:', userInfo);
        console.log('AuthToken:', authToken);

        if (!userInfo) {
            document.body.textContent = 'Please log in first.';
            return;
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
                    usernameElement.textContent = userInfo.name || 'N/A';
                }
            } else {
                usernameElement.textContent = userInfo.name || 'N/A';
            }

            walletAddressElement.textContent = userInfo.address || 'N/A';

            await fetchAndUpdateBalance(userInfo.address); // Initial fetch
            setInterval(() => fetchAndUpdateBalance(userInfo.address), 4000); // Continuous fetch
        } else {
            console.error('One or more profile elements are missing in the DOM');
        }
    });
};
