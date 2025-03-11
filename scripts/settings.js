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

// Event listener for DOM content loading
document.addEventListener('DOMContentLoaded', async () => {
    showFullScreenLoader();
    await loadLayoutComponents();
    attachSidebarClickPrevention();
    const data = await new Promise((resolve) =>
        chrome.storage.sync.get("authToken", resolve)
    );
    const authToken = data.authToken;

    if (!authToken) {
        redirectToLogin();
        return;
    }

    const usernameElement = document.getElementById("username");
    const walletAddressElement = document.getElementById("wallet-address");
    const emailElement = document.getElementById("email");

    handleCopyWalletAddress();

    if (usernameElement && walletAddressElement) {
        // Fetch and update profile
        const updatedProfile = await fetchUpdatedUserProfile();
        if (updatedProfile) {
            const { fullName, walletAddress, email } = updatedProfile;

            walletAddressElement.setAttribute("data-full-address", walletAddress);
            walletAddressElement.textContent = truncateWalletAddress(walletAddress) || "Guest";
            usernameElement.textContent = fullName || "N/A";
            emailElement.textContent = email || "N/A";

            // Fetch and replace stored icon
            await updateUserIcon();
        }
    }
    pageLoaded = true;
    hideFullScreenLoader();
    // Logout functionality
    handleLogout();
});

// Fetch updated user profile
async function fetchUpdatedUserProfile() {
    showFullScreenLoader();
    try {
        const data = await new Promise((resolve) =>
            chrome.storage.sync.get("authToken", resolve)
        );
        const authToken = data.authToken;

        if (!authToken) {
            console.error("Authorization token is missing");
            redirectToLogin();
            hideFullScreenLoader();
            return;
        }

        const response = await fetch("https://dev-wallet-api.dubaicustoms.network/api/ext-profile", {
            method: "GET",
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.ok) {
            const data = await response.json();
            hideFullScreenLoader();
            return data;
        } else if (response.status === 401) {
            console.error("Token expired or invalid, redirecting to login.");
            redirectToLogin();
        } else {
            console.error("Failed to fetch user profile:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
    } finally {
        hideFullScreenLoader();
    }
}

async function sendMessage() {
    
    try {
        const authToken = await chrome.storage.sync.get('authToken');
        if (!authToken || !authToken.authToken) {
            console.error('Authorization token is missing');
            redirectToLogin(); // Redirect or handle the missing token case
            return;
        }

        const message = document.getElementById("queryInput").value;
        if (!message) {
            alert("Please enter a message.");
            return;
        }

        const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/send-message-email/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken.authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "message": message })
        });

        if (response.ok) {
            const contentType = response.headers.get('Content-Type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text(); // handle non-JSON response
            }

            console.log("Message sent:", data);
            document.getElementById("queryInput").value = ""; // Clear the message input after success.
            document.getElementById("modalMessage").innerText = "Your query has been successfully submitted. Thank you for reaching out.";
            const modalElement = document.getElementById('exampleModal2');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            const errorData = await response.json();
            console.error("Error sending message:", errorData);
            alert("Failed to send message. Please try again.");
        }
    } catch (error) {
        console.error("Error during message send:", error);
        alert("An error occurred while sending the message. Please try again later.");
    }
}

// Attach event listener to the Submit button after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.addEventListener("click", sendMessage);  // Trigger the sendMessage function when clicked
    }
});
