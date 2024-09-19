window.onload = function() {
    // Event listener for the Reset Password button
    document.getElementById('reset-password-btn').addEventListener('click', resetPassword);
  };
  
  function resetPassword() {
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
  
    if (!newPassword || !confirmNewPassword) {
      alert('Please fill in both password fields');
      return;
    }
  
    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match!');
      return;
    }
  
    // Update the password in localStorage
    localStorage.setItem('password', newPassword);
    alert('Password has been reset successfully!');
    window.location.href = 'profile.html'; // Redirect back to the profile page
  }
  