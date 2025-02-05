
// let currentPage = 1;
// let totalPages = 1;
// let query = '';
// let filter = '';
// const prevButton = document.getElementById("prev-button");
// const nextButton = document.getElementById("next-button");

// // Redirect to login if no token or token is invalid
function redirectToLogin() {
    chrome.storage.sync.remove(['authToken', 'connectedSites']);
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

// Fetch and update balance
// async function fetchAndUpdateBalance() {
   
//     try {
//         const { authToken } = await chrome.storage.sync.get('authToken');
//         if (!authToken) {
//             console.error('Authorization token is missing');
//             redirectToLogin();
//             return;
//         }

//         const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-balance', {
//             method: 'GET',
//             headers: { 'Authorization': `Bearer ${authToken}` }
//         });

//         if (response.ok) {
//             const { balance } = await response.json();
//             document.getElementById('balance').textContent = `AED ${formatAmount(parseFloat(balance).toFixed(3))}`;
//         } else if (response.status === 401) {
//             console.error('Token expired or invalid, redirecting to login.');
//             redirectToLogin();
//         } else {
//             console.error('Failed to fetch balance:', response.statusText);
//         }
//     } catch (error) {
//         console.error('Error fetching balance:', error);
//     }
// }




// prevButton.addEventListener("click", async () => {
//     if (currentPage > 1) {
//         await fetchAndUpdateTransactionHistory(currentPage - 1);
//     }
// });

// nextButton.addEventListener("click", async () => {
//     if (currentPage < totalPages) {
//         await fetchAndUpdateTransactionHistory(currentPage + 1);
//     }
// });

// // Fetch and update transaction history with pagination support
// async function fetchAndUpdateTransactionHistory(page = 1) {
//     const paginationInfo = document.getElementById("pagination-info");
//     const pageNumbers = document.getElementById("page-numbers");
//     const activitiesContent = document.getElementById("activities-content");
//     const loader = document.getElementById('balance-loader');
//     const activityContainer = document.querySelector('.p-3');
    
//     if (loader) {
//         loader.style.display = 'inline-block'; // Show loader before fetching
//     }

//     let timeoutFlag = false;

//     // Set a timeout to show "No Transactions Found" if no data is fetched within 5 seconds
//     const noDataTimeout = setTimeout(() => {
//         timeoutFlag = true;
//         if (activityContainer.innerHTML.trim() === '') {
//             activityContainer.innerHTML = `
//                 <div class="no-transactions-message text-center text-white">
//                     <p>No transactions found</p>
//                 </div>`;
//         }
//         if (loader) {
//             loader.style.display = 'none'; // Hide loader after timeout
//         }
//     }, 5000);

//     try {
//         const { authToken } = await chrome.storage.sync.get('authToken');
//         if (!authToken) {
//             console.error('Authorization token is missing');
//             redirectToLogin();
//             return;
//         }

//         let response = null;

//         if (filter != ''){
//             response = await fetch(`https://dev-wallet-api.dubaicustoms.network/api/ext-transaction?page=${page}&query=${query}&filter=${filter}`, {
//                 method: 'GET',
//                 headers: { 'Authorization': `Bearer ${authToken}` }
//             });
//         }else{
//             response = await fetch(`https://dev-wallet-api.dubaicustoms.network/api/ext-transaction?page=${page}&query=${query}`, {
//                 method: 'GET',
//                 headers: { 'Authorization': `Bearer ${authToken}` }
//             });
//         }
        

//         clearTimeout(noDataTimeout); // Clear the timeout if data is fetched successfully

//         if (response.ok) {
//             const data = await response.json();
//             if (data.data.length > 0) {
//                 updateTransactionHistoryUI(data.data); // Pass the transactions array

//                 // Update pagination info
//                 currentPage = data.page;
//                 totalPages = data.page_count;

//                 paginationInfo.textContent = `${(currentPage - 1) * 5 + 1}-${Math.min(currentPage * 5, data.count)} of ${data.count}`;
//                 pageNumbers.textContent = `Page ${currentPage} of ${totalPages}`;

//                 // Enable/disable buttons based on page info
//                 prevButton.disabled = currentPage <= 1;
//                 nextButton.disabled = currentPage >= totalPages;
//             } else if (!timeoutFlag) {
//                 // If no transactions and the timeout hasn't already occurred
//                 activityContainer.innerHTML = `
//                     <div class="no-transactions-message text-center text-white">
//                         <p>No transactions found</p>
//                     </div>`;
//                     paginationInfo.textContent = `0-0 of 0`;
//                     pageNumbers.textContent = `1`;
//             }
//         } else if (response.status === 401) {
//             console.error('Token expired or invalid, redirecting to login.');
//             redirectToLogin();
//         } else {
//             console.error('Failed to fetch transactions:', response.statusText);
//         }
//     } catch (error) {
//         console.error('Error fetching transactions:', error);
//     } finally {
//         if (loader) {
//             loader.style.display = 'none'; // Hide loader after transactions are fetched
//         }
//     }
// }


// // Function to update the UI with the fetched transaction history
// function updateTransactionHistoryUI(transactions) {
//     const activityContainer = document.querySelector('.p-3');
//     activityContainer.innerHTML = ''; // Clear any existing content

//     transactions.forEach(transaction => {
//         // Create a new card for each transaction
//         const fullwalletAdress = transaction.debit ? transaction.to_wallet_address : transaction.from_wallet_address;
//         const shortAddress = fullwalletAdress.substring(0, 5) + '...' + fullwalletAdress.substring(fullwalletAdress.length - 4);
//         const colorClass = transaction.debit ? 'text-danger' : 'text-success';
//         const typeText = transaction.debit ? 'To' : 'From';
//         let statuscolor = 'text-secondary';
//         let borderClass = '';
//         const sign = transaction.debit ? '-' : '+';

//         if (transaction.status === 'pending') {
//         statuscolor = 'text-warning';
//         borderClass = 'border border-warning';
//         } else if (transaction.status === 'completed') {
//         statuscolor = 'text-success';
//         borderClass = 'border border-success';
//         }

//         const transactionCard = document.createElement('div');
//         transactionCard.classList.add('card', 'mb-3', 'border-0', 'activity-card');

//         transactionCard.innerHTML = `
//             <div class="row g-0 justify-content-center align-items-center">
//                 <!-- First Column: Transaction to -->
//                 <div class="col-4 col-md-4 ps-2">
//                     <div class="text-start activity-card-body p-1">
//                         <h5 class="card-title font-14 font-regular m-0 text-white">${typeText} : </h5>
//                         <a href="#" class="address-link mx-2" style="color: rgba(0, 194, 255, 1);" data-full-address="${fullwalletAdress}" 
//        title="${fullwalletAdress}">${shortAddress}</a>
//        <span class="copy-message" style="display: none;">Copied!</span>
//        </div>
//                 </div>
                
//                 <!-- Second Column: Amount -->
//                 <div class="col-4 col-md-4 text-center d-flex justify-content-center">
//                     <h5 class="card-title font-14 font-regular m-0 ${colorClass}">${sign} AED ${parseFloat(transaction.amount).toFixed(2)}</h5>
//                     <span class="card-text font-12 ms-2"><small class="badge status-color ${statuscolor} ${borderClass}">${transaction.status}</small></span>
//                 </div>
                
//                 <!-- Third Column: Date of the Transaction -->
//                 <div class="col-4 col-md-4 text-end padding-right">
//                     <p class="card-text font-12 text-white"><small>${new Date(transaction.created_at).toLocaleString()}</small></p>
//                 </div>
//             </div>
//         `;

//         activityContainer.appendChild(transactionCard);
//     });
// }

// // Fetch updated user profile from the API
async function fetchUpdatedUserProfile() {
    try {
        const { authToken } = await chrome.storage.sync.get('authToken');
        if (!authToken) {
            console.error('Authorization token is missing');
            redirectToLogin();
            return;
        }

        const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else if (response.status === 404) {
            console.error('Token expired or invalid, redirecting to login.');
            redirectToLogin();
        } else {
            console.error('Failed to fetch user profile:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
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

// // Remaining unchanged code for copy wallet address and DOM loading logic follows
// //   document.querySelector('.p-3').addEventListener('click', (event) => {
// //     if (event.target.classList.contains('address-link')) {
// //         event.preventDefault();
// //         const fullwalletAddress = event.target.getAttribute('data-full-address');
// //         const copyMessage = document.createElement('span');
// //         copyMessage.className = 'copy-message';
// //         copyMessage.style.display = 'inline';
// //         copyMessage.textContent = 'Copied!';
// //         event.target.parentNode.appendChild(copyMessage);

// //         if (fullwalletAddress) {
// //             navigator.clipboard.writeText(fullwalletAddress).then(() => {
// //                 setTimeout(() => {
// //                     copyMessage.style.display = 'none';
// //                 }, 1000);
// //             }).catch(err => {
// //                 console.error('Could not copy text: ', err);
// //             });
// //         }
// //     }
// // });
//   // Event listener for DOM content loading
  document.addEventListener('DOMContentLoaded', async () => {
    const { authToken } = await chrome.storage.sync.get(['authToken']);
  
    if (!authToken) {
        redirectToLogin();
        return;
    }
  
    const usernameElement = document.getElementById('username');
    const walletAddressElement = document.getElementById('wallet-address');
    const balanceElement = document.getElementById('balance');
    
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
            };
            balanceElement.textContent = `AED ${formatAmount(parseFloat(updatedUserInfo.balance).toFixed(3))}`;
            walletAddressElement.setAttribute('data-full-address', updatedUserInfo.walletAddress);
            walletAddressElement.textContent = truncateWalletAddress(updatedUserInfo.walletAddress) || 'Guest';
            usernameElement.textContent = updatedUserInfo.fullName || 'N/A';

            // **Services Section - Dynamically Generate Service Cards**
            const servicesContainer = document.getElementById('services-container'); // Ensure you have a div with this ID

            // Clear previous content
            servicesContainer.innerHTML = '';

            let row = null; // Declare row outside loop

            Object.entries(updatedUserInfo.services).forEach(([serviceName, imageUrl], index) => {
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

                    // Create image element
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = serviceName;
                    img.className = 'img-fluid mx-auto d-block project-icons';

                    // Create text description
                    const p = document.createElement('p');
                    p.className = 'text-center font-12 mt-2';
                    p.innerHTML = `${serviceName} <br> Management`;

                    // Append image and text inside column
                    col.appendChild(img);
                    col.appendChild(p);

                    // Append column to the row
                    row.appendChild(col);
                }
            });


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
            confirmButton.addEventListener('click', () => {
                lockModal.hide();
                lockWallet();
            }, { once: true });
        });
    }
  });

//   document.addEventListener('DOMContentLoaded', function() {
//     const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
//     const navbarCollapse = document.getElementById('navbarSupportedContent');
//     const navbarToggler = document.querySelector('.navbar-toggler');

//     // Close the navbar when a nav link is clicked
//     navLinks.forEach(link => {
//       link.addEventListener('click', () => {
//         if (navbarCollapse.classList.contains('show')) {
//           navbarCollapse.classList.remove('show');
//           navbarToggler.setAttribute('aria-expanded', 'false');
//         }
//       });
//     });

//     // Close the navbar when clicking outside of it
//     window.addEventListener('click', (event) => {
//       if (!navbarCollapse.contains(event.target) && !navbarToggler.contains(event.target)) {
//         if (navbarCollapse.classList.contains('show')) {
//           navbarCollapse.classList.remove('show');
//           navbarToggler.setAttribute('aria-expanded', 'false');
//         }
//       }
//     });
//   });


//   document.addEventListener("DOMContentLoaded", () => {
//     const searchInput = document.getElementById('search-input');
//     let debounceTimeout;

//     searchInput.addEventListener('input', function () {
//         query = this.value;
//         console.log(query);
//         currentPage = 1;
//         totalPages = 1;
//         if (query !== '') {
//             clearTimeout(debounceTimeout);
//             debounceTimeout = setTimeout(() => {
//                 fetchAndUpdateTransactionHistory(currentPage);
//             }, 300); 
//         } else {
//             fetchAndUpdateTransactionHistory(currentPage);
//         }
//     });
// });
// // document.addEventListener("DOMContentLoaded", () => {
// //     document.getElementById('transaction-filter').addEventListener('change', function() {
// //         // Get the current URL
// //         const value = document.getElementById('transaction-filter').value;
// //         filter = value;
// //         if (value != ''){
// //             currentPage = 1;
// //             totalPages = 1;
// //             fetchAndUpdateTransactionHistory(currentPage)
// //         }
        
// //     });
// // });