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
        case 'get_connected_sites':
            sendResponse({ sites: connectedSites });
            break;
        case 'check_login_status':
            checkLoginStatus(sendResponse);
            break;
        case 'login_complete':
            handleLoginComplete();
            break;
        case 'EXTENSION_DATA':
            handleExtensionData(message.data, sendResponse);
            break;
        default:
            console.log("Unknown action:", message.action);
            sendResponse({ success: false, message: "Unknown action." });
    }
    return true; // Keep the message channel open for asynchronous responses
});

// Listener for external messages (from external websites)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    console.log("External message received:", request);

    if (request.action === 'request_connection') {
        console.log("Connection request received from:", sender);
        handleRequestConnection(request, sender, sendResponse);
        return true; // Indicate that sendResponse will be called asynchronously
    } else {
        console.log("Unknown external action:", request.action);
        sendResponse({ success: false, message: "Unknown action." });
    }
});

// Handler for incoming data
function handleExtensionData(data, sendResponse) {
    chrome.storage.local.get(['userInfo'], function(result) {
        if (result.userInfo) {
            isLoggedIn = true;
            chrome.action.setPopup({ popup: "popup.html" });
            sendResponse({ status: 'Already logged in', userInfo: result.userInfo });
        } else {
            chrome.storage.local.set({ userInfo: data }, function() {
                isLoggedIn = true;
                chrome.action.setPopup({ popup: "popup.html" });
                sendResponse({ status: 'Data stored and logged in', userInfo: data });
            });
        }
    });
}

function checkLoginStatus(sendResponse) {
    chrome.storage.local.get(['userInfo'], function(result) {
        if (result.userInfo) {
            sendResponse({ loggedIn: true, userInfo: result.userInfo });
        } else {
            sendResponse({ loggedIn: false });
        }
    });
}

function handleLockWallet(sendResponse) {
    if (fullscreenTabId !== null) {
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
    } else {
        sendResponse({ success: true });
    }
}

function handleUnlockWallet(sendResponse) {
    isLoggedIn = true;
    chrome.action.setPopup({popup: "popup.html"});
    if (!fullscreenTabId) {
        chrome.tabs.create({
            url: chrome.runtime.getURL('profile.html'),
            active: true
        }, (tab) => {
            fullscreenTabId = tab.id;
            console.log("Tab opened:", tab);
        });
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
        url: chrome.runtime.getURL('approval.html'), // approval.html should have the UI for user consent
        type: 'popup',
        width: 400,
        height: 500
    });
}

// Handle approve connection
function handleApproveConnection(message, sendResponse) {
    const approveRequest = pendingRequests.shift(); // Get the first pending request
    if (approveRequest) {
        chrome.storage.local.get(['userInfo', 'authToken'], function(result) {
            if (result.userInfo && result.userInfo.address) {
                // Send the address back to the original request
                approveRequest.responseCallback({ success: true, address: result.userInfo.address, authToken : result.authToken });
                sendResponse({ success: true });
            } else {
                approveRequest.responseCallback({ success: false, message: "No user logged in." });
                sendResponse({ success: false });
            }
        });
    }
}

// Handle reject connection
function handleRejectConnection(message, sendResponse) {
    const rejectRequest = pendingRequests.shift(); // Get the first pending request
    if (rejectRequest) {
        rejectRequest.responseCallback({ success: false, message: "Connection rejected by the user." });
        sendResponse({ success: true });
    }
}

function handleLoginComplete() {
    isLoggedIn = true;
    chrome.action.setPopup({popup: "popup.html"});
    pendingRequests.forEach(callback => callback());
    pendingRequests = [];
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

// Handle action button click
chrome.action.onClicked.addListener(() => {
    if (!isLoggedIn) {
        chrome.tabs.create({url: "login.html"});
    } else {
        chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            type: 'popup',
            width: 400,
            height: 600
        });
    }
});
