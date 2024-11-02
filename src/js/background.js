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
        default:
            console.warn('Unknown action:', message.action);
            sendResponse({ success: false, error: 'Unknown action' });
            break;
    }
    return true; // Keep the message channel open for asynchronous responses
});

// Listener for external messages from an external webpage
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('External message received:', message); // Log the received message

    if (message.action === 'request_connection') {
        console.log('Handling request connection...');
        handleRequestConnection(sender, sendResponse);
    } else if (message.action === 'detect_extension') {
        console.log('Detect extension message received');
        sendResponse({ success: true });
    } else {
        console.warn('Unknown action received:', message.action);
        sendResponse({ success: false, error: 'Unknown action' });
    }

    return true;
});

function handleRequestConnection(sender, sendResponse) {
    const request = {
        tabId: sender.tab.id,
        responseCallback: sendResponse
    };
    pendingRequests.push(request);

    chrome.storage.sync.get(['authToken'], function (result) {
        if (result.authToken) {
            const authToken = result.authToken;

            fetch('https://wallet-api.dubaicustoms.network/api/ext-profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    const fullName = data.fullName;
                    const walletAddress = data.walletAddress;

                    // Store data in Chrome storage
                    chrome.storage.sync.set({ fullName, walletAddress }, () => {
                        sendResponse({
                            success: true,
                            authToken: authToken,
                            fullName: fullName,
                            walletAddress: walletAddress
                        });
                    });
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                    sendResponse({ success: false, error: error.message });
                });
        } else {
            sendResponse({ success: false, error: 'No auth token found' });
        }
    });

    return true;
}

// Handle approving the transaction
async function handleApproveTransaction(message, sendResponse) {
    const { authToken, status, transaction_id } = message.transaction;

    try {
        const response = await fetch('https://wallet-api.dubaicustoms.network/api/ext-transaction', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ status, transaction_id })
        });

        if (response.status === 200) {
            chrome.storage.sync.remove(['transaction_id', 'username', 'fromAddress', 'toAddress', 'amount']);
            sendResponse({ success: true, message: 'Transaction approved successfully.' });
        } else {
            const data = await response.json();
            sendResponse({ success: false, message: data.message || 'Transaction approval failed.' });
        }
    } catch (error) {
        console.error('Error approving transaction:', error);
        sendResponse({ success: false, message: error.message });
    }
}

// Handle rejecting the transaction
function handleRejectTransaction(message, sendResponse) {
    const { status, transaction_id, authToken } = message.transaction;

    fetch('https://wallet-api.dubaicustoms.network/api/ext-transaction', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status, transaction_id })
    })
        .then(response => {
            if (response.ok) {
                chrome.storage.sync.remove(['transaction_id', 'username', 'fromAddress', 'toAddress', 'amount']);
                sendResponse({ success: true, message: 'Transaction rejected successfully.' });
            } else {
                return response.json().then(data => {
                    sendResponse({ success: false, message: data.message || 'Transaction rejection failed.' });
                });
            }
        })
        .catch(error => {
            console.error('Error rejecting transaction:', error);
            sendResponse({ success: false, message: error.message });
        });
}

// Handle wallet lock
function handleLockWallet(sendResponse) {
    if (fullscreenTabId !== null) {
        chrome.tabs.get(fullscreenTabId, (tab) => {
            if (chrome.runtime.lastError || !tab) {
                fullscreenTabId = null;
                isLoggedIn = false;
                chrome.action.setPopup({ popup: "popup-login.html" });
                sendResponse({ success: true });
            } else {
                chrome.tabs.remove(fullscreenTabId, () => {
                    if (chrome.runtime.lastError) {
                        console.log('Error closing tab:', chrome.runtime.lastError);
                        sendResponse({ success: false });
                    } else {
                        fullscreenTabId = null;
                        isLoggedIn = false;
                        chrome.action.setPopup({ popup: "popup-login.html" });
                        sendResponse({ success: true });
                    }
                });
            }
        });
    } else {
        sendResponse({ success: true });
    }
}

// Handle wallet unlock
function handleUnlockWallet(sendResponse) {
    isLoggedIn = true;
    chrome.action.setPopup({ popup: "popup.html" }); // Enable popup after unlocking
    if (!fullscreenTabId) {
        chrome.tabs.create({
            url: chrome.runtime.getURL('profile.html'),
            active: true
        }, (tab) => {
            if (tab && tab.id) {
                fullscreenTabId = tab.id;
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

// Listener for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details);
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html'),
            active: true
        }, (tab) => {
            fullscreenTabId = tab.id;
        });
    }
});
