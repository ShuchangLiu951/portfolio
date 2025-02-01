import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function loadFirstThreeProjects() {
    const projects = await fetchJSON('./lib/projects.json');
    const firstThreeProjects = projects.slice(0, 3);
    const projectsContainer = document.querySelector('.latest-projects');
    
    if (projectsContainer) {
        renderProjects(firstThreeProjects, projectsContainer, 'h3');
    }
}

async function loadGitHubProfile() {
    const githubData = await fetchGitHubData('ShuchangLiu951'); // Your GitHub username
    const profileStats = document.querySelector('#profile-stats');

    if (profileStats && githubData) {
        profileStats.innerHTML = `
            <dt>FOLLOWERS</dt><dd>${githubData.followers}</dd>
            <dt>FOLLOWING</dt><dd>${githubData.following}</dd>
            <dt>PUBLIC REPOS</dt><dd>${githubData.public_repos}</dd>
            <dt>PUBLIC GISTS</dt><dd>${githubData.public_gists}</dd>
        `;
    }
}


loadFirstThreeProjects();
loadGitHubProfile();
