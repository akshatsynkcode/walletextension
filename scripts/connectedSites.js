function redirectToLogin() {
    chrome.storage.sync.remove(['authToken', 'connectedSites']);
    window.location.href = 'login.html';
}

function showFullScreenLoader() {
    document.getElementById('full-screen-loader').style.display = 'flex';
}

// Hide the full-screen loader
function hideFullScreenLoader() {
    document.getElementById('full-screen-loader').style.display = 'none';
}
function truncateWalletAddress(walletAddress, startChars = 6, endChars = 6, separator = '.......') {
    if (!walletAddress || walletAddress.length <= startChars + endChars) {
        return walletAddress; // Return the full address if it's too short to truncate
    }
    return `${walletAddress.substring(0, startChars)}${separator}${walletAddress.substring(walletAddress.length - endChars)}`;
}

// // Lock wallet and redirect to login
async function lockWallet() {
    const { authToken } = await chrome.storage.sync.get('authToken');
    if (!authToken) {
        console.error('No authToken found. Cannot log out.');
        return;
    }

    try {
        const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-logout', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.message === "Successfully Logged Out") {
                chrome.storage.sync.remove(['authToken', 'connectedSites'], () => {
                    chrome.runtime.sendMessage({ action: 'lock_wallet' }, (response) => {
                        if (response.success) {
                            window.location.href = 'login.html';
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
async function fetchUpdatedUserProfile() {
    showFullScreenLoader();  // Show loader before making the API call
    const { authToken } = await chrome.storage.sync.get('authToken');
    if (!authToken) {
        console.error('Authorization token is missing');
        redirectToLogin();
        hideFullScreenLoader();  // Hide loader when redirecting
        return;
    }

    try {
        const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderConnectedSites(data.connected_sites);  // Render connected sites from the response

            const updatedUserInfo = {
                fullName: data.fullName,
                walletAddress: data.walletAddress,
                email: data.email
            };

            // Render wallet ID, username, and email in the correct order
            const walletAddressElement = document.getElementById('wallet-address');
            const usernameElement = document.getElementById('username');
            const emailElement = document.getElementById('email');

            // Set the text content in the correct order
            walletAddressElement.setAttribute('data-full-address', updatedUserInfo.walletAddress);
            walletAddressElement.textContent = truncateWalletAddress(updatedUserInfo.walletAddress) || 'Guest';
            usernameElement.textContent = updatedUserInfo.fullName || 'N/A';
            emailElement.textContent = updatedUserInfo.email || 'N/A';

            hideFullScreenLoader();  // Hide loader after the data is fetched successfully
            return data;
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            redirectToLogin();
            hideFullScreenLoader();  // Hide loader if token is invalid
        } else {
            console.error('Failed to fetch user profile:', response.statusText);
            hideFullScreenLoader();
            redirectToLogin();  // Hide loader in case of error
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        hideFullScreenLoader();
        redirectToLogin(); // Hide loader on error
    }
}
function renderConnectedSites(sites) {
    if (!sites) {
        console.error('No connected sites data available');
        return;
    }

    const container = document.querySelector('.d-flex.flex-column'); // The container where connected sites should be appended
    container.innerHTML = ''; // Clear existing content

        sites.forEach(site => {
            const siteDiv = document.createElement('div');
            siteDiv.className = 'w-100 mb-4';
            siteDiv.innerHTML = `
                <ul class="w-100 list-unstyled custom-btn-dark">
                    <li class="w-100">
                        <div class="btn btn-transparent custom-btn py-3 font-14 w-100 d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <img src="${site.service_image}" alt="" class="img-fluid me-2 custom-img">
                                <span class="mx-4 text-color-ls">${site.service_name}</span>
                                <span class="text-color-cs">${site.service_url}</span>
                            </div>
                            <i class="btn fa fa-times me-3 text-danger f-16 disconnect-btn"></i>
                        </div>
                    </li>
                </ul>
            `;
            container.appendChild(siteDiv);
            siteDiv.querySelector('.disconnect-btn').addEventListener('click', function () {
                const updatedSites = sites.filter(s => s.service_name !== site.service_name);

                chrome.storage.sync.get(['authToken'], (result) => {
                    if (result.authToken) {
                        deleteSite(site.service_url, result.authToken, "remove");
                        removeSiteFromStorage(site.service_url)
                        renderConnectedSites(updatedSites);
                    } else {
                        console.error("No authToken found.");
                    }
                });
            });
        });
    }



//     sites.forEach(site => {
//         const siteDiv = document.createElement('div');
//         siteDiv.className = 'col-lg-3 col-md-4 mb-1';
//         siteDiv.innerHTML = `
//         <div class="card shadow-sm border-0" style="background-color: #181b1c;">
//             <div class="card-body p-3 d-flex flex-column">
//                 <div class="text-center mb-2">
//                     <img src="${site.service_image}" class="img-fluid rounded-circle mb-3" style="width:100px; height:100px">
//                 </div>
//                 <h5 class="card-title text-truncate text-light text-center">${site.service_name}</h5>
//                 <p class="card-text small text-truncate mb-2 text-light text-center">${site.service_url}</p>
//                 <div class="mt-auto">
//                     <button class="btn btn-outline-danger w-100 disconnect-btn">
//                         <i class="fa fa-unlink me-2"></i>Disconnect
//                     </button>
//                 </div>
//             </div>
//         </div>
// `;
//         container.appendChild(siteDiv);
//         siteDiv.querySelector('.disconnect-btn').addEventListener('click', function () {
//             const updatedSites = sites.filter(s => s.service_name !== site.service_name);

//             chrome.storage.sync.get(['authToken'], (result) => {
//                 if (result.authToken) {
//                     deleteSite(site.service_url, result.authToken, "remove");
//                     removeSiteFromStorage(site.service_url)
//                     renderConnectedSites(updatedSites);
//                 } else {
//                     console.error("No authToken found.");
//                 }
//             });
//         });
//     });
// }




function deleteSite(site, authToken, operation) {
    // Replace the URL with your API endpoint
    const apiUrl = `https://dev-wallet-api.dubaicustoms.network/api/ext-profile`;

    const requestBody = {
        domain: site,
        operation: operation, // Example of passing the second variable
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
            } else {
                console.error(`Failed to update site: ${site}`);
            }
        })
        .catch(error => {
            console.error(`Error updating site: ${site}`, error);
        });
}

function removeSiteFromStorage(site) {
    chrome.storage.sync.get(['connectedSites'], function (result) {
        const connectedSites = result.connectedSites || [];

        const index = connectedSites.indexOf(site);
        if (index !== -1) {
            connectedSites.splice(index, 1);
            console.log(`Site removed from storage: ${site}`);

            chrome.storage.sync.set({ connectedSites }, function () {
                console.log('Updated connectedSites saved to storage:', connectedSites);
            });
        } else {
            console.warn(`Site not found in connectedSites: ${site}`);
        }
    });
}



document.addEventListener('DOMContentLoaded', async () => {
    const { authToken } = await chrome.storage.sync.get(['authToken']);

    if (!authToken) {
        redirectToLogin();
        return;
    }

    const usernameElement = document.getElementById('username');
    const walletAddressElement = document.getElementById('wallet-address');
    const emailElement = document.getElementById('email');
    const copyButton = document.getElementById('copy-button');
    const copyMessage = document.getElementById('copy-message');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const fullWalletAddress = walletAddressElement.getAttribute('data-full-address'); // Get full address

            if (fullWalletAddress) {
                navigator.clipboard.writeText(fullWalletAddress)
                    .then(() => {
                        copyMessage.style.display = 'inline';
                        setTimeout(() => {
                            copyMessage.style.display = 'none';
                        }, 1000);
                    })
                    .catch(err => {
                        console.error('Could not copy text: ', err);
                    });
            }
        });
    }

    if (usernameElement && walletAddressElement) {
        // Fetch updated profile
        const updatedProfile = await fetchUpdatedUserProfile();
        if (updatedProfile) {
            const updatedUserInfo = {
                fullName: updatedProfile.fullName,
                walletAddress: updatedProfile.walletAddress,
                email: updatedProfile.email
            };
            walletAddressElement.setAttribute('data-full-address', updatedUserInfo.walletAddress);
            walletAddressElement.textContent = truncateWalletAddress(updatedUserInfo.walletAddress) || 'Guest';
            usernameElement.textContent = updatedUserInfo.fullName || 'N/A';
            emailElement.textContent = updatedProfile.email || 'N/A';

        }

        // Fetch transaction history
        // await fetchAndUpdateTransactionHistory(currentPage);

        // Periodic balance update
    }
    // Logout functionality
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

    document.querySelector('#disconnect-all-btn').addEventListener('click', function () {
        chrome.storage.sync.get(['authToken'], function (result) {

            if (!result.authToken) {
                console.error("Auth token not found.");
                return;
            }

            chrome.storage.sync.set({ 'connectedSites': [] }, function () {
                deleteSite("", result.authToken, "remove_all")
                renderConnectedSites([]);
            });

        });
    });

});