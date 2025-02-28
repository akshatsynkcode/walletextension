import {
    redirectToLogin,
    hideFullScreenLoader,
    showFullScreenLoader,
    loadLayoutComponents,
    truncateWalletAddress,
    handleLogout,
    handleCopyWalletAddress,
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
            <div class="dropdown dropdown-menu-end w-100" style="background-color: #181b1c;">
                <a class="btn btn-transparent custom-btn dropdown-toggle py-3 font-14 w-100 d-flex justify-content-between align-items-center"
                    type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <div class="d-flex align-items-center">
                        <img src="${site.service_image}" alt="" class="img-fluid me-2" style="width: 10vh;">
                        <span class="mx-4">${site.service_name}</span>
                        <span class="text-color-cs">${site.service_url}</span>
                    </div>
                    <i class="fas fa-chevron-down me-3 text-color-cs-drop f-16"></i>
                </a>
                <ul class="dropdown-menu ms-4">
                    <li><button class="dropdown-item btn btn-transparent text-color-cs disconnect-btn">Disconnect</button></li>
                </ul>
            </div>
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



  document.addEventListener('DOMContentLoaded', async () => {
    await loadLayoutComponents();
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

        }
        
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
