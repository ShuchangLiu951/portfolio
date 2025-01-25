console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// Pages structure for the navigation menu
const pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'Resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/ShuchangLiu951', title: 'GitHub', external: true }
];

// Detect if we are on the home page
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// Create and insert the navigation menu
const nav = document.createElement('nav');
document.body.prepend(nav);

for (let page of pages) {
    let { url, title, external } = page;

    // Adjust relative URLs for non-home pages
    if (!ARE_WE_HOME && !url.startsWith('http')) {
        url = '../' + url;
    }

    // Create the link element
    const a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    // Highlight the current page
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    // Add target="_blank" for external links
    if (external) {
        a.target = '_blank';
    }

    nav.appendChild(a);
}

// Add dark mode switcher
document.body.insertAdjacentHTML(
    'afterbegin',
    `<label class="color-scheme">
        Theme:
        <select id="theme-selector">
            <option value="auto">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>`
);

// Theme management logic
const themeSelector = document.getElementById('theme-selector');
const root = document.documentElement;

// Apply a theme
function applyTheme(theme) {
    root.style.setProperty('color-scheme', theme);
    localStorage.setItem('theme', theme);
}

// Load saved theme or default to auto
const savedTheme = localStorage.getItem('theme') || 'auto';
applyTheme(savedTheme);
themeSelector.value = savedTheme;

// Listen for changes in the dropdown
themeSelector.addEventListener('input', (e) => {
    applyTheme(e.target.value);
});
