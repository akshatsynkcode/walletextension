document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['fullName', 'walletAddress'], function(data) {
        const fullName = data.fullName || 'N/A'; // Default value if not found
        const walletAddress = data.walletAddress || 'N/A'; // Default value if not found

        document.getElementById('username').textContent = fullName;
        document.getElementById('address').textContent = walletAddress;
    });
})

document.getElementById('approve-btn').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'approve_connection' }, function(response) {
        if (response.success) {
            window.close(); // Close the approval popup
        } else {
            alert('Failed to approve the connection.');
        }
    });
});

document.getElementById('reject-btn').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'reject_connection' }, function(response) {
        if (response.success) {
            window.close(); // Close the approval popup
        } else {
            alert('Failed to reject the connection.');
        }
    });
});