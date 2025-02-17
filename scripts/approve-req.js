document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(['username', 'toAddress', 'amount', 'url'], ({ username, toAddress, amount, url }) => {
        const usernameElement = document.getElementById('username');
        const toAddressElement = document.getElementById('to-address');
        const copyMessageElement = document.querySelector('.copy-message');
        const amountElement = document.getElementById('transaction-amount');
        const urlElement = document.getElementById('site-url');
        const siteUrlElement = document.getElementById('site-description');  // Assuming `id="site-url"` is correct

        if (usernameElement) {
            usernameElement.textContent = username || "N/A";
        } else {
            console.error("Element with ID 'username' not found.");
        }
        if (amountElement) {
            amountElement.textContent = amount ? `AED ${amount}` : "N/A";
        } else {
            console.error("Element with ID 'username' not found.");
        }

        if (toAddressElement) {
            const formattedToAddress = formatAddress(toAddress);
            toAddressElement.textContent = formattedToAddress || "N/A";
            toAddressElement.setAttribute('data-full-address', toAddress || "N/A");
        } else {
            console.error("Element with ID 'to-address' not found.");
        }

        if (urlElement) {
            urlElement.textContent = url ? `Allow ${url} to spend your AED?` : "N/A";
        } else {
            console.error("Element with ID 'site-url' not found.");
        }
        if (siteUrlElement) {
            siteUrlElement.textContent = url ? `Do you trust this site? By granting this permission, you're allowing ${url} to withdraw your AED and automate transaction for you.` : "N/A";
        } else {
            console.error("Element with ID 'site-url' not found.");
        }

        if (toAddressElement && copyMessageElement) {
            toAddressElement.addEventListener("click", () => {
                const fullAddress = toAddressElement.getAttribute('data-full-address');
                if (fullAddress) {
                    navigator.clipboard.writeText(fullAddress).then(() => {
                        copyMessageElement.style.display = "inline";
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

    function formatAddress(address) {
        if (!address) return "_____";
        const start = address.slice(0, 8);
        return `${start}....`;
    }

    document.querySelector(".approve-button").addEventListener("click", function() {
        const approveButton = document.querySelector(".approve-button");
    
        // Disable the button and add a loader text
        approveButton.disabled = true;
        approveButton.innerHTML = 'Processing... <span class="approve-loader"></span>'; // Adding loader
    
        chrome.storage.sync.get(['authToken', 'transaction_id', 'authIV'], ({ authToken, transaction_id, authIV }) => {
            chrome.runtime.sendMessage({
                action: "approve_transaction",
                transaction: {
                    authToken,
                    transaction_id,
                    authIV,
                    status: "completed"
                }
            }, (response) => {
                // Remove loader and re-enable button based on response
                approveButton.disabled = false;
                approveButton.innerHTML = 'Approve';
    
                if (response.success) {
                    window.close();
                } else if ('statusCode' in response && response.statusCode == 401) {
                    alert("Please login through extension first.");
                    window.close();
                }
            });
        });
    });

    document.querySelector(".reject-button").addEventListener("click", () => {
        chrome.storage.sync.get(['transaction_id', 'authToken', 'authIV'], ({ transaction_id, authToken, authIV }) => {
            chrome.runtime.sendMessage({
                action: "reject_transaction",
                transaction: {
                    transaction_id: transaction_id,
                    authToken: authToken,
                    authIV: authIV,
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
