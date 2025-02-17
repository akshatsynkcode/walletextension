function redirectToLogin() {
  chrome.storage.sync.remove(['authToken', 'connectedSites', 'authIV']);
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
      const { authIV } = await chrome.storage.sync.get('authIV');
      const decryptedAuthToken = await decryptText(authToken, authIV);
      const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-logout', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${decryptedAuthToken}` }
      });

      if (response.ok) {
          const data = await response.json();
          if (data.message === "Successfully Logged Out") {
              chrome.storage.sync.remove(['authToken', 'connectedSites', 'authIV'], () => {
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
      const { authIV } = await chrome.storage.sync.get('authIV');
      const decryptedAuthToken = await decryptText(authToken, authIV);
      const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-profile', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${decryptedAuthToken}` }
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
        console.error('Failed to fetch user profile: ddddddddd ', response.statusText);
        hideFullScreenLoader();
        redirectToLogin();  // Hide loader in case of error
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      hideFullScreenLoader(); 
      redirectToLogin(); // Hide loader on error
    }
}

// function renderConnectedSites(sites) {
//     if (!sites) {
//         console.error('No connected sites data available');
//         return;
//     }

//     const container = document.querySelector('.d-flex.flex-column'); // The container where connected sites should be appended
//     container.innerHTML = ''; // Clear existing content

//     sites.forEach(site => {
//         const siteDiv = document.createElement('div');
//         siteDiv.className = 'w-100 mb-4';
//         siteDiv.innerHTML = `
//             <div class="dropdown dropdown-menu-end w-100" style="background-color: #181b1c;">
//                 <a class="btn btn-transparent custom-btn dropdown-toggle py-3 font-14 w-100 d-flex justify-content-between align-items-center"
//                     type="button" data-bs-toggle="dropdown" aria-expanded="false">
//                     <div class="d-flex align-items-center">
//                         <img src="${site.service_image}" alt="" class="img-fluid me-2" style="width: 10vh;">
//                         <span class="mx-4">${site.service_name}</span>
//                         <span class="text-color-cs">${site.service_url}</span>
//                     </div>
//                     <i class="fas fa-chevron-down me-3 text-color-cs-drop f-16"></i>
//                 </a>
//                 <ul class="dropdown-menu ms-4">
//                     <li><button class="dropdown-item btn btn-transparent text-color-cs disconnect-btn">Disconnect</button></li>
//                 </ul>
//             </div>
//         `;
//         container.appendChild(siteDiv);
//         siteDiv.querySelector('.disconnect-btn').addEventListener('click', function () {
//             const updatedSites = sites.filter(s => s.service_name !== site.service_name);
            
//             chrome.storage.sync.get(['authToken', 'authIV'], (result) => {
//                 if (result.authToken) {
//                     deleteSite(site.service_url, result.authToken, result.authIV, "remove");
//                     removeSiteFromStorage(site.service_url)
//                     renderConnectedSites(updatedSites);
//                 } else {
//                     console.error("No authToken found.");
//                 }
//             });
//         });
//     });
// }

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

        // Create the dropdown structure manually without using innerHTML
        const dropdownDiv = document.createElement('div');
        dropdownDiv.className = 'dropdown dropdown-menu-end w-100';
        dropdownDiv.style.backgroundColor = '#181b1c';

        const dropdownLink = document.createElement('a');
        dropdownLink.className = 'btn btn-transparent custom-btn dropdown-toggle py-3 font-14 w-100 d-flex justify-content-between align-items-center';
        dropdownLink.setAttribute('type', 'button');
        dropdownLink.setAttribute('data-bs-toggle', 'dropdown');
        dropdownLink.setAttribute('aria-expanded', 'false');

        const dFlexDiv = document.createElement('div');
        dFlexDiv.className = 'd-flex align-items-center';

        const serviceImage = document.createElement('img');
        serviceImage.src = site.service_image;
        serviceImage.alt = '';
        serviceImage.className = 'img-fluid me-2';
        serviceImage.style.width = '10vh';

        const serviceNameSpan = document.createElement('span');
        serviceNameSpan.className = 'mx-4';
        serviceNameSpan.textContent = site.service_name;

        const serviceUrlSpan = document.createElement('span');
        serviceUrlSpan.className = 'text-color-cs';
        serviceUrlSpan.textContent = site.service_url;

        const chevronIcon = document.createElement('i');
        chevronIcon.className = 'fas fa-chevron-down me-3 text-color-cs-drop f-16';

        dFlexDiv.appendChild(serviceImage);
        dFlexDiv.appendChild(serviceNameSpan);
        dFlexDiv.appendChild(serviceUrlSpan);

        dropdownLink.appendChild(dFlexDiv);
        dropdownLink.appendChild(chevronIcon);

        const dropdownMenu = document.createElement('ul');
        dropdownMenu.className = 'dropdown-menu ms-4';

        const dropdownItem = document.createElement('li');
        const disconnectButton = document.createElement('button');
        disconnectButton.className = 'dropdown-item btn btn-transparent text-color-cs disconnect-btn';
        disconnectButton.textContent = 'Disconnect';

        dropdownItem.appendChild(disconnectButton);
        dropdownMenu.appendChild(dropdownItem);

        dropdownDiv.appendChild(dropdownLink);
        dropdownDiv.appendChild(dropdownMenu);

        siteDiv.appendChild(dropdownDiv);
        container.appendChild(siteDiv);

        disconnectButton.addEventListener('click', function () {
            const updatedSites = sites.filter(s => s.service_name !== site.service_name);
            
            chrome.storage.sync.get(['authToken', 'authIV'], (result) => {
                if (result.authToken) {
                    deleteSite(site.service_url, result.authToken, result.authIV, "remove");
                    removeSiteFromStorage(site.service_url)
                    renderConnectedSites(updatedSites);
                } else {
                    console.error("No authToken found.");
                }
            });
        });
    });
}

function deleteSite(site, authToken, authIV, operation) {
    // Replace the URL with your API endpoint
    const apiUrl = `https://dev-wallet-api.dubaicustoms.network/api/ext-profile`;

    const requestBody = {
        domain: site,
        operation: operation, // Example of passing the second variable
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
    if(copyButton){
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
        chrome.storage.sync.get(['authToken', 'authIV'], function(result) {

            if (!result.authToken) {
                console.error("Auth token not found.");
                return;
            }

            chrome.storage.sync.set({ 'connectedSites': [] }, function () {
                deleteSite("",result.authToken, result.authIV, "remove_all")
                renderConnectedSites([]);
            });

        });
    });
    
  });

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
    
            // Convert Base64 IV and Encrypted Data back to Uint8Array
            const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
            const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
            // Decrypt the data
            return crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivBytes },
                key,
                encryptedBytes
            ).then(decrypted => decoder.decode(decrypted));  // Convert back to string
        });
  }
  