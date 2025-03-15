import {
    updateUserIcon,
} from './generic.js';

// Fetch user info and update UI

import { handleLogout } from "./generic";

const baseApiUrl = 'https://dev-wallet-api.dubaicustoms.network';

chrome.storage.sync.get(['authToken'], async function(result) {
    const authToken = result.authToken;

    if (!authToken) {
        window.location.href = 'popup-login.html';
    } else {
        try {
            // Fetch User Profile Information
            const userInfoResponse = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-profile', {
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
                    const balanceInfoResponse = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-balance', {
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
                        chrome.storage.sync.remove(['authToken', 'connectedSites', 'email'], () => {
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
                chrome.storage.sync.remove(['authToken', 'connectedSites', 'email'], () => {
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
    handleLogout('popup-login.html');
    await updateUserIcon();
    const expandButton = document.getElementById('expand-btn');
    if (expandButton) {
        expandButton.addEventListener('click', function(event) {
            event.preventDefault();
            chrome.runtime.sendMessage({ action: "unlock_wallet" }, (response) => {
                if (response && response.success) {
                    console.log("Expanded to fullscreen successfully!");
                } else {
                    console.error("Failed to expand fullscreen.");
                }
            });
        });
    }
});

document.getElementById('buy-aed-btn').addEventListener('click', async function(event) {
    event.preventDefault();

    // Define the API URL based on the environment
    const apiUrl = baseApiUrl.includes('dev')
        ? 'https://dev-wallet-api.dubaicustoms.network/api/buy-aed'
        : 'https://wallet-api.dubaicustoms.network/api/buy-aed'; // Assuming a production URL

    try {
        // Fetch the payment URL from the API
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network response was not ok.');

        const data = await response.json();
        const IAM_URL = data.buyAED;

        // Open the URL in a new window
        window.open(IAM_URL);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
});


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
        // Convert the amount to a number
        amount = parseFloat(amount);
    
        // Check if the amount is a number after conversion
        if (isNaN(amount)) return '0'; // Return default if it's not a valid number
    
        // Handle numbers greater than 1,000 and format them accordingly
        if (amount >= 1e9) {
            return (amount / 1e9).toFixed(1) + 'B'; // Billion
        } else if (amount >= 1e6) {
            return (amount / 1e6).toFixed(1) + 'M'; // Million
        } else if (amount >= 1e3) {
            return (amount / 1e3).toFixed(1) + 'K'; // Thousand
        } else {
            return amount.toFixed(2); // If it's less than 1,000, show the number with two decimals
        }
    }

    // document.addEventListener('DOMContentLoaded', async () => { displayConnectedSites();

    //     // Other existing event listeners
    //     // ...
    // });

    // document.addEventListener('DOMContentLoaded', function() {
    //     displayConnectedSites();
    // });
    
    // function displayConnectedSites() {
    //     chrome.storage.sync.get(['authToken', 'connectedSites'], function(result) {
    //         const sitesContainer = document.getElementById('connected-sites-list');
    //         if (sitesContainer) {
    //             sitesContainer.innerHTML = ''; // Clear existing content
                
    //             const authToken = result.authToken;
    //             const connectedSites = result.connectedSites || {};
    //             if (Object.keys(connectedSites).length) {
    //                 Object.keys(connectedSites).forEach(site => {
    //                     const listItem = document.createElement('li');
    //                     listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

    //                     // Text for the site
    //                     const siteText = document.createElement('span');
    //                     siteText.textContent = `${connectedSites[site]}`;
    //                     listItem.appendChild(siteText);

    //                     // Cross button
    //                     const deleteButton = document.createElement('button');
    //                     deleteButton.textContent = 'x';
    //                     deleteButton.className = 'btn btn-danger btn-sm';
    //                     deleteButton.style.marginLeft = '10px';

    //                     deleteButton.addEventListener('click', function() {
    //                         deleteSite(connectedSites[site], authToken,  () => {
    //                             removeSiteFromStorage(connectedSites[site]);
    //                             sitesContainer.removeChild(listItem);
    //                         });
    //                     });
    //                     listItem.appendChild(deleteButton);
    //                     sitesContainer.appendChild(listItem);
    //                 });
    //             } else {
    //                 sitesContainer.innerHTML = '<li class="list-group-item">No connected sites</li>';
    //             }
    //         } else {
    //             console.error("Connected sites list container not found.");
    //         }
    //     });
    // }
    
    
    
    function deleteSite(site, authToken, callback) {
        // Replace the URL with your API endpoint
        const apiUrl = `https://dev-wallet-api.dubaicustoms.network/api/ext-profile`;
    
        const requestBody = {
            domain: site,
            operation: "remove", // Example of passing the second variable
        };
    
        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${authToken}`,
            },
            body: JSON.stringify(requestBody),
        })
            .then(response => {
                if (response.ok) {
                    console.log(`Successfully updated site: ${site}`);
                    callback(); // Call the callback function
                } else {
                    console.error(`Failed to update site: ${site}`);
                }
            })
            .catch(error => {
                console.error(`Error updating site: ${site}`, error);
            });
    }

    function removeSiteFromStorage(site) {
        chrome.storage.sync.get(['connectedSites'], function(result) {
            const connectedSites = result.connectedSites || [];
            
            const index = connectedSites.indexOf(site);
            if (index !== -1) {
                connectedSites.splice(index, 1);
                console.log(`Site removed from storage: ${site}`);
                
                chrome.storage.sync.set({ connectedSites }, function() {
                    console.log('Updated connectedSites saved to storage:', connectedSites);
                });
            } else {
                console.warn(`Site not found in connectedSites: ${site}`);
            }
        });
    }
