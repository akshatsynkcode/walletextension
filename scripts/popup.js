// Fetch user info and update UI

const baseApiUrl = 'https://dev-wallet-api.dubaicustoms.network';

chrome.storage.sync.get(['authToken', 'authIV'], async function(result) {
    const authToken = result.authToken;

    if (!authToken) {
        window.location.href = 'popup-login.html';
    } else {
        try {
            const authIV = result.authIV;
            const decryptedAuthToken = await decryptText(authToken, authIV);
            // Fetch User Profile Information
            const userInfoResponse = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${decryptedAuthToken}` }
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
                        headers: { 'Authorization': `Bearer ${decryptedAuthToken}` }
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
});

async function lockWallet() {
    alert("Rajithaaaaaaaaaaaaaaaaa 11111111111111 ");
    const { authToken } = await chrome.storage.sync.get('authToken');
    const { email } = await chrome.storage.sync.get('email');
    if (!authToken) {
        console.error('No authToken found. Cannot log out.');
        return;
    }
    const { authIV } = await chrome.storage.sync.get('authIV');
    const decryptedAuthToken = await decryptText(authToken, authIV);

    try {
        const response = await fetch(`https://dev-wallet-api.dubaicustoms.network/api/ext-logout?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${decryptedAuthToken}` }
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

document.getElementById('buy-aed-btn').addEventListener('click', function(event)  {
    event.preventDefault();
        let IAM_URL = "";
        if (baseApiUrl.includes('dev')){
            IAM_URL = "https://ime.finloge.com/payment/";
        }
        else{
            IAM_URL = "https://ime.dubaicustoms.network/payment/";
        }
        window.open(IAM_URL);
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
    
    
    
    function deleteSite(site, authToken, authIV, callback) {
        // Replace the URL with your API endpoint
        const apiUrl = `https://dev-wallet-api.dubaicustoms.network/api/ext-profile`;
    
        const requestBody = {
            domain: site,
            operation: "remove", // Example of passing the second variable
        };
        const decryptedAuthToken = decryptText(authToken, authIV);
        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${decryptedAuthToken}`,
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

    function getKey() {
        return crypto.subtle.digest("SHA-256", new TextEncoder().encode("your-strong-secret-key"))
            .then(keyMaterial => {
                return crypto.subtle.importKey(
                    "raw",
                    keyMaterial,
                    { name: "AES-GCM" },
                    false,
                    ["encrypt", "decrypt"]
                );
            });
    }
    
    function decryptText(encryptedData, iv) {
        return getKey()  // Get the AES key asynchronously
            .then(key => {
                const decoder = new TextDecoder();
        
                // Convert Base64 IV and Encrypted Password back to Uint8Array
                const ivBytes = new Uint8Array(atob(iv).split("").map(char => char.charCodeAt(0)));
                const encryptedBytes = new Uint8Array(atob(encryptedData).split("").map(char => char.charCodeAt(0)));
        
                // Decrypt the data
                return crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: ivBytes },
                    key,
                    encryptedBytes
                ).then(decrypted => {
                    return decoder.decode(decrypted);  // Convert back to string
                });
            });
    }

    document.addEventListener("DOMContentLoaded", function () {
        const userConsent = localStorage.getItem("userConsent");
        const consentModalElement = document.getElementById("userConsentModal");
        const consentModal = new bootstrap.Modal(consentModalElement, {
            backdrop: 'static', // Prevent closing when clicking outside
            keyboard: false     // Prevent closing with Escape key
        });
    
        // Show the modal if consent is not given
        if (!userConsent) {
            consentModal.show();
        }
    
        // Accept Consent
        document.getElementById("acceptConsent").addEventListener("click", function () {
            if (document.getElementById("consentCheckbox").checked) {
                localStorage.setItem("userConsent", "accepted");
                alert("Thank you for providing consent!");
                consentModal.hide(); // Hide modal after acceptance
            } else {
                alert("Please check the box to give consent.");
            }
        });
    
        // Decline Consent (Keep the modal open)
        document.getElementById("declineConsent").addEventListener("click", function (event) {
            alert("Consent is mandatory to use the extension.");
            
            // Prevent modal from hiding
            event.preventDefault();
            event.stopImmediatePropagation();
    
            // Keep the modal open
            consentModal.show();
        });
    
        // Prevent modal from hiding on its own
        consentModalElement.addEventListener("hidden.bs.modal", function (event) {
            if (!localStorage.getItem("userConsent")) {
                consentModal.show();
            }
        });
    });
    