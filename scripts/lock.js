window.onload = function() {
    // Event listener for Unlock Wallet button
    document.getElementById('unlock-wallet-btn').addEventListener('click', unlockWallet);
  
    // Event listener for Create New Wallet button
    document.getElementById('create-new-wallet-btn').addEventListener('click', createNewWallet);
  };
  
  function unlockWallet() {
    const password = document.getElementById('password').value;
    const storedPassword = localStorage.getItem('password');
  
    if (password === storedPassword) {
      window.location.href = 'profile.html'; // Redirect to profile if the password is correct
    } else {
      alert('Incorrect password. Please try again.');
    }
  }
  
  function createNewWallet() {
    // Clear existing data and redirect to wallet creation
    localStorage.clear();
    window.location.href = 'createwallet.html';
  }
  