document.addEventListener('DOMContentLoaded', function() {
    const continueBtn = document.getElementById('continue-btn');
    
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (!username || !password || !confirmPassword) {
                alert('Please fill in all fields');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            // Store username and password for session
            localStorage.setItem('username', username);
            localStorage.setItem('password', password);

            // Proceed to onboarding
            window.location.href = 'onboarding.html';
        });
    }
});
