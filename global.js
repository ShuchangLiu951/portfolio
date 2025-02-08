console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

const pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'Resume/', title: 'CV' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/ShuchangLiu951', title: 'GitHub', external: true }
];

const ARE_WE_HOME = document.documentElement.classList.contains('home');

const nav = document.createElement('nav');
document.body.prepend(nav);

for (let page of pages) {
    let { url, title, external } = page;
    
    if (!ARE_WE_HOME && !url.startsWith('http')) {
        url = '../' + url;
    }

    const a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    if (external) {
        a.target = '_blank';
    }

    nav.appendChild(a);
}

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

const themeSelector = document.getElementById('theme-selector');
const root = document.documentElement;

function applyTheme(theme) {
    root.style.setProperty('color-scheme', theme);
    localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme') || 'auto';
applyTheme(savedTheme);
themeSelector.value = savedTheme;

themeSelector.addEventListener('input', (e) => {
    applyTheme(e.target.value);
});

export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!containerElement) return;
    containerElement.innerHTML = ''; 

    projects.forEach((project) => {
        const article = document.createElement('article');
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
        `;
        containerElement.appendChild(article);
    });
}

export async function fetchGitHubData(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
    }
}
