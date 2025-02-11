function showFullScreenLoader() {
  document.getElementById('full-screen-loader').style.display = 'flex';
}

// Hide the full-screen loader
function hideFullScreenLoader() {
  document.getElementById('full-screen-loader').style.display = 'none';
}
function redirectToLogin() {
  chrome.storage.sync.remove(["authToken", "connectedSites"]);
  window.location.href = "login.html";
}
function truncateWalletAddress(
  walletAddress,
  startChars = 6,
  endChars = 6,
  separator = "......."
) {
  if (!walletAddress || walletAddress.length <= startChars + endChars) {
    return walletAddress; // Return the full address if it's too short to truncate
  }
  return `${walletAddress.substring(
    0,
    startChars
  )}${separator}${walletAddress.substring(walletAddress.length - endChars)}`;
}

// // Lock wallet and redirect to login
async function lockWallet() {
  const { authToken } = await chrome.storage.sync.get("authToken");
  if (!authToken) {
    console.error("No authToken found. Cannot log out.");
    return;
  }

  try {
    const response = await fetch(
      "https://dev-wallet-api.dubaicustoms.network/api/ext-logout",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.message === "Successfully Logged Out") {
        chrome.storage.sync.remove(["authToken", "connectedSites"], () => {
          chrome.runtime.sendMessage({ action: "lock_wallet" }, (response) => {
            if (response.success) {
              window.location.href = "login.html";
            } else {
              console.error("Failed to close full-screen tab.");
            }
          });
        });
        chrome.runtime.sendMessage({ action: "logout" });
      } else {
        alert("Logout failed. Please try again.");
      }
    } else {
      alert("Logout failed. Please try again.");
    }
  } catch (error) {
    console.error("Error during logout:", error);
    alert(
      "An error occurred during logout. Please try again." + response.status
    );
  }
}
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

async function fetchAndUpdateTransactionHistory(selectedText = "Last 7 Days") {
  console.log("Fetching transactions for:", selectedText);

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
      console.log(startDate, endDate);
      const response = await fetch(
          `https://dev-wallet-api.dubaicustoms.network/api/ext-transaction?start_date=${startDate}&end_date=${endDate}&page_size=100`,
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
          if (response.status === 404) {
              console.error("Token expired or invalid, redirecting to login.");
              redirectToLogin();
          } else {
              console.error("Failed to fetch transaction history:", response.statusText);
          }
          return;
      }

      const result = await response.json();
      updateTransactionTable(result);

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
    console.log("updateTransactionTable",transactions.length);

    let failedCount = transactions.filter(tx => tx.status === "failed").length;
    let completedCount = transactions.filter(tx => tx.status === "completed").length;

    const allTransactionbtn = document.getElementById("allTransactionbtn");
    const successfulTransactionbtn = document.getElementById("successfulTransactionbtn");
    const failedTransactionbtn = document.getElementById("failedTransactionbtn");

    // Format count with leading zero if less than 10
    const formatCount = (count) => count < 10 ? `0${count}` : count;

    allTransactionbtn.textContent = `All ${formatCount(transactions.length)}`;
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

  const copyButton = document.getElementById("copy-button");
  const copyMessage = document.getElementById("copy-message");
  if (copyButton) {
    copyButton.addEventListener("click", () => {
      const fullWalletAddress =
        walletAddressElement.getAttribute("data-full-address"); // Get full address

      if (fullWalletAddress) {
        navigator.clipboard
          .writeText(fullWalletAddress)
          .then(() => {
            copyMessage.style.display = "inline";
            setTimeout(() => {
              copyMessage.style.display = "none";
            }, 1000);
          })
          .catch((err) => {
            console.error("Could not copy text: ", err);
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
  // Logout functionality
  const lockButton = document.getElementById("lock-wallet-btn");
  if (lockButton) {
    lockButton.addEventListener("click", () => {
      const lockModal = new bootstrap.Modal(
        document.getElementById("exampleModal")
      );
      lockModal.show();
      const confirmButton = document.querySelector(".yes-btn");
      confirmButton.addEventListener(
        "click",
        () => {
          lockModal.hide();
          lockWallet();
        },
        { once: true }
      );
    });
  }
});
