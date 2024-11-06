document.addEventListener("DOMContentLoaded", () => {
    // const urlParams = new URLSearchParams(window.location.search);
    // const username = urlParams.get('username');
    // const fromAddress = urlParams.get('fromAddress');
    // const toAddress = urlParams.get('toAddress');
    // const amount = urlParams.get('amount');
    chrome.storage.sync.get(['username', 'fromAddress', 'toAddress', 'amount'], ({ username, fromAddress, toAddress, amount }) => {
        // Get the elements
        const usernameElement = document.getElementById('username');
        const fromAddressElement = document.getElementById('from-address');
        const toAddressElement = document.getElementById('to-address');
        const copyMessageElement = document.querySelector('.copy-message'); // Make sure this is present in your HTML
        
        // Set the username text
        if (usernameElement) {
            usernameElement.textContent = username || "N/A";
        } else {
            console.error("Element with ID 'username' not found.");
        }

        // Set the from-address and to-address text
        if (fromAddressElement) {
            fromAddressElement.textContent = formatAddress(fromAddress) || "N/A";
        } else {
            console.error("Element with ID 'from-address' not found.");
        }

        if (toAddressElement) {
            const formattedToAddress = formatAddress(toAddress);
            toAddressElement.textContent = formattedToAddress || "N/A";
            
            // Save the full address to an attribute (data attribute)
            toAddressElement.setAttribute('data-full-address', toAddress || "N/A");
        } else {
            console.error("Element with ID 'to-address' not found.");
        }

        // Add event listener to toAddressElement only after it's been retrieved
        if (toAddressElement && copyMessageElement) {
            toAddressElement.addEventListener("click", () => {
                // Get the full address from the data attribute
                const fullAddress = toAddressElement.getAttribute('data-full-address');
                
                if (fullAddress) {
                    navigator.clipboard.writeText(fullAddress).then(() => {
                        // Show the "Copied!" message
                        copyMessageElement.style.display = "inline";
        
                        // Hide the message after 2 seconds
                        setTimeout(() => {
                            copyMessageElement.style.display = "none";
                        }, 1000);
                    }).catch(err => {
                        console.error("Failed to copy address: ", err);
                    });
                } else {
                    console.error("Full address is missing.");
                }
            });
        }
    });

   // Helper function to format address as '5DJ2....'
function formatAddress(address) {
    if (!address) return "_____"; // Handle missing address

    // Format the address to show the first 4 characters, then ellipsis
    const start = address.slice(0, 8); // Get the first 4 characters
    return `${start}....`;
}

    // Approve button handler
    document.querySelector(".approve-button").addEventListener("click", () => {
        chrome.storage.sync.get(['authToken', 'transaction_id'], ({ authToken, transaction_id }) => {
            chrome.runtime.sendMessage({
                action: "approve_transaction",
                transaction: {
                    authToken,
                    transaction_id,
                    status: "completed"
                }
            }, (response) => {
                if (response.success) {
                    window.close(); // Close the popup after approval
                } else {
                    alert("Approval failed. Please try again.");
                    window.close();
                }
            });
        });
    });

    // Reject button handler
    document.querySelector(".reject-button").addEventListener("click", () => {
        chrome.storage.sync.get(['transaction_id', 'authToken'], ({ transaction_id, authToken }) => {
            chrome.runtime.sendMessage({
                action: "reject_transaction",
                transaction: {
                    transaction_id: transaction_id,
                    authToken: authToken,
                    status: "failed"
                }
            }, (response) => {
                if (response.success) {
                    console.log("Transaction rejected!");
                    window.close(); // Close the popup after rejection
                } else {
                    alert("Rejection failed. Please try again.");
                }
            });
        });
    });
});
