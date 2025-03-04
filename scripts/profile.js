
// let currentPage = 1;
// let totalPages = 1;
// let query = '';
// let filter = '';
// const prevButton = document.getElementById("prev-button");
// const nextButton = document.getElementById("next-button");

// // Redirect to login if no token or token is invalid
function redirectToLogin() {
    chrome.storage.sync.remove(['authToken', 'connectedSites', 'email']);
    window.location.href = 'login.html';
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
// Function to show the full screen loader
function showFullScreenLoader() {
    document.getElementById('full-screen-loader').style.display = 'flex';
}

// Function to hide the full screen loader
function hideFullScreenLoader() {
    document.getElementById('full-screen-loader').style.display = 'none';
}
// // Fetch updated user profile from the API
async function fetchUpdatedUserProfile() {
    showFullScreenLoader();
    try {
        const { authToken } = await chrome.storage.sync.get('authToken');
        if (!authToken) {
            console.error('Authorization token is missing');
            redirectToLogin();
            hideFullScreenLoader();
            return;
        }

        const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            hideFullScreenLoader();
            console.log(data);
            return data;
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            redirectToLogin();
            hideFullScreenLoader();
        } else {
            console.error('Failed to fetch user profile:', response.statusText);
            hideFullScreenLoader();
            redirectToLogin();
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        hideFullScreenLoader();
        redirectToLogin();
    }
}

function truncateWalletAddress(walletAddress, startChars = 6, endChars = 6, separator = '.......') {
    if (!walletAddress || walletAddress.length <= startChars + endChars) {
        return walletAddress; // Return the full address if it's too short to truncate
    }
    return `${walletAddress.substring(0, startChars)}${separator}${walletAddress.substring(walletAddress.length - endChars)}`;
}

// // Lock wallet and redirect to login
async function lockWallet() {
    showFullScreenLoader();
    const { authToken } = await chrome.storage.sync.get('authToken');
    const { email } = await chrome.storage.sync.get('email');
    if (!authToken) {
        console.error('No authToken found. Cannot log out.');
        hideFullScreenLoader();
        return;
    }

    try {
        const response = await fetch(`https://dev-wallet-api.dubaicustoms.network/api/ext-logout?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            hideFullScreenLoader();
            if (data.message === "Successfully Logged Out") {
                chrome.storage.sync.remove(['authToken', 'connectedSites', 'email'], () => {
                    chrome.runtime.sendMessage({ action: 'lock_wallet' }, (response) => {
                        if (response.success) {
                            window.location.href = 'login.html';
                            hideFullScreenLoader();
                        } else {
                            console.error('Failed to close full-screen tab.');
                            hideFullScreenLoader();
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
        hideFullScreenLoader();
        console.error('Error during logout:', error);
        alert('An error occurred during logout. Please try again.' + response.status);
    }
}
//   // Event listener for DOM content loading
  document.addEventListener('DOMContentLoaded', async () => {
    showFullScreenLoader();
    const { authToken } = await chrome.storage.sync.get(['authToken']);
    console.log(authToken, "authToken");
    if (!authToken) {
        redirectToLogin();
        return;
    }
  
    const usernameElement = document.getElementById('username');
    const walletAddressElement = document.getElementById('wallet-address');
    const balanceElement = document.getElementById('balance');
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
                services: updatedProfile.services,
                balance: updatedProfile.balance,
                fullName: updatedProfile.fullName,
                walletAddress: updatedProfile.walletAddress,
                email: updatedProfile.email
            };
            balanceElement.textContent = `AED ${formatAmount(parseFloat(updatedUserInfo.balance).toFixed(3))}`;
            walletAddressElement.setAttribute('data-full-address', updatedUserInfo.walletAddress);
            walletAddressElement.textContent = truncateWalletAddress(updatedUserInfo.walletAddress) || 'Guest';
            usernameElement.textContent = updatedUserInfo.fullName || 'N/A';
            emailElement.textContent = updatedUserInfo.email || 'N/A';
            // **Services Section - Dynamically Generate Service Cards**
            const servicesContainer = document.getElementById('services-container'); // Ensure you have a div with this ID

            // Clear previous content
            servicesContainer.innerHTML = '';

            let row = null; // Declare row outside loop

            //Ensure only the first 9 services are displayed
            const limitedServices = updatedUserInfo.services.slice(0, 3);
            limitedServices.forEach((service, index) => {
                if (index % 3 === 0) {
                    // Create a new row after every 3 items
                    row = document.createElement('div');
                    row.className = 'row g-3 mt-1';
                    servicesContainer.appendChild(row); // Append row to container
                }

                if (row) { // Ensure row exists before appending
                    // Create service column
                    const col = document.createElement('div');
                    col.className = 'col-md-4 col-4';

                    // Create anchor element (clickable link)
                    const link = document.createElement('a');
                    link.href = service.url;
                    link.target = '_blank'; // Open in a new tab
                    link.className = 'text-decoration-none text-white quicklink_button';

                    // Create image element
                    const img = document.createElement('img');
                    img.src = service.image;
                    img.alt = service.name;
                    img.className = 'img-fluid mx-auto d-block project-icons';

                    // Create text description
                    const p = document.createElement('p');
                    p.className = 'text-center font-12 mt-2';
                    p.innerHTML = `${service.name} <br> Management`;

                    // Append image and text inside anchor
                    link.appendChild(img);
                    link.appendChild(p);

                    // Append anchor inside column
                    col.appendChild(link);

                    // Append column to the row
                    row.appendChild(col);
                }
            });
        }
        
        fetchQuickLinks();
        fetchRecentServices();
        // Fetch transaction history
        await fetchAndUpdateTransactionHistory(pageSize=5);
  
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
  });

async function fetchTransactionCount() {
    const authToken = await chrome.storage.sync.get('authToken');
    if (!authToken || !authToken.authToken) {
        console.error('Authorization token is missing');
        redirectToLogin(); // Redirect or handle the missing token case
        return;
    }

    const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-transaction-count?filter=count', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken.authToken}`, // Ensure this line is correct
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        const data = await response.json();
        updateTransactionCountUI(data);
    } else {
        const errorData = await response.json();
        redirectToLogin();
        console.error('Failed to fetch transaction count:', errorData.error);
    }
}



function updateTransactionCountUI(data) {
    const debitCountElement = document.getElementById('debit-count');
    const creditCountElement = document.getElementById('credit-count');
    const totalCountElement = document.getElementById('total-count');

    // Check if data and elements are available
    if (data && debitCountElement && creditCountElement && totalCountElement) {
        // Update the text content of each element with data from the API
        debitCountElement.textContent = data.stats.monthly_debit_count;
        creditCountElement.textContent = data.stats.monthly_credit_count;
        totalCountElement.textContent = data.stats.monthly_total_count;
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    await fetchTransactionCount();  // Fetches and updates the transaction counts
});
// This function should be defined in a separate JavaScript file or within a <script> tag in your HTML.

async function fetchAndUpdateTransactionHistory(pageSize) {
    const { authToken } = await chrome.storage.sync.get('authToken');
if (!authToken) {
    console.error('No authToken found. Cannot log out.');
    return;
}
    try {
        const response = await fetch(`https://dev-wallet-api.dubaicustoms.network/api/ext-transaction?page_size=${pageSize}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch transaction data:', response.statusText);
            redirectToLogin();
        }
        
        const data = await response.json();
        console.log("this is data.data", data);
        updateTransactionTable(data.data);
    } catch (error) {
        console.error('Error fetching transaction data:', error);
    }
}

function updateTransactionTable(transactions) {
    const tableBody = document.querySelector('.table-dark tbody');
    tableBody.innerHTML = ''; // Clears the table
    const out_transaction_img = "./icons/withdrawal.svg";
    const in_transaction_img = "./icons/deposit.svg";
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        // Add cells and content to each row based on the transaction data
        row.innerHTML = `<td>
                            <span class="d-flex align-items-center">
                            <div style="width: max-content;">
                                <img src="${
                                  transaction.debit
                                    ? out_transaction_img
                                    : in_transaction_img
                                }" alt="" class="img-fluid type-img">
                            </div>
                                <div class="ms-5">
                                    <p class="text-truncate mb-2 font-14">${  transaction.debit
                                    ? truncateWalletAddress(
                                        transaction.to_wallet_address
                                      )
                                    : truncateWalletAddress(
                                        transaction.from_wallet_address
                                      )}</p>
                                    <span class="text-gray-600 font-12">From: ${new Date(
                                        transaction.created_at
                                      ).toLocaleString()}</span>
                                </div>
                            </span>
                        </td>
                       <td class="${
                      transaction.debit ? "text-danger" : "text-success"
                    } px-3">
                        ${transaction.debit ? "-" : "+"} AED ${
          transaction.amount
        }
                    </td>
                        <td><div class="position-relative"><span class="span-${getStatusClass(transaction.status)}"></span> ${transaction.status}</div></td>
                        <td class="px-3">
                       <p class="mb-2">${
                          transaction.module_id === "Top up wallet"
                            ? "Bank Transfer"
                            : "Wallet Transfer"
                        }</p>
                        <span
                            class="text-truncate text-gray-600 font-12">${
                                truncateWalletAddress(transaction.extrinsic_hash) ||
                                "N/A"
                              }</span>
                    </td>`;
        tableBody.appendChild(row);
    });
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'completed': return 'success';
        case 'failed': return 'danger';
        case 'processing': return 'warning';
        default: return '';
    }
}

function fetchRecentServices() {
    chrome.storage.sync.get('recentServices', function (response) {
        let recentServicesArray = response.recentServices || [];
        let recentService = recentServicesArray.slice(0, 3);
        const recentServicesContainer = document.getElementById('recent-services');
        recentServicesContainer.innerHTML = '';

        let row = null;

        recentService.forEach((service, index) => {
            if (index % 3 === 0) {
                row = document.createElement('div');
                row.className = 'row g-3 mt-1';
                recentServicesContainer.appendChild(row);
            }

            if (row) {
                const col = document.createElement('div');
                col.className = 'col-md-4 col-4';

                const link = document.createElement('a');
                link.href = service.url;
                link.target = '_blank'; // Open in a new tab
                link.className = 'text-decoration-none text-white quicklink_button';

                const img = document.createElement('img');
                img.src = service.imgSrc;
                img.alt = service.label;
                img.className = 'img-fluid mx-auto d-block project-icons';

                const p = document.createElement('p');
                p.className = 'text-center font-12 mt-2';
                p.innerHTML = service.label;

                link.appendChild(img);
                link.appendChild(p);

                col.appendChild(link);

                row.appendChild(col);
            }
        });
    });
}

function fetchQuickLinks() {
    document.addEventListener('click', function(event) {
        if (event.target.closest('.quicklink_button')) {
            event.preventDefault();
            var button = event.target.closest('.quicklink_button');
            var url = button.getAttribute('href');
            var imgSrc = button.querySelector('img').getAttribute('src');
            var label = button.querySelector('p').textContent.trim();

            chrome.storage.sync.get('recentServices', function (response) {
                let recentServicesArray = response.recentServices || [];

                // Remove the existing entry if found
                recentServicesArray = recentServicesArray.filter(service => service.url !== url);

                // Add the new entry to the top
                recentServicesArray.unshift({ url, imgSrc, label });

                // Keep only the last 3 entries
                if (recentServicesArray.length > 3) {
                    recentServicesArray = recentServicesArray.slice(0, 3);
                }

                chrome.storage.sync.set({ recentServices: recentServicesArray }, function() {
                    console.log("Updated recent services:", recentServicesArray);
                    fetchRecentServices();
                });
            });

            window.open(url, '_blank');
        }
    });
}
