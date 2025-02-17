function showFullScreenLoader() {
  document.getElementById('full-screen-loader').style.display = 'flex';
}

// Hide the full-screen loader
function hideFullScreenLoader() {
  document.getElementById('full-screen-loader').style.display = 'none';
}
function redirectToLogin() {
  chrome.storage.sync.remove(["authToken", "connectedSites", "authIV"]);
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

  const { authIV } = await chrome.storage.sync.get("authIV");
  const decryptedAuthToken = await decryptText(authToken, authIV);
  try {
    const response = await fetch(
      "https://dev-wallet-api.dubaicustoms.network/api/ext-logout",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${decryptedAuthToken}` },
      }
    );
    console.log(response);
    if (response.ok) {
      const data = await response.json();
      if (data.message === "Successfully Logged Out") {
        chrome.storage.sync.remove(["authToken", "connectedSites","authIV"], () => {
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
      alert("Logout failed. Please try again. ");
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
    const { authIV } = await chrome.storage.sync.get("authIV");
    if (!authToken) {
      console.error("Authorization token is missing");
      redirectToLogin();
      return;
    }

    const decryptedAuthToken = await decryptText(authToken, authIV);
    const response = await fetch(
      "https://dev-wallet-api.dubaicustoms.network/api/ext-profile",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${decryptedAuthToken}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 404) {
      console.error("Token expired or invalid, redirecting to login.");
      redirectToLogin();
    } else {
      console.error("Failed to fetch user profile :", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}

async function fetchAndUpdateTransactionHistory(selectedText = "All Time", page=1) {
  pageSize = 7

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

      const { authIV } = await chrome.storage.sync.get("authIV");
      const decryptedAuthToken = await decryptText(authToken, authIV);
      const response = await fetch(
          `https://dev-wallet-api.dubaicustoms.network/api/ext-transaction?start_date=${startDate}&end_date=${endDate}&page_size=${pageSize}&page=${page}`,
          {
              method: "GET",
              headers: {
                  "Authorization": `Bearer ${decryptedAuthToken}`,
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
    // function displayTransactions(filterType = "all") {
    //     tableBody.innerHTML = ""; // Clear previous data

    //     const filteredTransactions = transactions.filter(transaction => {
    //         if (filterType === "completed") return transaction.status === "completed";
    //         if (filterType === "failed") return transaction.status === "failed";
    //         return true; // Show all if filter is "all"
    //     });

    //     filteredTransactions.forEach(transaction => {
    //         const row = document.createElement("tr");
    //         row.classList.add("border-bottom");

    //         row.innerHTML = `
    //             <td>
    //                 <span class="d-flex align-items-center">
    //                     <div style="width: max-content;">
    //                         <img src="${
    //                           transaction.debit ? "./icons/withdrawal.svg" : "./icons/deposit.svg"
    //                         }" alt="" class="img-fluid type-img">
    //                     </div>
    //                     <div class="ms-4">
    //                         <p class="text-truncate mb-2 font-14">${
    //                           transaction.debit
    //                             ? truncateWalletAddress(transaction.to_wallet_address)
    //                             : truncateWalletAddress(transaction.from_wallet_address)
    //                         }</p>
    //                         <span class="text-gray-600 font-12">From: ${new Date(
    //                           transaction.created_at
    //                         ).toLocaleString()}</span>
    //                     </div>
    //                 </span>
    //             </td>
    //             <td class="${transaction.debit ? "text-danger" : "text-success"} px-3">
    //                 ${transaction.debit ? "-" : "+"} AED ${transaction.amount}
    //             </td>
    //             <td class="px-3">
    //                 <div class="position-relative">
    //                     <span class="${
    //                       transaction.status === "completed" ? "span-success" : "span-danger"
    //                     }"></span> ${transaction.status}
    //                 </div>
    //             </td>
    //             <td class="px-3">
    //                 <p class="mb-2">${
    //                   transaction.module_id === "Top up wallet" ? "Bank Transfer" : "Wallet Transfer"
    //                 }</p>
    //                 <span class="text-truncate text-gray-600 font-12">${
    //                   truncateWalletAddress(transaction.extrinsic_hash) || "N/A"
    //                 }</span>
    //             </td>
    //             <td class="px-3">
    //                 <div class="d-flex align-items-center">
    //                     <span class="status-indicator span-department"></span>
    //                     ${transaction.module_type || "N/A"}
    //                 </div>
    //             </td>
    //             <td class="px-3">
    //                 <span class="text-truncate font-12">${new Date(
    //                   transaction.created_at
    //                 ).toLocaleString()}</span>
    //             </td>
    //         `;

    //         tableBody.appendChild(row);
    //     });
    // }

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
  
          // Create the first cell
          const cell1 = document.createElement("td");
          const span1 = document.createElement("span");
          span1.classList.add("d-flex", "align-items-center");
  
          const div1 = document.createElement("div");
          div1.style.width = "max-content";
          const img = document.createElement("img");
          img.src = transaction.debit ? "./icons/withdrawal.svg" : "./icons/deposit.svg";
          img.alt = "";
          img.classList.add("img-fluid", "type-img");
          div1.appendChild(img);
  
          const div2 = document.createElement("div");
          div2.classList.add("ms-4");
          const p = document.createElement("p");
          p.classList.add("text-truncate", "mb-2", "font-14");
          p.textContent = transaction.debit
              ? truncateWalletAddress(transaction.to_wallet_address)
              : truncateWalletAddress(transaction.from_wallet_address);
          const span2 = document.createElement("span");
          span2.classList.add("text-gray-600", "font-12");
          span2.textContent = `From: ${new Date(transaction.created_at).toLocaleString()}`;
          div2.appendChild(p);
          div2.appendChild(span2);
  
          span1.appendChild(div1);
          span1.appendChild(div2);
          cell1.appendChild(span1);
          row.appendChild(cell1);
  
          // Create the second cell
          const cell2 = document.createElement("td");
          cell2.classList.add(transaction.debit ? "text-danger" : "text-success", "px-3");
          cell2.textContent = `${transaction.debit ? "-" : "+"} AED ${transaction.amount}`;
          row.appendChild(cell2);
  
          // Create the third cell
          const cell3 = document.createElement("td");
          cell3.classList.add("px-3");
          const div3 = document.createElement("div");
          div3.classList.add("position-relative");
          const span3 = document.createElement("span");
          span3.classList.add(transaction.status === "completed" ? "span-success" : "span-danger");
          div3.appendChild(span3);
          div3.appendChild(document.createTextNode(` ${transaction.status}`));
          cell3.appendChild(div3);
          row.appendChild(cell3);
  
          // Create the fourth cell
          const cell4 = document.createElement("td");
          cell4.classList.add("px-3");
          const p2 = document.createElement("p");
          p2.classList.add("mb-2");
          p2.textContent = transaction.module_id === "Top up wallet" ? "Bank Transfer" : "Wallet Transfer";
          const span4 = document.createElement("span");
          span4.classList.add("text-truncate", "text-gray-600", "font-12");
          span4.textContent = truncateWalletAddress(transaction.extrinsic_hash) || "N/A";
          cell4.appendChild(p2);
          cell4.appendChild(span4);
          row.appendChild(cell4);
  
          // Create the fifth cell
          const cell5 = document.createElement("td");
          cell5.classList.add("px-3");
          const div4 = document.createElement("div");
          div4.classList.add("d-flex", "align-items-center");
          const span5 = document.createElement("span");
          span5.classList.add("status-indicator", "span-department");
          div4.appendChild(span5);
          div4.appendChild(document.createTextNode(` ${transaction.module_type || "N/A"}`));
          cell5.appendChild(div4);
          row.appendChild(cell5);
  
          // Create the sixth cell
          const cell6 = document.createElement("td");
          cell6.classList.add("px-3");
          const span6 = document.createElement("span");
          span6.classList.add("text-truncate", "font-12");
          span6.textContent = new Date(transaction.created_at).toLocaleString();
          cell6.appendChild(span6);
          row.appendChild(cell6);
  
          // Append the row to the table body
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
      const cancelButton = document.querySelector('.no-btn');
            cancelButton.addEventListener('click', () => {
                const modalElement = document.getElementById("exampleModal"); // Replace with your modal ID
                modalElement.addEventListener("hidden.bs.modal", function () {
                    document.querySelectorAll(".modal-backdrop").forEach(backdrop => backdrop.remove());
                    document.body.classList.remove("modal-open"); // Ensure scrolling is re-enabled
                });
            })
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
