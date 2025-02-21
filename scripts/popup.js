// Fetch user info and update UI

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
    const lockButton = document.getElementById('lock-wallet-btn');
    if (lockButton) {
        lockButton.addEventListener('click', () => {
            const lockModal = new bootstrap.Modal(document.getElementById('exampleModal'));
            lockModal.show();
            const confirmButton = document.querySelector('.yes-btn');
            const cancelButton = document.querySelector('.no-btn');
            cancelButton.addEventListener('click', () => {
                const modalElement = document.getElementById("exampleModal"); // Replace with your modal ID
                modalElement.addEventListener("hidden.bs.modal", function () {
                    document.querySelectorAll(".modal-backdrop").forEach(backdrop => backdrop.remove());
                    document.body.classList.remove("modal-open"); // Ensure scrolling is re-enabled
                });
            })
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

    const currentUrlElement = document.getElementById("current-url");
    const faviconImage = document.getElementById("active-tab-favicon");
    const defaultWebIcon = "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f310.svg"; // Web icon
    const logoutContainer = document.querySelector(".logout-container");
    const walletInfoText = document.querySelector(".wallet-info p");

    // Fetch active tab info
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
            let tabFavicon = tabs[0].favIconUrl || `https://www.google.com/s2/favicons?sz=64&domain=${tabs[0].url}`;

            // Preload favicon to check if it's accessible
            let img = new Image();
            img.src = tabFavicon;
            img.onload = function () {
                faviconImage.src = tabFavicon; // Use tab's favicon if accessible
            };
            img.onerror = function () {
                faviconImage.src = defaultWebIcon; // Use fallback web icon if favicon fails
            };
            // Show the current site URL in wallet info page
            let url = new URL(tabs[0].url);
            currentUrlElement.textContent = url.hostname;
        }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) {
            return;
        }
    
        let activeTab = tabs[0];
    
        try {
            let domain = new URL(activeTab.url).origin;
            console.log("Checking session for domain:", domain);
    
            chrome.runtime.sendMessage({ action: "checkSession", domain: domain }, function (response) {
                updateWalletStatus(response.authenticated, domain);
            });
    
        } catch (error) {
            console.error("Error processing tab URL:", error);
        }
    });
    
    // sourcery skip: avoid-function-declarations-in-blocks
    function updateWalletStatus(isConnected,domain) {
        const statusContainer = document.getElementById("active-tab-favicon");
        const statusDot = document.getElementById("wallet-status");
    
        const tooltipText = isConnected ? `Connected to: ${domain}` : "Wallet is not connected";
        console.log("tooltipText",tooltipText)
        if (isConnected) {
            statusDot.classList.add("active-status"); // Green for active
        } else {
            statusDot.classList.remove("active-status"); // Grey for inactive
        }

        // statusContainer.setAttribute("title", tooltipText);
        // statusContainer.setAttribute("data-bs-toggle", "tooltip");
        
    
        // let existingTooltip = bootstrap.Tooltip.getInstance(statusContainer);
        // if (existingTooltip) {
        //     existingTooltip.dispose();
        // }

        // // Reinitialize Bootstrap Tooltip after a small delay to avoid flickering
        // setTimeout(() => {
        //     new bootstrap.Tooltip(statusContainer);
        // }, 100);
        // Set tooltip content dynamically
        // Update tooltip text dynamically
        // Update tooltip text dynamically
        statusContainer.setAttribute("title", tooltipText);
        statusContainer.setAttribute("data-bs-toggle", "tooltip");
        statusContainer.setAttribute("data-bs-placement", "bottom");
        statusContainer.setAttribute("data-bs-custom-class", "custom-tooltip");

        console.log("Tooltip updated:", tooltipText); // Debugging check

        // Dispose of existing tooltip to avoid conflicts
        let existingTooltip = bootstrap.Tooltip.getInstance(statusContainer);
        if (existingTooltip) {
            existingTooltip.dispose();
        }

        // Initialize Bootstrap Tooltip
        setTimeout(() => {
            new bootstrap.Tooltip(statusContainer, {
                placement: "bottom",
                customClass: "custom-tooltip",
                container: "body",
                trigger: "hover",
            });
            console.log("Tooltip initialized successfully!"); // Debugging check
        }, 200);
    }
    document.getElementById('open-wallet-info').onclick = function() {
        // Redirect to the desired page (replace 'wallet_page_url.html' with the actual URL)
        window.location.href = 'walletpageurl.html';
    };
});

async function lockWallet() {
    const { authToken } = await chrome.storage.sync.get('authToken');
    const { email } = await chrome.storage.sync.get('email');
    if (!authToken) {
        console.error('No authToken found. Cannot log out.');
        return;
    }

    try {
        const response = await fetch(`https://dev-wallet-api.dubaicustoms.network/api/ext-logout?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.message === "Successfully Logged Out") {
                chrome.storage.sync.remove(['authToken', 'connectedSites', 'email'], () => {
                    chrome.runtime.sendMessage({ action: 'lock_wallet' }, (response) => {
                        if (response.success) {
                            window.location.href = 'popup-login.html';
                        } else {
                            console.error('Failed to close full-screen tab.');
                        }
                    });
                });
                chrome.runtime.sendMessage({ action: 'logout' });
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
