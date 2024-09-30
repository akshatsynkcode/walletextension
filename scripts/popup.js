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
            const response = await fetch('https://log-iam-temp.finloge.com/api/mobile-logout/', {
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
                            window.close();
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
            // prohibited to open popup without login
            window.close();
        }
        else{
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
        }

    });
};

// Function to fetch and update the wallet balance (same API as profile.js)
async function fetchAndUpdateBalance(address, authToken) {
    const loader = document.getElementById('balance-loader');
    if(loader){
    loader.style.display = 'inline-block';
    }  // Show the loader
    try {
        const response = await fetch('https://log-iam-temp.finloge.com/api/wallet-balance/', {
            method: 'GET',
            headers: {
                'Authorization': `token ${authToken}`,
                'Content-Type': 'application/json',
            }
        });


        if (response.ok) {
            const responseData = await response.json();
            console.log('Balance data:', responseData);

            // Assuming the balance is in responseData.data
            const balanceString = responseData.data;
            if (balanceString !== undefined) {
                const balance = parseFloat(balanceString);  // Convert the balance to a number
                if (!isNaN(balance)) {
                    document.getElementById('balance').textContent = `AED ${balance.toFixed(3)}`; // Format balance to 3 decimal places
                    if(loader){
                    loader.style.display = 'none';
                    }
                }
                else {
                    console.error('Balance is not a valid number:', balanceString);
                }
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

document.addEventListener('DOMContentLoaded', () => {
    const copyButton = document.getElementById('copy-button');
    console.log(copyButton, "copy button");
    copyButton.addEventListener('click', copyAddress);

    const closeButton = document.querySelector('.close-btn');
    const navbarCollapse = document.getElementById('navbarSupportedContent');

    closeButton.addEventListener('click', function() {
        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
            toggle: false
        });
        bsCollapse.hide();
    });
});

function copyAddress() {
    const walletAddressElement = document.getElementById('address');
    const copyMessageElement = document.getElementById('copy-message');

    if (walletAddressElement && walletAddressElement.textContent !== 'N/A') {
        const tempInput = document.createElement('textarea');
        tempInput.value = walletAddressElement.textContent;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);

        // Show the copied message
        copyMessageElement.style.display = 'inline'; // Show the message
        setTimeout(() => {
            copyMessageElement.style.display = 'none'; // Hide after a delay
        }, 1000); // Change the delay as needed
    } else {
        alert('No wallet address to copy.');
    }
}

