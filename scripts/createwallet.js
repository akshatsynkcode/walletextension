document.getElementById('generate-wallet-btn').addEventListener('click', async function createWallet() {
    const response = await fetch('http://13.233.172.115:3000/create-wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    const data = await response.json();
  
    if (data.error) {
      alert('Error: ' + data.error);
    } else {
      const password = localStorage.getItem('password');
      localStorage.setItem('walletData', JSON.stringify({
        password,
        mnemonic: data.mnemonic,
        address: data.address,
        balance: data.balance,
      }));
  
      document.getElementById('mnemonic-output').textContent = data.mnemonic;
  
      setTimeout(() => {
        window.location.href = 'profile.html'; // Redirect to profile after 5 seconds
      }, 5000);
    }
  });
  