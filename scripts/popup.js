window.onload = async function () {
    // Check if the wallet is locked
    const isLocked = localStorage.getItem('locked');
    if (isLocked) {
        showLockScreen();
        return;
    }

    // Load wallet data and update UI
    const username = localStorage.getItem('username');
    const walletData = JSON.parse(localStorage.getItem('walletData'));

    if (!walletData) {
        document.body.innerHTML = '<p>Please create or import a wallet first.</p>';
        return;
    }

    document.getElementById('username').textContent = username;
    document.getElementById('address').textContent = walletData.address;

    // Fetch and update the balance
    await fetchAndUpdateBalance(walletData.address);

    // Event listeners for Send Funds and Lock Wallet buttons
    document.getElementById('send-funds-btn').addEventListener('click', sendFunds);
    document.getElementById('lock-wallet-btn').addEventListener('click', lockWallet);

    // Periodic balance fetch every 5 seconds
    setInterval(async () => {
        await fetchAndUpdateBalance(walletData.address);
    }, 5000);

    // Listen for dApp connection or transaction requests
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'show_connection_request') {
            showConnectionRequest(message.request);
        } else if (message.action === 'show_transaction_request') {
            showTransactionRequest(message.transaction);
        }
    });
};

// Function to show the connection request
function showConnectionRequest(request) {
    document.body.innerHTML = `
        <h1>Connection Request</h1>
        <p>${request.url} wants to connect to your wallet.</p>
        <button id="approve-connection">Approve</button>
        <button id="reject-connection">Reject</button>
    `;
    document.getElementById('approve-connection').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'approve_connection', requestId: request.tabId });
        window.location.reload(); // Refresh the popup to show profile details
    });
    document.getElementById('reject-connection').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'reject_connection', requestId: request.tabId });
        window.location.reload(); // Refresh the popup to show profile details
    });
}

// Function to show the transaction request
function showTransactionRequest(transaction) {
    document.body.innerHTML = `
        <h1>Transaction Request</h1>
        <p>Do you want to approve this transaction?</p>
        <pre>${JSON.stringify(transaction, null, 2)}</pre>
        <button id="approve-transaction">Approve</button>
        <button id="reject-transaction">Reject</button>
    `;
    document.getElementById('approve-transaction').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'approve_transaction', transactionId: transaction.id });
        window.location.reload(); // Refresh the popup to show profile details
    });
    document.getElementById('reject-transaction').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'reject_transaction', transactionId: transaction.id });
        window.location.reload(); // Refresh the popup to show profile details
    });
}

// Function to handle wallet locking
function lockWallet() {
    const password = prompt('Enter a password to lock the wallet:');
    if (password) {
        localStorage.setItem('locked', 'true');
        localStorage.setItem('password', password);
        chrome.runtime.sendMessage({ action: 'lock_wallet' }, (response) => {
            if (response && response.success) {
                showLockScreen();
            } else {
                alert('Failed to lock wallet');
            }
        });
    }
}

// Function to show the lock screen
function showLockScreen() {
    document.body.innerHTML = `
        <h1>Wallet Locked</h1>
        <p>Your wallet is currently locked. Please enter your password to unlock it.</p>
        <input type="password" id="unlock-password" placeholder="Enter your password" />
        <button id="unlock-wallet-btn">Unlock Wallet</button>
    `;
    document.getElementById('unlock-wallet-btn').addEventListener('click', unlockWallet);
}

// Function to handle wallet unlocking
function unlockWallet() {
    const password = document.getElementById('unlock-password').value;
    const storedPassword = localStorage.getItem('password');
    if (password === storedPassword) {
        localStorage.removeItem('locked');
        window.location.reload(); // Reload to refresh the popup with profile details
        chrome.runtime.sendMessage({ action: 'unlock_wallet' });
    } else {
        alert('Incorrect password. Please try again.');
    }
}

// Function to handle sending funds
async function sendFunds() {
    const mnemonic = JSON.parse(localStorage.getItem('walletData')).mnemonic;
    const recipientAddress = document.getElementById('recipient-address').value;
    const amount = document.getElementById('send-amount').value;

    if (!mnemonic || !recipientAddress || !amount) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('http://13.233.172.115:3000/send-funds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mnemonic, recipientAddress, amount }),
        });

        const data = await response.json();

        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            document.getElementById('send-status').textContent = data.message;
            // Immediately update balance after sending funds
            await fetchAndUpdateBalance(JSON.parse(localStorage.getItem('walletData')).address);
        }
    } catch (error) {
        alert('Failed to send funds');
        console.error('Error:', error);
    }
}

// Function to fetch and update the balance
async function fetchAndUpdateBalance(address) {
    try {
        const response = await fetch(`http://13.233.172.115:3000/check-balance/${address}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching balance:', data.error);
        } else {
            // Ensure the balance only shows one "AED" prefix
            let balanceText = data.balance;
            if (!balanceText.startsWith("AED")) {
                balanceText = `AED ${balanceText}`;
            }
            document.getElementById('balance').textContent = balanceText;
        }
    } catch (error) {
        console.error('Failed to fetch balance', error);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    // Function to connect to the wallet
    function connectWallet() {
        // Simulate wallet connection and data retrieval
        return new Promise((resolve, reject) => {
            // Replace with actual wallet connection logic
            resolve({
                address: walletData.address,
                balance: walletData.balance
            });
        });
    }

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === 'request_connection') {
            connectWallet().then(walletData => {
                // Save wallet data to chrome storage
                chrome.storage.local.set({ walletData: walletData }, function() {
                    console.log('Wallet data saved:', walletData);
                    sendResponse(walletData);
                });
            }).catch(error => {
                console.error('Failed to connect wallet:', error);
                sendResponse({ success: false, message: 'Failed to connect wallet' });
            });
            return true; // Keep the connection open for asynchronous response
        }
    });
});