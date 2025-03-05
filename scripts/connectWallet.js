const params = new URLSearchParams(window.location.search);
const tabId = params.get('tabId');

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['fullName', 'walletAddress'], function(data) {
        const fullName = data.fullName || 'N/A'; // Default value if not found
        const walletAddress = data.walletAddress || 'N/A'; // Default value if not found

        document.getElementById('username').textContent = fullName;
        document.getElementById('address').textContent = walletAddress;
    });
})

const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const walletAddressElement = document.getElementById('address');
            const copyMessageElement = document.getElementById('copy-message');
  
            if (walletAddressElement && walletAddressElement.textContent !== 'N/A') {
                navigator.clipboard.writeText(walletAddressElement.textContent).then(() => {
                    copyMessageElement.style.display = 'inline';
                    setTimeout(() => (copyMessageElement.style.display = 'none'), 1000);
                });
            }
        });
    }
document.getElementById('approve-btn').addEventListener('click', function() {
    if (tabId) {
        chrome.runtime.sendMessage({ 
            action: 'approve_connection', 
            tabId: parseInt(tabId, 10) // Send the tabId with the message
        }, function (response) {
            if (response.success) {
                window.close(); // Close the approval popup
            } else {
                alert('Failed to approve the connection.');
            }
        });
    } else {
        alert('Failed to identify the originating tab.');
    }
});

document.getElementById('reject-btn').addEventListener('click', function() {
    chrome.runtime.sendMessage({
        action: 'reject_connection',
        tabId: parseInt(tabId, 10)
    }, function(response) {
        if (response.success) {
            window.close(); // Close the approval popup
        } else {
            alert('Failed to reject the connection.');
        }
    });
});
