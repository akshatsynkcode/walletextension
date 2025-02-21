// scripts.js
document.addEventListener("DOMContentLoaded", function () {

    const currentUrlElement = document.getElementById("current-url-name");
    const faviconImage = document.getElementById("current-site-favicon");
    const defaultWebIcon = "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f310.svg"; // Web icon
    const logoutContainer = document.querySelector(".logout-container");
    const walletInfoText = document.querySelector(".connection-info p");

    // Fetch active tab info
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
            let tabFavicon = tabs[0].favIconUrl || `https://www.google.com/s2/favicons?sz=64&domain=${tabs[0].url}`;

            // Preload favicon to check if it's accessible
            let img = new Image();
            img.src = tabFavicon;
            img.onload = function () {
                faviconImage.src = tabFavicon; // Use tab's favicon if accessible
            };
            img.onerror = function () {
                faviconImage.src = defaultWebIcon; // Use fallback web icon if favicon fails
            };

            // Show the current site URL in the wallet info page
            let url = new URL(tabs[0].url);
            currentUrlElement.textContent = url.hostname;
            chrome.runtime.sendMessage({ action: "checkSession", domain: url.origin }, function (response) {
                if (response && response.authenticated) {
                    // Wallet is connected
                    logoutContainer.style.display = "flex";
                    walletInfoText.innerHTML = "Wallet is connected to this site";
                } else {
                    // Wallet is not connected
                    logoutContainer.style.display = "none";
                    walletInfoText.innerHTML = "Wallet isn’t connected to this site.<br>Find and select the 'Connect Wallet' button.";
                }
            });
        }
    });


    document.getElementById('back-btn').onclick = function() {
        if (window.history.length > 1) {
            window.history.back(); // Go back smoothly without reload
        } else {
            window.location.href = 'popup.html'; // Fallback in case no history exists
        }
    };

    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                
                if (tabs.length === 0) {
                    return;
                }
                
                let activeTab = tabs[0];
                console.log("activeTab",activeTab)
                let domain = new URL(activeTab.url).origin; // Extract domain
                console.log("domain",domain)
                let redirectUrl = domain + "/delete_session"; // Construct redirect URL
                console.log("redirectUrl",redirectUrl)

                
                // Redirect the active tab
                chrome.tabs.update(activeTab.id, { url: redirectUrl });
                window.location.href = 'popup.html';
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    });
});