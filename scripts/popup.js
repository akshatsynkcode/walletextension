// Function to lock the wallet and log out
async function lockWallet() {
    try {
        // Retrieve the authentication token from chrome.storage
        chrome.storage.local.get(['authToken'], async function (result) {
            const authToken = result.authToken;
            
            if (!authToken) {
                console.error('No authToken found. Cannot log out.');
                return;
            }

            // Call the logout API
            const response = await fetch('https://log-iam.finloge.com/api/mobile-logout/', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${authToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                // Clear storage after successful logout
                chrome.storage.local.remove(['userInfo', 'authToken'], function () {
                    console.log('User info and token cleared');
                    
                    // Close the full-screen tab
                    chrome.runtime.sendMessage({ action: 'lock_wallet' }, function (response) {
                        if (response.success) {
                            console.log('Full-screen tab closed.');
                            // Redirect to login page
                            window.location.href = 'login.html';
                        } else {
                            console.error('Failed to close full-screen tab.');
                        }
                    });
                });
            } else {
                console.error('Failed to log out.');
                alert('Logout failed. Please try again.');
            }
        });
    } catch (error) {
        console.error('Error during logout:', error);
        alert('An error occurred during logout. Please try again.');
    }
}

// Add event listener to lock button
document.getElementById('lock-wallet-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to lock the wallet?')) {
        lockWallet();
    }
});

// Fetch user info and update the UI on load
window.onload = async function () {
    chrome.storage.local.get(['userInfo', 'authToken'], async function (result) {
        const userInfo = result.userInfo;
        const authToken = result.authToken;

        if (!userInfo) {
            document.body.innerHTML = '<p>Please log in first.</p>';
            return;
        }

        // Display user information
        document.getElementById('username').textContent = userInfo.name;
        document.getElementById('address').textContent = userInfo.address;

        // Fetch and update the balance periodically
        if (authToken) {
            await fetchAndUpdateBalance(userInfo.address, authToken);
            setInterval(() => fetchAndUpdateBalance(userInfo.address, authToken), 4000);
        } else {
            console.error('Auth token is missing.');
        }
    });
};

// Function to fetch and update the wallet balance (same API as profile.js)
async function fetchAndUpdateBalance(address, authToken) {
    try {
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
                document.getElementById('balance').textContent = `AED ${balance.toFixed(3)}`;
            } else {
                console.error('Balance not available in response data');
            }
        } else {
            console.error('Failed to fetch balance:', response.statusText);
        }
    } catch (error) {
        console.error('Failed to fetch balance:', error);
    }
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "refresh") {
        // Reload the popup content by calling the relevant function
        window.location.reload();
    }
});
