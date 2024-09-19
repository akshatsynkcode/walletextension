window.onload = function () {
  const username = localStorage.getItem('username');
  const isOnboardingComplete = localStorage.getItem('onboardingComplete');

  // Check if username is set
  if (!username) {
      alert('Session expired. Please enter the password again.');
      window.location.href = 'password.html';
      return;
  }

  // Check if onboarding is already completed
  if (isOnboardingComplete) {
      alert('You have already set your password.\nYou can change your password in the settings at any time after you have onboarded.\nIf you can\'t remember the password you set, please re-install Dubai Customs now, and restart this onboarding process.');
      window.location.href = 'password.html'; // Redirect back to password page
      return;
  }

  // Set welcome message with the username
  document.getElementById('welcome-message').textContent = `Welcome, ${username}`;

  // Attach event listeners for the buttons
  document.getElementById('create-wallet-btn').addEventListener('click', goToCreate);
  document.getElementById('import-wallet-btn').addEventListener('click', goToImport);
};

function goToCreate() {
  window.location.href = 'createWallet.html'; // Redirect to create wallet
}

function goToImport() {
  window.location.href = 'importWallet.html'; // Redirect to import wallet
}

// Call this function when onboarding is successfully completed
function completeOnboarding() {
  localStorage.setItem('onboardingComplete', 'true');
  window.location.href = 'profile.html'; // Redirect to the profile page or another appropriate page
}

// Call this function if the user decides to reset or reinitialize the onboarding process
function resetOnboarding() {
  localStorage.removeItem('onboardingComplete');
}
