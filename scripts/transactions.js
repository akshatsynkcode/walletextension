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

async function fetchAndUpdateTransactionHistory() {
  const { authToken } = await chrome.storage.sync.get("authToken");
  if (!authToken) {
    console.error("Authorization token is missing");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(
      `https://dev-wallet-api.dubaicustoms.network/api/ext-transaction`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.error("Token expired or invalid, redirecting to login.");
        redirectToLogin();
      } else {
        console.error(
          "Failed to fetch transaction history:",
          response.statusText
        );
      }
      return;
    }

    const result = await response.json();
    if (result.status === "success") {
      const transactions = result.data;
      console.log(transactions, "transactions");
      const tableBody = document.querySelector(".custom-table tbody");
      tableBody.innerHTML = ""; // Clear previous data

      const out_transaction_img = "./icons/withdrawal.svg";
      const in_transaction_img = "./icons/deposit.svg";

      transactions.forEach((transaction) => {
        const row = document.createElement("tr");
        row.classList.add("border-bottom");

        row.innerHTML = `
                    <td class="px-3">
                        <div class="form-check">
                            <input class="form-check-input mx-1 bg-transparent border border-white fs-6" type="checkbox">
                        </div>
                    </td>
                    <td>
                        <span class="d-flex align-items-center">
                            <div style="width: max-content;">
                                <img src="${
                                  transaction.debit
                                    ? out_transaction_img
                                    : in_transaction_img
                                }" alt="" class="img-fluid type-img">
                            </div>
                            <div class="ms-4">
                                <p class="text-truncate mb-2 font-14">${
                                  transaction.debit
                                    ? truncateWalletAddress(
                                        transaction.to_wallet_address
                                      )
                                    : truncateWalletAddress(
                                        transaction.from_wallet_address
                                      )
                                }</p>
                                <span class="text-gray-600 font-12">From: ${
                                  transaction.created_at_time
                                }</span>
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
                    <td class="px-3">
                        <div class="position-relative">
                            <span class="${
                              transaction.status === "completed"
                                ? "span-success"
                                : "span-danger"
                            }"></span> ${transaction.status}
                        </div>
                    </td>
                    <td class="px-3">
                        <p class="mb-2">${
                          transaction.module_id === "Top up wallet"
                            ? "Bank Transfer"
                            : "Wallet Transfer"
                        }</p>
                        <span class="text-truncate text-gray-600 font-12">${
                          truncateWalletAddress(transaction.extrinsic_hash) ||
                          "N/A"
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
    } else {
      console.error("Transaction fetch failed:", result);
    }
  } catch (error) {
    console.error("Error fetching transaction history:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
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

    // Fetch transaction history
    await fetchAndUpdateTransactionHistory();

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
