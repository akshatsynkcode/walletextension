// Store the ID of the fullscreen tab
let fullscreenTabId = null;
let pendingRequests = [];
let connectedSites = [];
let isLoggedIn = false; // Flag to indicate login status

// Listener for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received:", message); // Debugging log

    switch (message.action) {
        case 'lock_wallet':
            handleLockWallet(sendResponse);
            break;
        case 'unlock_wallet':
            handleUnlockWallet(sendResponse);
            break;
        case 'request_connection':
            handleRequestConnection(message, sender, sendResponse);
            break;
        case 'approve_connection':
            handleApproveConnection(message, sendResponse);
            break;
        case 'reject_connection':
            handleRejectConnection(message, sendResponse);
            break;
    }
    return true; // Keep the message channel open for asynchronous responses
});

// Listener for extension installation
function handleLockWallet(sendResponse) {
    if (fullscreenTabId !== null) {
        chrome.tabs.get(fullscreenTabId, function(tab) {
            if (chrome.runtime.lastError || !tab) {
                // If tab doesn't exist, reset the fullscreenTabId
                fullscreenTabId = null;
                isLoggedIn = false;
                chrome.action.setPopup({popup: "popup-login.html"});
                sendResponse({ success: true });
            } else {
                chrome.tabs.remove(fullscreenTabId, () => {
                    if (chrome.runtime.lastError) {
                        console.log('Error closing tab:', chrome.runtime.lastError);
                        sendResponse({ success: false });
                    } else {
                        fullscreenTabId = null;
                        isLoggedIn = false;
                        chrome.action.setPopup({popup: "popup-login.html"});
                        sendResponse({ success: true });
                    }
                });
            }
        });
    } else {
        sendResponse({ success: true });
    }
}

function handleUnlockWallet(sendResponse) {
    isLoggedIn = true;
    chrome.action.setPopup({popup: "popup.html"}); // Enable popup after unlocking
    if (!fullscreenTabId) {
        chrome.tabs.create({
            url: chrome.runtime.getURL('profile.html'),
            active: true
        }, (tab) => {
            if (tab && tab.id) {
                fullscreenTabId = tab.id; // Ensure the tab ID is stored
                console.log("Tab opened:", tab);
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false });
                console.error("Failed to create the tab");
            }
        });
    } else {
        sendResponse({ success: true });
    }
}

function handleRequestConnection(message, sender, sendResponse) {
    const request = {
        tabId: sender.tab.id,
        url: sender.tab.url,
        responseCallback: sendResponse
    };
    pendingRequests.push(request);

    // Open the approval popup
    chrome.windows.create({
        url: chrome.runtime.getURL('connect-wallet.html'), // approval.html should have the UI for user consent
        type: 'popup',
        width: 400,
        height: 600
    });
}

function handleApproveConnection(message, sendResponse) {
    const approveRequest = pendingRequests.shift(); // Get the first pending request
    if (approveRequest) {
        chrome.storage.sync.get(['authToken'], function(result) {
            if (result.authToken) {
                // Send the address back to the original request
                approveRequest.responseCallback({ success: true, authToken : result.authToken });
                sendResponse({ success: true });
            } else {
                approveRequest.responseCallback({ success: false, message: "No user logged in." });
                sendResponse({ success: false });
            }
        });
    }
}

function handleRejectConnection(message, sendResponse) {
    const rejectRequest = pendingRequests.shift(); // Get the first pending request
    if (rejectRequest) {
        rejectRequest.responseCallback({ success: false, message: "Connection rejected by the user." });
        sendResponse({ success: true });
    }
}

// Listener for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html'),
            active: true
        }, (tab) => {
            fullscreenTabId = tab.id;
        });
    }
});
