// Fetch and update balance
// Fetch and update balance
async function fetchAndUpdateBalance(address) {
    const loader = document.getElementById('balance-loader');
    if(loader){
    loader.style.display = 'inline-block';
    }  // Show the loader
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

        if (response.ok) {
            const responseData = await response.json();
            console.log('Balance data:', responseData);

            // Assuming the balance is in responseData.data and it's a string
            const balanceString = responseData.data;

            if (balanceString !== undefined) {
                const balance = parseFloat(balanceString);  // Convert the balance to a number
                if (!isNaN(balance)) {
                    // Assuming no need to divide by 10^18 since balance is already in human-readable form
                    document.getElementById('balance').textContent = `AED ${balance.toFixed(3)}`;  // Format balance to 3 decimal places
                        // Hide the loader after fetching the balance
                        if(loader){
                        loader.style.display = 'none';
                        }
                } else {
                    console.error('Balance is not a valid number:', balanceString);
                }
            } else {
                console.error('Balance not available in response data');
            }
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            chrome.storage.local.remove('authToken', function() {
                window.location.href = 'login.html';
            });
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
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            chrome.storage.local.remove('authToken', function() {
                window.location.href = 'login.html';
            });
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
                    usernameElement.textContent = userInfo.name || 'Guest'; // Fallback value
                }
            } else {
                usernameElement.textContent = userInfo.name || 'Guest'; // Fallback value
            }

            walletAddressElement.textContent = userInfo.address || 'N/A';

            await fetchAndUpdateBalance(userInfo.address); // Initial fetch

            // Continuous fetch every 4 seconds, with error handling
            setInterval(async () => {
                try {
                    await fetchAndUpdateBalance(userInfo.address);
                } catch (error) {
                    console.error('Error fetching balance in setInterval:', error);
                }
            }, 4000);
        } else {
            console.error('One or more profile elements are missing in the DOM');
        }
    });
};
