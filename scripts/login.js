document.getElementById('login-btn').addEventListener('click', async function login(event) {
    event.preventDefault();  // Prevent default form submission behavior

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.getElementById('login-btn');
    const loader = document.getElementById('loader');

    errorMessage.textContent = '';  // Clear any previous errors

    // Validate input fields
    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password.';
        return;
    }

    // Show the loader and hide the login button
    loginButton.disabled = true;  // Disable button to prevent multiple clicks
    loader.style.display = 'block';
    loginButton.style.display = 'none';

    try {
        const response = await fetch('https://log-iam-temp.finloge.com/api/ext-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Store the token in chrome.storage.sync
            chrome.storage.sync.set({
                authToken: data.token
            }, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error setting authToken:', chrome.runtime.lastError);
                    errorMessage.textContent = 'Failed to store auth token.';
                    loader.style.display = 'none';
                    loginButton.style.display = 'block';
                    return;
                }
                // Redirect to profile.html after successful login
                window.location.href = 'profile.html';
            });

        } else {
            // Display the login error message from the response
            errorMessage.textContent = data.message || 'Login failed, please try again.';
        }
    } catch (error) {
        console.error('Error during login:', error);
        errorMessage.textContent = 'An error occurred during login. Please try again.';
    } finally {
        // Hide the loader and show the login button
        loader.style.display = 'none';
        loginButton.style.display = 'block';
        loginButton.disabled = false;  // Re-enable the button
    }
});

// Check if the user is already logged in (authToken in chrome.storage.sync)
window.onload = function () {
    chrome.storage.sync.get(['authToken'], function (result) {
        if (result.authToken) {
            // If auth token is found, redirect to profile
            window.location.href = 'profile.html';
        }
    });
};


var maxx = window.innerWidth;
var maxy = window.innerHeight;
var halfx = maxx / 2;
var halfy = maxy / 2;
var canvas = document.getElementById("canvas");
canvas.width = maxx;
canvas.height = maxy;
var context = canvas.getContext("2d");
var dotCount = 200;
var dots = [];

// create dots
for (var i = 0; i < dotCount; i++) {
    dots.push(new dot());
}

// dots animation
function render() {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, maxx, maxy);
    for (var i = 0; i < dotCount; i++) {
        dots[i].draw();
        dots[i].move();
    }
    requestAnimationFrame(render);
}

// dots class
function dot() {
    this.rad_x = 2 * Math.random() * halfx + 1;
    this.rad_y = 1.2 * Math.random() * halfy + 1;
    this.alpha = Math.random() * 360 + 1;
    this.speed = Math.random() * 100 < 50 ? 1 : -1;
    this.speed *= 0.1;
    this.size = Math.random() * 5 + 1;
    this.color = Math.floor(Math.random() * 256);
}

// drawing dot
dot.prototype.draw = function() {
    var dx = halfx + this.rad_x * Math.cos(this.alpha / 180 * Math.PI);
    var dy = halfy + this.rad_y * Math.sin(this.alpha / 180 * Math.PI);
    context.fillStyle = "rgb(" + this.color + "," + this.color + "," + this.color + ")";
    context.fillRect(dx, dy, this.size, this.size);
};

// calc new position in polar coord
dot.prototype.move = function() {
    this.alpha += this.speed;
    if (Math.random() * 100 < 50) {
        this.color += 1;
    } else {
        this.color -= 1;
    }
};

// start animation
render();