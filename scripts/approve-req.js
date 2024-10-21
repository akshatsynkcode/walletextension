document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const fromAddress = urlParams.get('fromAddress');
    const toAddress = urlParams.get('toAddress');
    const amount = urlParams.get('amount');

    // Get elements
    const usernameElement = document.getElementById('username-display');
    const fromAddressElement = document.getElementById('from-address');
    const toAddressElement = document.getElementById('to-address');
    const amountElement = document.getElementById('transaction-amount');

    // Ensure elements exist before setting their text content
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

    // Approve button handler
    document.querySelector(".approve-button").addEventListener("click", () => {
        chrome.runtime.sendMessage({
            action: "approve_transaction",
            transaction: {
                username,
                fromAddress,
                toAddress,
                amount
            }
        }, (response) => {
            if (response.success) {
                alert("Transaction Approved!");
                window.close(); // Close the popup after approval
            } else {
                alert("Approval failed. Please try again.");
            }
        });
    });

    // Reject button handler
    document.querySelector(".reject-button").addEventListener("click", () => {
        chrome.runtime.sendMessage({
            action: "reject_transaction",
            transaction: {
                username,
                fromAddress,
                toAddress,
                amount
            }
        }, (response) => {
            if (response.success) {
                alert("Transaction Rejected!");
                window.close(); // Close the popup after rejection
            } else {
                alert("Rejection failed. Please try again.");
            }
        });
    });
});
