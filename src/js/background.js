// Store the ID of the fullscreen tab
let fullscreenTabId = null;
let pendingRequests = [];
let connectedSites = [];

// Flag to indicate login status
let isLoggedIn = false;

// Listener for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received:", message); // Debugging log

    switch (message.action) {
        case 'lock_wallet':
            // Close the full-screen tab if open
            if (fullscreenTabId !== null) {
                chrome.tabs.remove(fullscreenTabId, () => {
                    if (chrome.runtime.lastError) {
                        console.log('Error closing tab:', chrome.runtime.lastError);
                        sendResponse({ success: false });
                    } else {
                        fullscreenTabId = null; // Reset the fullscreenTabId
                        sendResponse({ success: true });
                    }
                });
            } else {
                sendResponse({ success: true }); // No tab to close, but lock successful
            }
            return true; // Indicate that the response is asynchronous

        case 'unlock_wallet':
            if (fullscreenTabId !== null) {
                chrome.tabs.create({
                    url: chrome.runtime.getURL('profile.html'),
                    active: true
                }, (tab) => {
                    fullscreenTabId = tab.id;
                    console.log("Tab opened:", tab); // Debugging log
                });
            }
            break;

        case 'request_connection':
            // Handle connection requests from dApps
            const request = {
                tabId: sender.tab.id,
                url: sender.tab.url,
                responseCallback: sendResponse
            };
            pendingRequests.push(request);
            chrome.runtime.sendMessage({ action: 'show_connection_request', request });
            return true; // Indicate async response

        case 'approve_connection':
            const approveRequest = pendingRequests.find(req => req.tabId === message.requestId);
            if (approveRequest) {
                connectedSites.push(approveRequest.url);
                chrome.tabs.sendMessage(approveRequest.tabId, { action: 'connection_approved' });
                pendingRequests = pendingRequests.filter(req => req.tabId !== message.requestId);
                approveRequest.responseCallback({ success: true });
            }
            break;

        case 'reject_connection':
            const rejectRequest = pendingRequests.find(req => req.tabId === message.requestId);
            if (rejectRequest) {
                chrome.tabs.sendMessage(rejectRequest.tabId, { action: 'connection_rejected' });
                pendingRequests = pendingRequests.filter(req => req.tabId !== message.requestId);
                rejectRequest.responseCallback({ success: false });
            }
            break;

        case 'get_connected_sites':
            sendResponse({ sites: connectedSites });
            return true; // Indicate async response

        case 'check_login_status':
            sendResponse({ loggedIn: isLoggedIn });
            return true; // Indicate async response

        case 'login_complete':
            isLoggedIn = true;
            if (pendingRequests.length > 0) {
                pendingRequests.forEach(callback => callback());
                pendingRequests = [];
            }
            break;
    }
});

// Listener for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log("Extension installed:", details); // Debugging log
    if (details.reason === 'install') {
        // Open a new tab on extension installation
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html'),
            active: true
        }, (tab) => {
            fullscreenTabId = tab.id;
            console.log("New tab created:", tab); // Debugging log
        });
    }
});

// Handle action button click
chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get(['userInfo'], (result) => {
        if (result.userInfo) {
            if (isLoggedIn) {
                // User is logged in; open the popup.html
                chrome.windows.create({
                    url: chrome.runtime.getURL('popup.html'),
                    type: 'popup',
                    width: 400,
                    height: 600
                });
            } else {
                // User is not logged in; show a notification instead
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Login Required',
                    message: 'Please complete the full-screen login before accessing the wallet.'
                });
            }
        } else {
            // No user info; show notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Login Required',
                message: 'Please complete the full-screen login before accessing the wallet.'
            });
        }
    });
});
