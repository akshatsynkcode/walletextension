document.addEventListener('DOMContentLoaded', function() {
    const themeStylesheet = document.getElementById('theme-stylesheet');
    const lightThemeRadio = document.getElementById('light-theme');
    const darkThemeRadio = document.getElementById('dark-theme');
    
    const savedTheme = localStorage.getItem('theme') || 'light';

    function setTheme(theme) {
        if(theme === 'dark') {
            themeStylesheet.href = './css/style-dark.css';
            if (darkThemeRadio) darkThemeRadio.checked = true;
        } else {
            themeStylesheet.href = './css/style.css';
            if (lightThemeRadio) lightThemeRadio.checked = true;
        }
        localStorage.setItem('theme', theme);
    }

    if (lightThemeRadio) {
        lightThemeRadio.addEventListener('change', () => setTheme('light'));
    }
    if (darkThemeRadio) {
        darkThemeRadio.addEventListener('change', () => setTheme('dark'));
    }

    setTheme(savedTheme);

    const icons = document.querySelectorAll(".parent img");
    
    icons.forEach(icon => {
        icon.addEventListener("click", function () {
            const iconId = this.getAttribute("data-id"); // Get clicked icon ID
            const iconSrc = this.getAttribute("src"); // Get icon src

            // Send message to background.js to store clicked icon
            chrome.runtime.sendMessage({
                action: "storeClickedIcon",
                icon: { id: iconId, src: iconSrc }
            }, (response) => {
                if (response?.success) {
                    console.log(`Icon ${iconId} stored successfully.`);

                    // Select the user icon <img>
                    let userIconImg = document.querySelector(".user-icon-img");

                    if (userIconImg) {
                        userIconImg.src = iconSrc;
                    } else {
                        console.error("User icon <img> not found!");
                    }

                    // **Reload the page after a short delay**
                    setTimeout(() => {
                        location.reload();
                    }, 500); // Adjust delay if needed
                }
            });
        });
    });
    
});
