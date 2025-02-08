import { fetchJSON } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let projects = [];
let query = '';
let selectedYear = null;

async function loadProjects() {
    projects = await fetchJSON('../lib/projects.json');
    document.querySelector('.projects-title').textContent = `${projects.length} Projects`;
    renderProjects(projects);
    renderPieChart(projects);
}

loadProjects();

function renderProjects(filteredProjects) {
    const projectsContainer = document.querySelector('.projects');
    projectsContainer.innerHTML = filteredProjects.map(project => `
        <article>
            <h2>${project.title}</h2>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
            <div class="project-year">
                <p>c. ${project.year}</p>
            </div>
        </article>
    `).join('');
}

function renderPieChart(allProjects) {
    const rolledData = d3.rollups(
        allProjects,
        v => v.length,
        d => d.year
    );
    const data = rolledData.map(([year, count]) => ({ label: year, value: count }));

    const sliceGenerator = d3.pie().value(d => d.value);
    const arcData = sliceGenerator(data);

    const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    const arcs = arcData.map(d => arcGenerator(d));

    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    d3.select("#projects-pie-plot").selectAll("*").remove();

    arcs.forEach((arc, idx) => {
        d3.select('#projects-pie-plot')
          .append('path')
          .attr('d', arc)
          .attr('fill', colors(idx))
          .on('click', () => {
              if (selectedYear === data[idx].label) {
                  selectedYear = null;
                  renderProjects(projects);
              } else {
                  selectedYear = data[idx].label;
                  const filtered = projects.filter(p => p.year === selectedYear);
                  renderProjects(filtered);
              }
          });
    });

    const legend = d3.select('.legend');
    legend.selectAll("*").remove();

    data.forEach((d, idx) => {
        legend.append('li')
              .attr('style', `--color:${colors(idx)}`)
              .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

document.querySelector('.searchBar').addEventListener('input', event => {
    query = event.target.value.toLowerCase();
    let filtered = projects.filter(project =>
        Object.values(project).join(' ').toLowerCase().includes(query)
    );

    if (selectedYear) {
        filtered = filtered.filter(project => project.year === selectedYear);
    }

    renderProjects(filtered);
});