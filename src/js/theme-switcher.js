document.addEventListener('DOMContentLoaded', function() {
    const themeStylesheet = document.getElementById('theme-stylesheet');
    const lightThemeRadio = document.getElementById('light-theme');
    const darkThemeRadio = document.getElementById('dark-theme');
    
    const savedTheme = localStorage.getItem('theme') || 'light';

    function setTheme(theme) {
        if(theme === 'dark') {
            themeStylesheet.href = './css/style-dark.css';
            if (darkThemeRadio) darkThemeRadio.checked = true;
        } else {
            themeStylesheet.href = './css/style.css';
            if (lightThemeRadio) lightThemeRadio.checked = true;
        }
        localStorage.setItem('theme', theme);
    }

    if (lightThemeRadio) {
        lightThemeRadio.addEventListener('change', () => setTheme('light'));
    }
    if (darkThemeRadio) {
        darkThemeRadio.addEventListener('change', () => setTheme('dark'));
    }

    setTheme(savedTheme);

    const icons = document.querySelectorAll(".parent img");

    icons.forEach(icon => {
        icon.addEventListener("click", function () {
            const iconId = this.getAttribute("data-id"); // Get clicked icon ID
            const iconSrc = this.getAttribute("src"); // Get icon src

            // Send message to background.js to store clicked icon
            chrome.runtime.sendMessage({
                action: "storeClickedIcon",
                icon: { id: iconId, src: iconSrc }
            }, (response) => {
                if (response?.success) {
                    console.log(`Icon ${iconId} stored successfully.`);

                    // **Update the profile picture immediately**
                    let userIconElement = document.querySelector(".user-icon");

                    if (userIconElement) {
                        let userIconImg = document.createElement("img");
                        userIconImg.src = iconSrc;
                        userIconImg.alt = "User Icon";
                        userIconImg.className = "rounded-circle";
                        userIconImg.style.width = "40px";
                        userIconImg.style.height = "40px";

                        // Replace the existing icon with the new image
                        userIconElement.replaceWith(userIconImg);
                    }
                }
            });
        });
    });
});

async function fetchStoredIcon() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getStoredIcon" }, (response) => {
            if (response?.success && response.icon) {
                resolve(response.icon);
            } else {
                resolve(null);
            }
        });
    });
}

// Event listener for DOM content loading
document.addEventListener("DOMContentLoaded", async () => {
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
    const balanceElement = document.getElementById("balance");
    const emailElement = document.getElementById("email");
    const copyButton = document.getElementById("copy-button");
    const copyMessage = document.getElementById("copy-message");

    // Copy Wallet Address
    if (copyButton) {
        copyButton.addEventListener("click", () => {
            const fullWalletAddress = walletAddressElement?.getAttribute("data-full-address"); 

            if (fullWalletAddress) {
                navigator.clipboard.writeText(fullWalletAddress)
                    .then(() => {
                        copyMessage.style.display = "inline";
                        setTimeout(() => {
                            copyMessage.style.display = "none";
                        }, 1000);
                    })
                    .catch((err) => console.error("Could not copy text: ", err));
            }
        });
    }

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
            const storedIcon = await fetchStoredIcon();
            if (storedIcon) {
                const userIconElement = document.querySelector(".user-icon");

                if (userIconElement) {
                    let userIconImg = document.createElement("img");
                    userIconImg.src = storedIcon.src;
                    userIconImg.alt = "User Icon";
                    userIconImg.className = "rounded-circle";
                    userIconImg.style.width = "40px";
                    userIconImg.style.height = "40px";

                    userIconElement.replaceWith(userIconImg);
                }
            }
        }
    }

    // Logout functionality
    const lockButton = document.getElementById("lock-wallet-btn");
    if (lockButton) {
        lockButton.addEventListener("click", () => {
            const lockModal = new bootstrap.Modal(document.getElementById("exampleModal"));
            lockModal.show();

            const confirmButton = document.querySelector(".yes-btn");
            const cancelButton = document.querySelector(".no-btn");

            // Fix issue with modal not closing properly
            cancelButton.addEventListener("click", () => {
                const modalElement = document.getElementById("exampleModal");
                modalElement.addEventListener("hidden.bs.modal", function () {
                    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.remove());
                    document.body.classList.remove("modal-open");
                });
            });

            confirmButton.addEventListener("click", () => {
                lockModal.hide();
                lockWallet();
            }, { once: true });
        });
    }
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

// Function to show the full screen loader
function showFullScreenLoader() {
    document.getElementById("full-screen-loader").style.display = "flex";
}

// Function to hide the full screen loader
function hideFullScreenLoader() {
    document.getElementById("full-screen-loader").style.display = "none";
}

// Redirect to login
function redirectToLogin() {
    chrome.storage.sync.remove(["authToken", "connectedSites", "email"]);
    window.location.href = "login.html";
}

// Function to truncate wallet address
function truncateWalletAddress(walletAddress, startChars = 6, endChars = 6, separator = ".......") {
    if (!walletAddress || walletAddress.length <= startChars + endChars) {
        return walletAddress; 
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