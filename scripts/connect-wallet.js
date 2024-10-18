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