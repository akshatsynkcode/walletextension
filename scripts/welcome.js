document.getElementById('get-started-btn').addEventListener('click', function() {
  const password = localStorage.getItem('password');

  // Check if the password is already set
  if (!password) {
    // If no password is found, redirect to the login page
    window.location.href = 'login.html';
  } else {
    // If password exists, still proceed to login (since onboarding is not needed)
    window.location.href = 'login.html';
  }
});

window.onload = function () {
  // Clear localStorage to reset session when the welcome page is loaded
  localStorage.clear();
};
