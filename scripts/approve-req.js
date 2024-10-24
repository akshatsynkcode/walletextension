document.addEventListener("DOMContentLoaded", () => {
    // const urlParams = new URLSearchParams(window.location.search);
    // const username = urlParams.get('username');
    // const fromAddress = urlParams.get('fromAddress');
    // const toAddress = urlParams.get('toAddress');
    // const amount = urlParams.get('amount');
    chrome.storage.sync.get(['username', 'fromAddress', 'toAddress', 'amount'], ({ username, fromAddress, toAddress, amount }) => {
        
        const usernameElement = document.getElementById('username');
        const fromAddressElement = document.getElementById('from-address');
        const toAddressElement = document.getElementById('to-address');
        const amountElement = document.getElementById('transaction-amount');
        if (usernameElement) {
            usernameElement.textContent = username || "N/A";
        } else {
            console.error("Element with ID 'username-display' not found.");
        }
    
        if (fromAddressElement) {
            fromAddressElement.textContent = fromAddress || "N/A";
        } else {
            console.error("Element with ID 'from-address' not found.");
        }
    
        if (toAddressElement) {
            toAddressElement.textContent = toAddress || "N/A";
        } else {
            console.error("Element with ID 'to-address' not found.");
        }
    
        if (amountElement) {
            amountElement.textContent = amount || "0.00";
        } else {
            console.error("Element with ID 'transaction-amount' not found.");
        }
    })

    // Get elements
    
    // Ensure elements exist before setting their text content
    
    // Approve button handler
    document.querySelector(".approve-button").addEventListener("click", () => {
        chrome.storage.sync.get(['authToken', 'transaction_id'], ({authToken, transaction_id }) => {
            
            chrome.runtime.sendMessage({
                action: "approve_transaction",
                transaction: {
                    authToken,
                    transaction_id,
                    status:"completed"
                }
            }, (response) => {
                if (response.success) {
                    window.close(); // Close the popup after approval
                } else {
                    alert("Approval failed. Please try again.");
                    window.close();
                }
            });
        })
    });
    
    // Reject button handler
    document.querySelector(".reject-button").addEventListener("click", () => {
        chrome.storage.sync.get(['transaction_id', 'authToken'], ({ username, fromAddress, toAddress, amount }) => {
            
            chrome.runtime.sendMessage({
                action: "reject_transaction",
                transaction: {
                    transaction_id: transaction_id,
                    authToken: authToken,
                    status:"failed"
                }
            }, (response) => {
                if (response.success) {
                    console.log("Transaction rejected!");
                    window.close(); // Close the popup after rejection
                } else {
                    alert("Rejection failed. Please try again.");
                }
            });
        })
    });
});
