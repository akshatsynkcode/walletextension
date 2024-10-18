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
