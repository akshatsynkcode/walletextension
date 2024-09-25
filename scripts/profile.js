// Import necessary modules from polkadot/api
import { ApiPromise, WsProvider } from '@polkadot/api';

// Initialize Polkadot API connection
async function getPolkadotApi() {
    const provider = new WsProvider('wss://contract-node.finloge.com');
    const api = await ApiPromise.create({ provider });
    return api;
}

// Fetch and update balance
async function fetchAndUpdateBalance(address) {
    try {
        const api = await getPolkadotApi();
        const { data: { free: balance } } = await api.query.system.account(address);
        const decimals = api.registry.chainDecimals[0]; // Fetch decimals
        const humanBalance = balance / Math.pow(10, decimals);
        document.getElementById('balance').textContent = `AED ${humanBalance.toFixed(3)}`;
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
