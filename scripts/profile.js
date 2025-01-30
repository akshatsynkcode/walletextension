
let currentPage = 1;
let totalPages = 1;
let query = '';
let filter = '';
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");

// Redirect to login if no token or token is invalid
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
async function fetchAndUpdateBalance() {
    const loader = document.getElementById('balance-loader');
    if (loader) {
        loader.style.display = 'inline-block'; // Show loader before fetching balance
    }

    try {
        const { authToken } = await chrome.storage.sync.get('authToken');
        if (!authToken) {
            console.error('Authorization token is missing');
            redirectToLogin();
            return;
        }

        const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-balance', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const { balance } = await response.json();
            document.getElementById('balance').textContent = `AED ${formatAmount(parseFloat(balance).toFixed(3))}`;
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            redirectToLogin();
        } else {
            console.error('Failed to fetch balance:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
    } finally {
        if (loader) {
            loader.style.display = 'none'; // Hide loader after balance is fetched
        }
    }
}




prevButton.addEventListener("click", async () => {
    if (currentPage > 1) {
        await fetchAndUpdateTransactionHistory(currentPage - 1);
    }
});

nextButton.addEventListener("click", async () => {
    if (currentPage < totalPages) {
        await fetchAndUpdateTransactionHistory(currentPage + 1);
    }
});

// Fetch and update transaction history with pagination support
async function fetchAndUpdateTransactionHistory(page = 1) {
    const paginationInfo = document.getElementById("pagination-info");
    const pageNumbers = document.getElementById("page-numbers");
    const activitiesContent = document.getElementById("activities-content");
    const loader = document.getElementById('balance-loader');
    const activityContainer = document.querySelector('.p-3');
    
    if (loader) {
        loader.style.display = 'inline-block'; // Show loader before fetching
    }

    let timeoutFlag = false;

    // Set a timeout to show "No Transactions Found" if no data is fetched within 5 seconds
    const noDataTimeout = setTimeout(() => {
        timeoutFlag = true;
        if (activityContainer.childElementCount === 0) {
            const noTransactionsMessage = document.createElement('div');
            noTransactionsMessage.classList.add('no-transactions-message', 'text-center', 'text-white');
            const noTransactionsText = document.createElement('p');
            noTransactionsText.textContent = "No transactions found";
            noTransactionsMessage.appendChild(noTransactionsText);
            while (activityContainer.firstChild) {
                activityContainer.removeChild(activityContainer.firstChild);
            }
            activityContainer.appendChild(noTransactionsMessage);
        }
        if (loader) {
            loader.style.display = 'none'; // Hide loader after timeout
        }
    }, 5000);

    try {
        const { authToken } = await chrome.storage.sync.get('authToken');
        if (!authToken) {
            console.error('Authorization token is missing');
            redirectToLogin();
            return;
        }

        let response = null;

        if (filter != ''){
            response = await fetch(`https://dev-wallet-api.dubaicustoms.network/api/ext-transaction?page=${page}&query=${query}&filter=${filter}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        }else{
            response = await fetch(`https://dev-wallet-api.dubaicustoms.network/api/ext-transaction?page=${page}&query=${query}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        }
        

        clearTimeout(noDataTimeout); // Clear the timeout if data is fetched successfully

        if (response.ok) {
            const data = await response.json();
            if (data.data.length > 0) {
                updateTransactionHistoryUI(data.data); // Pass the transactions array

                // Update pagination info
                currentPage = data.page;
                totalPages = data.page_count;

                paginationInfo.textContent = `${(currentPage - 1) * 5 + 1}-${Math.min(currentPage * 5, data.count)} of ${data.count}`;
                pageNumbers.textContent = `Page ${currentPage} of ${totalPages}`;

                // Enable/disable buttons based on page info
                prevButton.disabled = currentPage <= 1;
                nextButton.disabled = currentPage >= totalPages;
            } else if (!timeoutFlag) {
                //Removed the innerHTML and used textContent
                const noTransactionsMessage = document.createElement('div');
                noTransactionsMessage.classList.add('no-transactions-message', 'text-center', 'text-white');
                const noTransactionsText = document.createElement('p');
                noTransactionsText.textContent = "No transactions found";
                noTransactionsMessage.appendChild(noTransactionsText);
                while (activityContainer.firstChild) {
                    activityContainer.removeChild(activityContainer.firstChild);
                }
                activityContainer.appendChild(noTransactionsMessage);
                paginationInfo.textContent = "0-0 of 0";
                pageNumbers.textContent = "1";
            }
        } else if (response.status === 401) {
            console.error('Token expired or invalid, redirecting to login.');
            redirectToLogin();
        } else {
            console.error('Failed to fetch transactions:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
    } finally {
        if (loader) {
            loader.style.display = 'none'; // Hide loader after transactions are fetched
        }
    }
}


// Function to update the UI with the fetched transaction history
function updateTransactionHistoryUI(transactions) {
    const activityContainer = document.querySelector('.p-3');
    while (activityContainer.firstChild) {
        activityContainer.removeChild(activityContainer.firstChild);
    } // Clear any existing content

    transactions.forEach(transaction => {
        // Create a new card for each transaction
        const fullwalletAdress = transaction.debit ? transaction.to_wallet_address : transaction.from_wallet_address;
        const shortAddress = fullwalletAdress.substring(0, 5) + '...' + fullwalletAdress.substring(fullwalletAdress.length - 4);
        const colorClass = transaction.debit ? 'text-danger' : 'text-success';
        const typeText = transaction.debit ? 'To' : 'From';
        const sign = transaction.debit ? '-' : '+';

        const transactionCard = document.createElement('div');
        transactionCard.classList.add('card', 'mb-3', 'border-0', 'activity-card');

        const rowDiv = document.createElement("div");
        rowDiv.classList.add("row", "g-0", "justify-content-center", "align-items-center");

        const firstCol = document.createElement("div");
        firstCol.classList.add("col-4", "col-md-4", "ps-2");

        const firstColBody = document.createElement("div");
        firstColBody.classList.add("text-start", "activity-card-body", "p-1");

        const h5TypeText = document.createElement("h5");
        h5TypeText.classList.add("card-title", "font-14", "font-regular", "m-0", "text-white");
        h5TypeText.textContent = `${typeText} : `;

        const walletLink = document.createElement("a");
        walletLink.href = "#";
        walletLink.classList.add("address-link", "mx-2");
        walletLink.style.color = "rgba(0, 194, 255, 1)";
        walletLink.dataset.fullAddress = fullwalletAdress;
        walletLink.title = fullwalletAdress;
        walletLink.textContent = shortAddress;

        const copyMessage = document.createElement("span");
        copyMessage.classList.add("copy-message");
        copyMessage.style.display = "none";
        copyMessage.textContent = "Copied!";

        firstColBody.appendChild(h5TypeText);
        firstColBody.appendChild(walletLink);
        firstColBody.appendChild(copyMessage);
        firstCol.appendChild(firstColBody);

        const secondCol = document.createElement("div");
        secondCol.classList.add("col-4", "col-md-4", "text-center", "d-flex", "justify-content-center");

        const h5Amount = document.createElement("h5");
        h5Amount.classList.add("card-title", "font-14", "font-regular", "m-0", colorClass);
        h5Amount.textContent = `${sign} AED ${parseFloat(transaction.amount).toFixed(2)}`;

        const statusBadge = document.createElement("small");

        if (transaction.status === 'pending') {
            statusBadge.classList.add("badge", "status-color", "text-warning", "border", "border-warning");
        } else if (transaction.status === 'completed') {
            statusBadge.classList.add("badge", "status-color", "text-success", "border", "border-success");
        } else{
            statusBadge.classList.add("badge", "status-color", "text-secondary");
        }
        statusBadge.textContent = transaction.status;

        const spanStatus = document.createElement("span");
        spanStatus.classList.add("card-text", "font-12", "ms-2");
        spanStatus.appendChild(statusBadge);

        secondCol.appendChild(h5Amount);
        secondCol.appendChild(spanStatus);

        const thirdCol = document.createElement("div");
        thirdCol.classList.add("col-4", "col-md-4", "text-end", "padding-right");

        const transactionDate = document.createElement("p");
        transactionDate.classList.add("card-text", "font-12", "text-white");

        const smallDate = document.createElement("small");
        smallDate.textContent = new Date(transaction.created_at).toLocaleString();

        transactionDate.appendChild(smallDate);
        thirdCol.appendChild(transactionDate);

        rowDiv.appendChild(firstCol);
        rowDiv.appendChild(secondCol);
        rowDiv.appendChild(thirdCol);

        transactionCard.appendChild(rowDiv);
        activityContainer.appendChild(transactionCard);
    });
}

// Fetch updated user profile from the API
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

// Lock wallet and redirect to login
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

// Remaining unchanged code for copy wallet address and DOM loading logic follows
  document.querySelector('.p-3').addEventListener('click', (event) => {
    if (event.target.classList.contains('address-link')) {
        event.preventDefault();
        const fullwalletAddress = event.target.getAttribute('data-full-address');
        const copyMessage = document.createElement('span');
        copyMessage.className = 'copy-message';
        copyMessage.style.display = 'inline';
        copyMessage.textContent = 'Copied!';
        event.target.parentNode.appendChild(copyMessage);

        if (fullwalletAddress) {
            navigator.clipboard.writeText(fullwalletAddress).then(() => {
                setTimeout(() => {
                    copyMessage.style.display = 'none';
                }, 1000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
    }
});
  // Event listener for DOM content loading
  document.addEventListener('DOMContentLoaded', async () => {
    const { authToken } = await chrome.storage.sync.get(['authToken']);
  
    if (!authToken) {
        redirectToLogin();
        return;
    }
  
    const usernameElement = document.getElementById('username');
    const walletAddressElement = document.getElementById('wallet-address');
    const copyButton1 = document.getElementById('copy-button');
    const copyMessage = document.getElementById('copy-message');
  
    copyButton1.addEventListener('click', () => {
      const walletAddress = walletAddressElement.textContent;
  
      if (walletAddress !== 'N/A') {
        navigator.clipboard.writeText(walletAddress)
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
  
    if (usernameElement && walletAddressElement) {
        // Fetch updated profile
        const updatedProfile = await fetchUpdatedUserProfile();
        if (updatedProfile) {
            const updatedUserInfo = {
                fullName: updatedProfile.fullName,
                walletAddress: updatedProfile.walletAddress,
            };
            walletAddressElement.textContent = updatedUserInfo.walletAddress || 'Guest';
            usernameElement.textContent = updatedUserInfo.fullName || 'N/A';
        }
  
        // Fetch balance
        await fetchAndUpdateBalance();
  
        // Fetch transaction history
        await fetchAndUpdateTransactionHistory(currentPage);
  
        // Periodic balance update
    }
  
    // Copy wallet address functionality
    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const walletAddressElement = document.getElementById('wallet-address');
            const copyMessageElement = document.getElementById('copy-message');
  
            if (walletAddressElement && walletAddressElement.textContent !== 'N/A') {
                navigator.clipboard.writeText(walletAddressElement.textContent).then(() => {
                    copyMessageElement.style.display = 'inline';
                    setTimeout(() => (copyMessageElement.style.display = 'none'), 1000);
                });
            }
        });
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

  document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarCollapse = document.getElementById('navbarSupportedContent');
    const navbarToggler = document.querySelector('.navbar-toggler');

    // Close the navbar when a nav link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navbarCollapse.classList.contains('show')) {
          navbarCollapse.classList.remove('show');
          navbarToggler.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Close the navbar when clicking outside of it
    window.addEventListener('click', (event) => {
      if (!navbarCollapse.contains(event.target) && !navbarToggler.contains(event.target)) {
        if (navbarCollapse.classList.contains('show')) {
          navbarCollapse.classList.remove('show');
          navbarToggler.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });


  document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('search-input');
    let debounceTimeout;

    searchInput.addEventListener('input', function () {
        query = this.value;
        console.log(query);
        currentPage = 1;
        totalPages = 1;
        if (query !== '') {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                fetchAndUpdateTransactionHistory(currentPage);
            }, 300); 
        } else {
            fetchAndUpdateTransactionHistory(currentPage);
        }
    });
});
// document.addEventListener("DOMContentLoaded", () => {
//     document.getElementById('transaction-filter').addEventListener('change', function() {
//         // Get the current URL
//         const value = document.getElementById('transaction-filter').value;
//         filter = value;
//         if (value != ''){
//             currentPage = 1;
//             totalPages = 1;
//             fetchAndUpdateTransactionHistory(currentPage)
//         }
        
//     });
// });