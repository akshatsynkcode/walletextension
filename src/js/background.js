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
    }
    return true; // Keep the message channel open for asynchronous responses
});

// Handler for incoming data
function handleExtensionData(data, sendResponse) {
    chrome.storage.local.get(['userInfo'], function(result) {
        if (result.userInfo) {
            // If user info already exists, log in automatically
            isLoggedIn = true;
            chrome.action.setPopup({ popup: "popup.html" }); // Enable popup after login
            sendResponse({ status: 'Already logged in', userInfo: result.userInfo });
        } else {
            // If no user info is found, store the new data and proceed with the login flow
            chrome.storage.local.set({ userInfo: data }, function() {
                isLoggedIn = true;
                chrome.action.setPopup({ popup: "popup.html" }); // Enable popup after login
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
    chrome.action.setPopup({popup: "popup.html"}); // Enable popup after unlocking
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
    chrome.runtime.sendMessage({ action: 'show_connection_request', request });
}

function handleApproveConnection(message, sendResponse) {
    const approveRequest = pendingRequests.find(req => req.tabId === message.requestId);
    if (approveRequest) {
        connectedSites.push(approveRequest.url);
        chrome.tabs.sendMessage(approveRequest.tabId, { action: 'connection_approved' });
        pendingRequests = pendingRequests.filter(req => req.tabId !== message.requestId);
        approveRequest.responseCallback({ success: true });
    }
}

function handleRejectConnection(message, sendResponse) {
    const rejectRequest = pendingRequests.find(req => req.tabId === message.requestId);
    if (rejectRequest) {
        chrome.tabs.sendMessage(rejectRequest.tabId, { action: 'connection_rejected' });
        pendingRequests = pendingRequests.filter(req => req.tabId !== message.requestId);
        rejectRequest.responseCallback({ success: false });
    }
}

function handleLoginComplete() {
    isLoggedIn = true;
    chrome.action.setPopup({popup: "popup.html"}); // Enable popup after login
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
        chrome.tabs.create({url: "login.html"}); // Open login in a new tab if not logged in
    } else {
        chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            type: 'popup',
            width: 400,
            height: 600
        });
    }
});

// External message listener for fetching address
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "getAddress") {
      chrome.storage.local.get('userInfo', function(result) {
        if (result.userInfo && result.userInfo.address) {
          sendResponse({ address: result.userInfo.address });
        } else {
          sendResponse({ error: "No address found" });
        }
      });
      return true; // Keep the message channel open for the response
    }
  }
);
// background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'EXTENSION_DATA') {
        console.log('Data received in background:', request.data);
        // Handle the received data here
        sendResponse({ status: 'Data received successfully', receivedData: request.data });
    }
});
