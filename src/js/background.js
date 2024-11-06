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
        case 'approve_connection':
            handleApproveConnection(message, sendResponse);
            break;
        case 'reject_connection':
            handleRejectConnection(message, sendResponse);
            break;
        case 'approve_transaction':
            handleApproveTransaction(message, sendResponse);
            break;
        case 'reject_transaction':
            handleRejectTransaction(message, sendResponse);
            break;
    }
    return true; // Keep the message channel open for asynchronous responses
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('External message received:', message); // Log the received message
    if (message.action === 'request_connection') {
        console.log('Handling request connection...');
        handleRequestConnection(sender, sendResponse);
    } else if (message.action === 'detect_extension') {
        console.log('Detect extension message received');
        sendResponse({ success: true });
    }
    else if (message.action === 'transaction_request') {
        // Extract transaction details
        const { toAddress, amount, fromAddress, transaction_id, username, url } = message;
        // Optionally, you could validate the data here
        console.log("url is this", url);
        if (!toAddress || !amount || !fromAddress || !transaction_id || !username || !url) {
            sendResponse({ success: false, message: 'Invalid transaction data' });
            return;
        }
        chrome.storage.sync.set({ username, transaction_id, fromAddress, toAddress, amount, url });
        // Now, open the internal approveReq.html page for user approval
        chrome.windows.create({
            url: chrome.runtime.getURL('approve-req.html'),
            type: 'popup',
            width: 340,
            height: 570
        });
    }
    else if (message.action === 'check_auth') {
        chrome.storage.sync.get(['authToken'], (result) => {
            sendResponse({ success: true, authToken: result.authToken });
        });
    }
    else {
        console.warn('Unknown action received:', message.action);
        sendResponse({ success: false, error: 'Unknown action' });
    }
    return true;
});

// Handle approving the transaction
async function handleApproveTransaction(message, sendResponse) {

    const { authToken, status, transaction_id } = message.transaction;
    console.log("transaction_id", transaction_id, "authToken", authToken, "status", status);
    const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-transaction', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status:status, transaction_id: transaction_id })

    });
    console.log("id to body data",JSON.stringify({ status:status, transaction_id: transaction_id }));
    console.log(response, "response");
    if (response.status == 200) {
        chrome.storage.sync.remove(['transaction_id', 'username', 'fromAddress', 'toAddress', 'amount', 'url']);
        sendResponse({ success: true,  message : response.message });
    } else {
        sendResponse({ success: false , message : response.message});
    }
}

// Handle rejecting the transaction
function handleRejectTransaction(message, sendResponse) {
    const { status, transaction_id, authToken } = message.transaction;

    const response = fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-transaction', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status, transaction_id: transaction_id })
    });
    if (response.ok) {
        chrome.storage.sync.remove(['transaction_id', 'username', 'fromAddress', 'toAddress', 'amount', 'url']);
        sendResponse({ success: true });
    } else {
        sendResponse({ success: false });
    }
}


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

function handleRequestConnection(sender, sendResponse) {
    const request = {
        tabId: sender.tab.id,
        responseCallback: sendResponse
    };
    pendingRequests.push(request);

    chrome.storage.sync.get(['authToken'], function(result) {
        if (result.authToken) {
            const authToken = result.authToken;

            fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .then(data => {
                const fullName = data.fullName;
                const walletAddress = data.walletAddress;

                // Store data in Chrome storage
                chrome.storage.sync.set({ fullName, walletAddress }, function() {
                    chrome.windows.create({
                        url: chrome.runtime.getURL(`connectWallet.html`), // No data passed
                        type: 'popup',
                        width: 330,
                        height: 560
                    });
                });
            })
            .catch(error => {
                console.error('Fetch error:', error);
                sendResponse({ success: false, error: error.message });
            });
        } else {
            chrome.tabs.create({
                url: chrome.runtime.getURL('login.html'),
                active: true
            }, (tab) => {
                fullscreenTabId = tab.id;
            });
        }
    });

    return true;
}



function handleApproveConnection(message, sendResponse) {
    const approveRequest = pendingRequests.shift(); // Get the first pending request
    if (approveRequest) {
        chrome.storage.sync.get(['authToken'], function(result) {
            if (result.authToken) {
                // Send the address back to the original request
                approveRequest.responseCallback({ success: true, authToken : result.authToken });
                chrome.storage.sync.remove(['fullName', 'walletAddress']);
                sendResponse({ success: true, authToken : result.authToken });
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
        chrome.storage.sync.remove(['fullName', 'walletAddress']);
        sendResponse({ success: true });
    }
}

// Listener for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details);
    console.log('Reason:');
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html'),
            active: true
        }, (tab) => {
            fullscreenTabId = tab.id;
        });
    }
});
