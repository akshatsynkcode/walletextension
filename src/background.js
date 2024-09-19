console.log("Background script running...");
let fullscreenTabId = null;
let pendingRequests = [];
let connectedSites = [];
let walletData = {};


// Load connected sites from storage when extension starts
chrome.storage.local.get(['connectedSites'], (result) => {
    connectedSites = result.connectedSites || [];
});

// Save connected sites to local storage
function saveConnectedSites() {
    chrome.storage.local.set({ connectedSites });
}

// Listener for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received:", message);
    switch (message.action) {
        case 'check_extension':
            sendResponse({ status: 'installed' });
            return true;
        case 'connect_wallet':
            //check all data which are stored in local storage
            
            chrome.storage.local.get(['password'], function(result) {
                const walletData = result;
                console.log("Result:", walletData);
            });
            
            // chrome.storage.local.get(['walletData'], function(result) {
            //     const walletData = result.walletData;
    
            //     if (walletData && walletData.address) {
            //         // Find the active tab and send wallet data to it
            //         chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            //             if (tabs.length > 0) {
            //                 chrome.tabs.sendMessage(tabs[0].id, { action: 'wallet_data', address: walletData.address, balance: walletData.balance });
            //             }
            //         });
            //         sendResponse({ success: true, address: walletData.address, balance: walletData.balance });
            //     } else {
            //         // Open the popup to allow user to connect their wallet
            //         chrome.windows.create({
            //             url: chrome.runtime.getURL('connectWalletPopup.html'),
            //             type: 'popup',
            //             width: 400,
            //             height: 600
            //         });
            //         sendResponse({ success: false, message: 'Please connect the wallet' });
            //     }
            // });
            return true;
            

        case 'lock_wallet':
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    fullscreenTabId = tabs[0].id;
                    chrome.tabs.remove(fullscreenTabId);
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false });
                }
            });
            return true;

        case 'unlock_wallet':
            if (fullscreenTabId !== null) {
                chrome.tabs.create({
                    url: chrome.runtime.getURL('profile.html'),
                    active: true
                }, (tab) => {
                    fullscreenTabId = tab.id;
                    console.log("Tab opened:", tab);
                });
            }
            break;

        case 'request_connection':
            const request = {
                tabId: sender.tab.id,
                url: sender.tab.url,
                responseCallback: sendResponse
            };
            pendingRequests.push(request);
            chrome.runtime.sendMessage({ action: 'show_connection_request', request });
            return true;

        case 'approve_connection':
            const approveRequest = pendingRequests.find(req => req.tabId === message.requestId);
            if (approveRequest) {
                connectedSites.push(approveRequest.url);
                saveConnectedSites();  // Save connected sites to local storage
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
            return true;

        case 'request_transaction':
            const transactionRequest = {
                tabId: sender.tab.id,
                details: message.details,
                responseCallback: sendResponse
            };
            pendingRequests.push(transactionRequest);
            chrome.runtime.sendMessage({ action: 'show_transaction_request', transactionRequest });
            return true;

        case 'approve_transaction':
            const approvedTransaction = pendingRequests.find(req => req.tabId === message.requestId);
            if (approvedTransaction) {
                // Process the transaction and send it
                chrome.tabs.sendMessage(approvedTransaction.tabId, { action: 'transaction_approved', details: approvedTransaction.details });
                pendingRequests = pendingRequests.filter(req => req.tabId !== message.requestId);
                approvedTransaction.responseCallback({ success: true });
            }
            break;

        case 'reject_transaction':
            const rejectedTransaction = pendingRequests.find(req => req.tabId === message.requestId);
            if (rejectedTransaction) {
                chrome.tabs.sendMessage(rejectedTransaction.tabId, { action: 'transaction_rejected' });
                pendingRequests = pendingRequests.filter(req => req.tabId !== message.requestId);
                rejectedTransaction.responseCallback({ success: false });
            }
            break;
    }
});

// Listener for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log("Extension installed:", details);
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html'),
            active: true
        }, (tab) => {
            fullscreenTabId = tab.id;
            console.log("New tab created:", tab);
        });
    }
});
