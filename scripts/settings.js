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

    console.log(authToken, "authToken");

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
            console.log(data);
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

document.addEventListener("DOMContentLoaded", function () {
    let button = document.getElementById("submitBtn");

    if (!button) {
        return;
    }

    button.addEventListener("click", function () {
        alert("Your query has been submitted successfully.");
    });
});
