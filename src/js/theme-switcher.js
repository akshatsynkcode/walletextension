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
});