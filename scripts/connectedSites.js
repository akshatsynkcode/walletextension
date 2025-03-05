import {
    redirectToLogin,
    hideFullScreenLoader,
    showFullScreenLoader,
    loadLayoutComponents,
    truncateWalletAddress,
    handleLogout,
    handleCopyWalletAddress,
    updateUserIcon,
    attachSidebarClickPrevention,
} from './generic.js';

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
        console.error('Error fetching user profile :', error);
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
    await loadLayoutComponents();
    attachSidebarClickPrevention();
    const { authToken } = await chrome.storage.sync.get(['authToken']);

    if (!authToken) {
        redirectToLogin();
        return;
    }

    const usernameElement = document.getElementById('username');
    const walletAddressElement = document.getElementById('wallet-address');
    const emailElement = document.getElementById('email');

    handleCopyWalletAddress()
  
    if (usernameElement && walletAddressElement) {
        // Fetch updated profile
        const updatedProfile = await fetchUpdatedUserProfile();
        if (updatedProfile) {
            const updatedUserInfo = {
                fullName: updatedProfile.fullName,
                walletAddress: updatedProfile.walletAddress,
                email: updatedProfile.email
            };
            if (walletAddressElement) {
                walletAddressElement.setAttribute('data-full-address', updatedUserInfo.walletAddress);
                walletAddressElement.textContent = truncateWalletAddress(updatedUserInfo.walletAddress) || 'Guest';
            }
            if (usernameElement) {
                usernameElement.textContent = updatedUserInfo.fullName || 'N/A';
            }
            if (emailElement) {
                emailElement.textContent = updatedProfile.email || 'N/A';
            }
            await updateUserIcon();
        }
        pageLoaded = true;

        // Fetch transaction history
        // await fetchAndUpdateTransactionHistory(currentPage);

        // Periodic balance update
    }
    handleLogout();

    const disconnectAllBtn = document.querySelector('#disconnect-all-btn');
    if(disconnectAllBtn) {
        disconnectAllBtn.addEventListener('click', function () {
            chrome.storage.sync.get(['authToken'], function(result) {

                if (!result.authToken) {
                    console.error("Auth token not found.");
                    return;
                }

                chrome.storage.sync.set({ 'connectedSites': [] }, function () {
                    deleteSite("",result.authToken, "remove_all")
                    renderConnectedSites([]);
                });

            });
        });
    }
    
});
