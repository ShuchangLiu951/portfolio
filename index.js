import { fetchJSON, renderProjects } from './global.js';

async function loadLatestProjects() {
    const projects = await fetchJSON('./lib/projects.json'); 
    const latestProjects = projects.slice(0, 3); 
    const projectsContainer = document.querySelector('.latest-projects'); 
    
    if (projectsContainer) {
        renderProjects(latestProjects, projectsContainer, 'h3'); 
    }
}

loadLatestProjects();
