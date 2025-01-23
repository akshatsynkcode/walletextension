// Store the ID of the fullscreen tab
let fullscreenTabId = null;
let pendingRequests = [];
let connectedSites = [];
let isLoggedIn = false; // Flag to indicate login status
let authCheckIntervalId = null; // To store the interval ID
const servicePopups = {};

// Listener for messages from popup and content scripts
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     console.log("Message received:", message); // Debugging log

//     switch (message.action) {
//         case 'lock_wallet':
//             handleLockWallet(sendResponse);
//             break;
//         case 'unlock_wallet':
//             handleUnlockWallet(sendResponse);
//             break;
//         case 'approve_connection':
//             handleApproveConnection(message, sendResponse);
//             break;
//         case 'reject_connection':
//             handleRejectConnection(message, sendResponse);
//             break;
//         case 'approve_transaction':
//             handleApproveTransaction(message, sendResponse);
//             break;
//         case 'reject_transaction':
//             handleRejectTransaction(message, sendResponse);
//             break;
//     }
//     return true; // Keep the message channel open for asynchronous responses
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("abcd");
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
    } else if (message.action === 'getbalance') {
        chrome.storage.sync.get(['authToken'], (result) => {
            if (result.authToken) {
                fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-balance', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${result.authToken}` }
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Network response was not ok');
                    }
                })
                .then(data => {
                    sendResponse({ success: true, balance: data.balance });
                })
                .catch(error => {
                    console.error('Error fetching balance:', error);
                    sendResponse({ success: false, error: 'Failed to fetch balance' }); 
                });
            } else {
                sendResponse({ success: false, error: 'Auth token not found' });
            }
        });
    }  
    else if (message.action === 'get_auth') {  // New case for getauth
        chrome.storage.sync.get(['authToken'], (result) => {
            if (result.authToken) {
                sendResponse({ success: true, authToken: result.authToken });
            } else {
                sendResponse({ success: false, error: 'Auth token not found' });
            }
        });
    }
    else if (message.action === "tab_refreshed") {
        const tabId = sender.tab.id;
        if (servicePopups[tabId]) {
            chrome.windows.remove(servicePopups[tabId], () => {
                if (chrome.runtime.lastError) {
                    console.warn("Error closing popup window:", chrome.runtime.lastError);
                }
            });
            delete servicePopups[tabId];
        }
        const connectionRequest = pendingRequests.find((req) => req.tabId === tabId);
        if (connectionRequest) {
            pendingRequests.splice(pendingRequests.indexOf(connectionRequest), 1); // Remove the approved request
        }
        sendResponse({ success: true});
    }
    else {
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
            case 'login':
                console.log("Starting auth check after login.");
                startAuthCheck();
                break;
            case 'logout':
                console.log("Stopping auth check after logout.");
                stopAuthCheck();
                break;
            default:
                console.warn('Unknown action received:', message.action);
                sendResponse({ success: false, error: 'Unknown action' });
                break;
        }
    }
    return true;
    
});

// Handle approving the transaction
async function handleApproveTransaction(message, sendResponse) {

    const { authToken, transaction_id, status } = message.transaction;
    console.log("transaction_id", transaction_id, "authToken", authToken, "status", status);
    const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-transaction', {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status:status, transaction_id: transaction_id })

    });
    console.log("id to body data",JSON.stringify({ status:status, transaction_id: transaction_id, authToken: authToken }));
    console.log(response.status, "response");
    console.log(response.message, "response");
    console.log(response.headers, "response");
    if (response.status == 200) {
        chrome.storage.sync.remove(['transaction_id', 'username', 'fromAddress', 'toAddress', 'amount', 'url']);
        sendResponse({ success: true,  message : response.message });
    } else if(response.status == 401){
        sendResponse({ success: false , message : response.message, statusCode:response.status });
    }else{
        sendResponse({ success: false , message : response.message});
    }
}

// Handle rejecting the transaction
async function handleRejectTransaction(message, sendResponse) {
    const { status, transaction_id, authToken } = message.transaction;

    const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-transaction', {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status:status, transaction_id: transaction_id })

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
    let senderTabId = sender.tab.id;
    const request = {
        tabId: senderTabId,
        origin: sender.origin,
        responseCallback: sendResponse
    };

    chrome.storage.sync.get(['authToken', 'connectedSites'], function(result) {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving storage data:", chrome.runtime.lastError);
        }
        const connectedSites = result.connectedSites || [];
        console.log("Connected Sites:", connectedSites);
        let isConnected = connectedSites.some((site) => site.includes(sender.origin));

        if (isConnected) {
            console.log("Connected Site found");
            sendResponse({ success: true, authToken : result.authToken });
            return;
        }

        console.log("Not a connected site, proceeding to handle popup.");

        if (!servicePopups[senderTabId]) {
            if (result.authToken) {
                pendingRequests.push(request);
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
                            url: chrome.runtime.getURL(`connectWallet.html?tabId=${senderTabId}`), // No data passed
                            type: 'popup',
                            width: 340,
                            height: 570
                        }, (window) => {
                            servicePopups[senderTabId] = window.id; // Save the window ID
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
        }
        else {
            chrome.windows.update(servicePopups[senderTabId], { focused: true });
        }
    });

    return true;
}

// Clean up when a popup window is closed
chrome.windows.onRemoved.addListener((windowId) => {
    for (const [tabId, popupWindowId] of Object.entries(servicePopups)) {
        if (popupWindowId === windowId) {
            delete servicePopups[tabId];
            break;
        }
    }
});

// Clean up when a tab is closed or navigates away
chrome.tabs.onRemoved.addListener((tabId) => {
    if (servicePopups[tabId]) {
        chrome.windows.remove(servicePopups[tabId], () => {
            if (chrome.runtime.lastError) {
                console.warn('Error closing popup window:', chrome.runtime.lastError);
            }
        });
        delete servicePopups[tabId];
    }
});

function handleApproveConnection(message, sendResponse) {
    const { tabId } = message; // Use tabId from the message
    const approveRequest = pendingRequests.find((req) => req.tabId === tabId);
    if (approveRequest) {
        chrome.storage.sync.get(['authToken', 'connectedSites'], function(result) {
            if (result.authToken) {
                // Send the address back to the original request
                approveRequest.responseCallback({ success: true, authToken : result.authToken });
                pendingRequests.splice(pendingRequests.indexOf(approveRequest), 1); // Remove the approved request
                chrome.storage.sync.remove(['fullName', 'walletAddress']);

                // Update Connected Sites locally
                let connectedSites = result.connectedSites || [];
                if (!connectedSites.includes(approveRequest.origin)) {
                    connectedSites.push(approveRequest.origin); 

                    chrome.storage.sync.set({ connectedSites }, function() {
                        if (chrome.runtime.lastError) {
                            console.error("Error updating connectedSites:", chrome.runtime.lastError);
                        } else {
                            console.log("ConnectedSites updated successfully:", connectedSites);
                            fetch("https://dev-wallet-api.dubaicustoms.network/api/ext-profile", {
                                method: "PUT",
                                headers: {"Authorization": `Bearer ${result.authToken}`},
                                body: JSON.stringify({ domain: approveRequest.origin })
                            })
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Failed to send origin to the backend.");
                                    }
                                })
                                .then((data) => {
                                    console.log("Successfully updated connected sites on backend:", data);
                                })
                                .catch((error) => {
                                    console.error("Error updating connected sites on backend:", error);
                                });
                        }
                    });
                } else {
                    console.log("Domain already present in connectedSites:", approveRequest.origin);
                }

                sendResponse({ success: true, authToken : result.authToken });
            } else {
                approveRequest.responseCallback({ success: false, message: "No user logged in." });
                pendingRequests.splice(pendingRequests.indexOf(approveRequest), 1); // Remove the denied request
                sendResponse({ success: false });
            }
        });
    } else {
        sendResponse({ success: false, message: "No matching request found for this tab." });
    }
    if (servicePopups[tabId]) {
        chrome.windows.remove(servicePopups[tabId], () => {
            if (chrome.runtime.lastError) {
                console.warn('Error closing popup window:', chrome.runtime.lastError);
            }
        });
        delete servicePopups[tabId]; // Remove the entry from servicePopups
    }
}

function handleRejectConnection(message, sendResponse) {
    const { tabId } = message;
    const rejectRequest = pendingRequests.find((req) => req.tabId === tabId);
    if (rejectRequest) {
        rejectRequest.responseCallback({ success: false, message: "Connection rejected by the user." });
        pendingRequests.splice(pendingRequests.indexOf(rejectRequest), 1);
        chrome.storage.sync.remove(['fullName', 'walletAddress']);
        sendResponse({ success: true });
    }
    if (servicePopups[tabId]) {
        chrome.windows.remove(servicePopups[tabId], () => {
            if (chrome.runtime.lastError) {
                console.warn('Error closing popup window:', chrome.runtime.lastError);
            }
        });
        delete servicePopups[tabId]; // Remove the entry from servicePopups
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

chrome.action.onClicked.addListener(() => {
    chrome.storage.sync.get(['authToken'], (result) => {
        if (result.authToken) {
            chrome.action.setPopup({popup: "popup.html"});
        } else {
            chrome.tabs.create({
                url: chrome.runtime.getURL('welcome.html'),
                active: true
            }, (tab) => {
                fullscreenTabId = tab.id;
            });
        }
    });
});

// Function to start the periodic auth check
function startAuthCheck() {
    if (authCheckIntervalId) {
        console.log("Auth check is already running.");
        return;
    }

    authCheckIntervalId = setInterval(() => {
        chrome.storage.sync.get('authToken', async ({ authToken }) => {
            if (!authToken) {
                console.log('No auth token found. Stopping auth check.');
                stopAuthCheck(); // Stop if no token is found
                return;
            }

            try {
                const response = await fetch('https://dev-wallet-api.dubaicustoms.network/api/ext-profile', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                });

                if (response.status === 401) {
                    console.log("Auth token invalid. Logging out.");
                    chrome.storage.sync.remove(['authToken', 'connectedSites'], () => {
                        stopAuthCheck(); // Stop the check
                        // chrome.runtime.sendMessage({ action: 'lock_wallet' });
                    });
                }
            } catch (error) {
                console.error('Error during auth token validation:', error);
            }
        });
    },  24*60*60*1000); // Run every 24 hours
}

// Function to stop the periodic auth check
function stopAuthCheck() {
    if (authCheckIntervalId) {
        clearInterval(authCheckIntervalId);
        authCheckIntervalId = null;
        console.log("Auth check stopped.");
    }
}
