import { fetchJSON } from '../global.js';

async function loadProjects() {
    const projects = await fetchJSON('../lib/projects.json');
    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');

    if (projectsContainer && projectsTitle) {
        projectsTitle.textContent = `${projects.length} Projects`;
        projectsContainer.innerHTML = projects.map(project => `
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

    // Now that projects are loaded, create the pie chart
    drawPieChart();
}

function drawPieChart() {
    const data = [1, 2, 3, 4];  // Example data for the pie chart

    const width = 300, height = 300, radius = Math.min(width, height) / 2;

    // Create an arc generator using D3
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

    // Create a pie generator using D3 to calculate angles for each slice
    const pieGenerator = d3.pie();

    // Create the SVG element
    const svg = d3.select("#projects-pie-plot")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);  // Center the pie chart

    // Create the slices using the pie chart data
    const arcs = svg.selectAll(".arc")
        .data(pieGenerator(data))
        .enter().append("g")
        .attr("class", "arc");

    // Add a path for each slice
    arcs.append("path")
        .attr("d", arcGenerator)
        .attr("fill", (d, i) => d3.schemeTableau10[i]);  // Use Tableau color scheme for the slices
}

loadProjects();
