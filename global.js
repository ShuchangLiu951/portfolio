console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

const pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'Resume/', title: 'Resume' },
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
