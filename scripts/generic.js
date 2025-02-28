// // Redirect to login if no token or token is invalid
export function redirectToLogin() {
    chrome.storage.sync.remove(['authToken', 'connectedSites', 'email']);
    window.location.href = 'login.html';
}

// Function to hide the full screen loader
export function hideFullScreenLoader() {
    const loader = document.getElementById('full-screen-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Function to show the full screen loader
export function showFullScreenLoader() {
    const loader = document.getElementById('full-screen-loader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

// Function to load Navbar, Sidebar & Logout Modal dynamically
export async function loadLayoutComponents() {
    let sidebarContainer = document.getElementById("sidebar-container");
    await Promise.all([
        fetch('navbar.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('navbar-container').innerHTML = html;
            }),

        fetch("sidebar.html")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                sidebarContainer.innerHTML = data;

                // Now dynamically highlight the active menu item
                let currentPage = window.location.pathname.split("/").pop();

                let links = {
                    "profile.html": "dashboard-link",
                    "transactions.html": "transactions-link",
                    "connectedSites.html": "linked-sites-link",
                    "settings.html": "settings-link",
                    "help.html": "help-link"
                };

                document.querySelectorAll(".nav-link").forEach(link => {
                    link.classList.remove("active");
                    let arrow = link.querySelector(".arrow-icon");
                    if (arrow) arrow.style.display = "none";
                });

                if (links[currentPage]) {
                    let activeLink = document.getElementById(links[currentPage]);
                    if (activeLink) {
                        activeLink.classList.add("active");
                        let arrow = activeLink.querySelector(".arrow-icon");
                        if (arrow) arrow.style.display = "block";
                    }
                }
            })
            .catch(error => console.error("Error loading sidebar:", error)),

        // Fetch and inject Logout Modal
        fetch("logout-modal.html")
            .then(response => response.text())
            .then(html => {
                document.body.insertAdjacentHTML("beforeend", html);
            })
            .catch(error => console.error("Error loading logout modal:", error))
    ]);
}


// Function to truncate the wallet address
export function truncateWalletAddress(walletAddress, startChars = 6, endChars = 6, separator = '.......') {
    if (!walletAddress || walletAddress.length <= startChars + endChars) {
        return walletAddress; // Return the full address if it's too short to truncate
    }
    return `${walletAddress.substring(0, startChars)}${separator}${walletAddress.substring(walletAddress.length - endChars)}`;
}

// Lock wallet and redirect to a specified page
async function lockWallet(redirectUrl = 'login.html') {
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
                            window.location.href = redirectUrl; // Redirect based on the parameter
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

/**
 * Function for handling the logout
 */
export function handleLogout(redirectUrl = 'login.html') {
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
            });
            confirmButton.addEventListener('click', () => {
                lockModal.hide();
                lockWallet(redirectUrl); // Pass the redirect URL to lockWallet()
            }, { once: true });
        });
    }
}

/**
 * Function for handling copy wallet address
 */
export function handleCopyWalletAddress() {
    const copyButton = document.getElementById('copy-button');
    const copyMessage = document.getElementById('copy-message');
    const walletAddressElement = document.getElementById('wallet-address');

    if (copyButton && walletAddressElement) {
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
}

