import {
  redirectToLogin,
  hideFullScreenLoader,
  showFullScreenLoader,
  loadNavbarAndSidebar,
  truncateWalletAddress,
  handleLogout,
  handleCopyWalletAddress,
} from './generic.js';

async function fetchUpdatedUserProfile() {
  try {
    const { authToken } = await chrome.storage.sync.get("authToken");
    if (!authToken) {
      console.error("Authorization token is missing");
      redirectToLogin();
      return;
    }

    const response = await fetch(
      "https://dev-wallet-api.dubaicustoms.network/api/ext-profile",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 404) {
      console.error("Token expired or invalid, redirecting to login.");
      redirectToLogin();
    } else {
      console.error("Failed to fetch user profile:", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}

async function fetchAndUpdateTransactionHistory(selectedText = "All Time", page=1) {
  const pageSize = 7

  let dropdownButton = document.getElementById("dateRangeDropdown");
  if (dropdownButton) {
      dropdownButton.textContent = selectedText; // Update the dropdown button text
  }

  // Calculate start_date and end_date
  let endDate = Math.floor(Date.now() / 1000);
  let startDate;

  if (selectedText === "Last 7 Days") {
      startDate = endDate - 7 * 24 * 60 * 60;
  } else if (selectedText === "Last 15 Days") {
      startDate = endDate - 15 * 24 * 60 * 60;
  } else if (selectedText === "Last 30 Days") {
      startDate = endDate - 30 * 24 * 60 * 60;
  }
  else if (selectedText === "All Time") {
      startDate = "";
      endDate = "";
  } else {
      console.error("Invalid date range selected");
      return;
  }

  console.log(`Fetching transactions from ${new Date(startDate * 1000).toLocaleDateString()} to ${new Date(endDate * 1000).toLocaleDateString()}`);

  // Fetch auth token and make API request
  try {
      const { authToken } = await chrome.storage.sync.get("authToken");
      if (!authToken) {
          console.error("Authorization token is missing");
          redirectToLogin();
          return;
      }

      const response = await fetch(
          `https://dev-wallet-api.dubaicustoms.network/api/ext-transaction?start_date=${startDate}&end_date=${endDate}&page_size=${pageSize}&page=${page}`,
          {
              method: "GET",
              headers: {
                  "Authorization": `Bearer ${authToken}`,
                  "Accept": "application/json",
                  "Content-Type": "application/json"
              }
          }
      );

      if (!response.ok) {
          if (response.status === 401) {
              console.error("Token expired or invalid, redirecting to login.");
              redirectToLogin();
          } else {
              console.error("Failed to fetch transaction history:", response.statusText);
          }
          return;
      }

      const result = await response.json();
      updateTransactionTable(result);

      // Update pagination
      updatePagination(result.page_count, page);

  } catch (error) {
      console.error("Error fetching transaction history:", error);
  }
}

// Event Listener for Date Range Selection
function setupDateRangeListeners() {
    document.querySelectorAll("#dateRangeMenu .dropdown-item").forEach(item => {
        item.addEventListener("click", async function () {
            let selectedText = this.getAttribute("data-value");
            await fetchAndUpdateTransactionHistory(selectedText);
        });
    });
}
function updateTransactionTable(result) {
  if (result.status === "success") {
    const transactions = result.data;
    const total_count = result.stats.data_count;

    let failedCount = result.stats.failed_count;
    let completedCount = result.stats.success_count;

    const allTransactionbtn = document.getElementById("allTransactionbtn");
    const successfulTransactionbtn = document.getElementById("successfulTransactionbtn");
    const failedTransactionbtn = document.getElementById("failedTransactionbtn");

    // Format count with leading zero if less than 10
    const formatCount = (count) => count < 10 ? `0${count}` : count;

    allTransactionbtn.textContent = `All ${formatCount(total_count)}`;
    successfulTransactionbtn.textContent = `Completed ${formatCount(completedCount)}`;
    failedTransactionbtn.textContent = `Failed ${formatCount(failedCount)}`;

    const tableBody = document.querySelector(".custom-table tbody");

    // Function to display transactions based on filter type
    function displayTransactions(filterType = "all") {
        tableBody.innerHTML = ""; // Clear previous data

        const filteredTransactions = transactions.filter(transaction => {
            if (filterType === "completed") return transaction.status === "completed";
            if (filterType === "failed") return transaction.status === "failed";
            return true; // Show all if filter is "all"
        });

        filteredTransactions.forEach(transaction => {
            const row = document.createElement("tr");
            row.classList.add("border-bottom");

            row.innerHTML = `
                <td>
                    <span class="d-flex align-items-center">
                        <div style="width: max-content;">
                            <img src="${
                              transaction.debit ? "./icons/withdrawal.svg" : "./icons/deposit.svg"
                            }" alt="" class="img-fluid type-img">
                        </div>
                        <div class="ms-4">
                            <p class="text-truncate mb-2 font-14">${
                              transaction.debit
                                ? truncateWalletAddress(transaction.to_wallet_address)
                                : truncateWalletAddress(transaction.from_wallet_address)
                            }</p>
                            <span class="text-gray-600 font-12">From: ${new Date(
                              transaction.created_at
                            ).toLocaleString()}</span>
                        </div>
                    </span>
                </td>
                <td class="${transaction.debit ? "text-danger" : "text-success"} px-3">
                    ${transaction.debit ? "-" : "+"} AED ${transaction.amount}
                </td>
                <td class="px-3">
                    <div class="position-relative">
                        <span class="${
                          transaction.status === "completed" ? "span-success" : "span-danger"
                        }"></span> ${transaction.status}
                    </div>
                </td>
                <td class="px-3">
                    <p class="mb-2">${
                      transaction.module_id === "Top up wallet" ? "Bank Transfer" : "Wallet Transfer"
                    }</p>
                    <span class="text-truncate text-gray-600 font-12">${
                      truncateWalletAddress(transaction.extrinsic_hash) || "N/A"
                    }</span>
                </td>
                <td class="px-3">
                    <div class="d-flex align-items-center">
                        <span class="status-indicator span-department"></span>
                        ${transaction.module_type || "N/A"}
                    </div>
                </td>
                <td class="px-3">
                    <span class="text-truncate font-12">${new Date(
                      transaction.created_at
                    ).toLocaleString()}</span>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    // Function to handle button clicks and apply active state
    function handleButtonClick(button, filterType) {
        displayTransactions(filterType);

        // Remove "bg-color-button" class from all buttons
        allTransactionbtn.classList.remove("bg-color-button");
        successfulTransactionbtn.classList.remove("bg-color-button");
        failedTransactionbtn.classList.remove("bg-color-button");

        // Add "bg-color-button" class to the active button
        button.classList.add("bg-color-button");
    }

    // Initial load with all transactions and set active button
    handleButtonClick(allTransactionbtn, "all");

    // Add event listeners for filtering and button highlighting
    allTransactionbtn.addEventListener("click", () => handleButtonClick(allTransactionbtn, "all"));
    successfulTransactionbtn.addEventListener("click", () => handleButtonClick(successfulTransactionbtn, "completed"));
    failedTransactionbtn.addEventListener("click", () => handleButtonClick(failedTransactionbtn, "failed"));
} else {
    console.error("Transaction fetch failed:", result);
}
}


document.addEventListener("DOMContentLoaded", async () => {
  showFullScreenLoader();
  await loadNavbarAndSidebar();
  let defaultSelectedText = document.getElementById("dateRangeDropdown")?.textContent.trim() || "Last 7 Days";
  await fetchAndUpdateTransactionHistory(defaultSelectedText);
  setupDateRangeListeners();
  const { authToken } = await chrome.storage.sync.get(["authToken"]);

  if (!authToken) {
    redirectToLogin();
    return;
  }

  const usernameElement = document.getElementById("username");
  const walletAddressElement = document.getElementById("wallet-address");
  const emailElement = document.getElementById('email');

  handleCopyWalletAddress();

  if (usernameElement && walletAddressElement) {
    // Fetch updated profile
    const updatedProfile = await fetchUpdatedUserProfile();
    if (updatedProfile) {
      const updatedUserInfo = {
        fullName: updatedProfile.fullName,
        walletAddress: updatedProfile.walletAddress,
        email: updatedProfile.email
      };
      walletAddressElement.setAttribute(
        "data-full-address",
        updatedUserInfo.walletAddress
      );
      walletAddressElement.textContent =
        truncateWalletAddress(updatedUserInfo.walletAddress) || "Guest";
      usernameElement.textContent = updatedUserInfo.fullName || "N/A";
      emailElement.textContent = updatedUserInfo.email || 'N/A';
    }


    hideFullScreenLoader();
    // Periodic balance update
  }
  handleLogout();
});


function updatePagination(totalPages, currentPage = 1) {
  let paginationContainer = document.querySelector(".pagination");
  
  if (totalPages <= 1){
    paginationContainer.classList.add("hide-pagination");
    return;
  }
  else{
    paginationContainer.classList.remove("hide-pagination");
  }
  
  paginationContainer.innerHTML = ""; // Clear previous pagination
  let createPageItem = (text, page, isActive = false, isDisabled = false) => {
    
      let li = document.createElement("li");
      li.className = `page-item ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`;
      let a = document.createElement("a");
      a.className = "page-link";
      a.href = "#";
      a.textContent = text;
      if (!isDisabled) {
          a.addEventListener("click", (e) => {
              e.preventDefault();
              fetchAndUpdateTransactionHistory(document.getElementById("dateRangeDropdown").textContent, page);
          });
      }
      li.appendChild(a);
      return li;
  };
  if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
          let pageItem = createPageItem(i, i, currentPage === i);
          paginationContainer.appendChild(pageItem);
      }
      return;
  }
  if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) {
          let pageItem = createPageItem(i, i, currentPage === i);
          paginationContainer.appendChild(pageItem);
      }
      paginationContainer.appendChild(createPageItem("...", currentPage + 1));
      paginationContainer.appendChild(createPageItem(totalPages, totalPages, currentPage === totalPages));
  } else if (currentPage >= totalPages - 2) {
      paginationContainer.appendChild(createPageItem(1, 1, currentPage === 1));
      paginationContainer.appendChild(createPageItem("...", currentPage - 1));
      for (let i = totalPages - 4; i <= totalPages; i++) {
          let pageItem = createPageItem(i, i, currentPage === i);
          paginationContainer.appendChild(pageItem);
      }
  } else {
      paginationContainer.appendChild(createPageItem(1, 1, currentPage === 1));
      paginationContainer.appendChild(createPageItem("...", currentPage - 1));
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          let pageItem = createPageItem(i, i, currentPage === i);
          paginationContainer.appendChild(pageItem);
      }
      paginationContainer.appendChild(createPageItem("...", currentPage + 1));
      paginationContainer.appendChild(createPageItem(totalPages, totalPages, currentPage === totalPages));
  }
}
