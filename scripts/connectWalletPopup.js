window.onload = async function () {
    // Check if the wallet is locked
    const isLocked = localStorage.getItem('locked');
    if (isLocked) {
        showLockScreen();
        return;
    }

    // Load wallet data and update UI
    const walletData = JSON.parse(localStorage.getItem('walletData'));

    if (!walletData) {
        document.body.innerHTML = '<p>Please create or import a wallet first.</p>';
        return;
    }

    // Display wallet address
    const walletAddressText = document.getElementById('walletAddressText');
    walletAddressText.textContent = walletData.address;

    // Handle Connect button click
    const connectButton = document.getElementById('confirmBtn');
    connectButton.addEventListener('click', function () {
        const walletRadio = document.getElementById('walletRadio');
        if (walletRadio.checked) {
            // Send wallet data using window.postMessage to the external site
            const walletData = {
                action: 'wallet_data',
                address: walletData.address,
                balance: walletData.balance
            };

            // Find the external tab or window
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, walletData);
                }
            });
        } else {
            alert('Please select the wallet to connect.');
        }
    });
};
