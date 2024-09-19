document.getElementById('get-started-btn').addEventListener('click', function() {
    const password = localStorage.getItem('password');
  
    // Check if the password is already set
    if (!password) {
      // If no password is found, redirect to the password page
      window.location.href = 'password.html';
    } else {
      // If password exists, proceed to onboarding
      window.location.href = 'onboarding.html';
    }
  });
  window.onload = function () {
    // Clear localStorage to reset session when welcome page is loaded
    localStorage.clear();
  };
  