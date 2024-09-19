window.onload = async function () {
    // Retrieve wallet data from localStorage
    const walletDataRaw = localStorage.getItem('walletData');
    
    if (!walletDataRaw) {
        document.body.innerHTML = '<p>Please create or import a wallet first.</p>';
        return;
    }

    // Parse the wallet data
    const walletData = JSON.parse(walletDataRaw);
    
    // Ensure walletData is available
    if (!walletData) {
        document.body.innerHTML = '<p>Please create or import a wallet first.</p>';
        return;
    }

    // Display username and address
    const username = localStorage.getItem('username');
    document.getElementById('username').textContent = username;
    document.getElementById('address').textContent = walletData.address;
    document.getElementById('balance').textContent = walletData.balance || 'N/A';

    // Fetch and update balance
    await fetchAndUpdateBalance(walletData.address);

    // Event listeners for Send Funds and Lock Wallet buttons
    document.getElementById('send-funds-btn').addEventListener('click', sendFunds);
    document.getElementById('lock-wallet-btn').addEventListener('click', lockWallet);

    // Poll balance every 5 seconds
    setInterval(async () => {
        await fetchAndUpdateBalance(walletData.address);
    }, 5000); 
};

async function fetchAndUpdateBalance(address) {
    try {
        const response = await fetch(`http://13.233.172.115:3000/check-balance/${address}`);
        const data = await response.json();

        if (data.error) {
            document.getElementById('balance').textContent = 'Error fetching balance';
        } else {
            document.getElementById('balance').textContent = data.balance;
        }
    } catch (error) {
        document.getElementById('balance').textContent = 'Failed to fetch balance';
        console.error('Error fetching balance:', error);
    }
}

async function sendFunds() {
    const walletData = JSON.parse(localStorage.getItem('walletData'));
    const mnemonic = walletData.mnemonic;
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
            document.getElementById('send-status').textContent = 'Error: ' + data.error;
        } else {
            document.getElementById('send-status').textContent = 'Funds sent successfully!';
            await fetchAndUpdateBalance(walletData.address); // Update balance after sending
        }
    } catch (error) {
        document.getElementById('send-status').textContent = 'Failed to send funds';
        console.error('Error:', error);
    }
}

function lockWallet() {
    window.location.href = 'lock.html';
}
