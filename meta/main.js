async function loadData() {
    try {
        const data = await d3.csv("loc.csv", row => ({
            ...row,
            line: +row.line,
            depth: +row.depth,
            length: +row.length,
            datetime: new Date(row.datetime),
            hourFrac: new Date(row.datetime).getHours() + new Date(row.datetime).getMinutes() / 60,
            author: row.author,
            file: row.file,
            id: row.id,
            url: row.url
        }));

        console.log("CSV Loaded:", data); // Debugging log

        displayStats(data);
        createScatterplot(data);
    } catch (error) {
        console.error("Error loading CSV:", error);
    }
}

// Function to display summary statistics
function displayStats(data) {
    const avgLineLength = d3.mean(data, d => d.length);
    const longestLine = d3.max(data, d => d.length);

    // 🔹 Compute Average File Length
    const fileLengths = d3.rollups(
        data,
        v => d3.max(v, d => d.line), // Get max line number in each file
        d => d.file // Group by file
    );
    const avgFileLength = d3.mean(fileLengths, d => d[1]);

    // 🔹 Compute Most Active Day of the Week
    const dayCounts = d3.rollups(
        data,
        v => v.length, // Count commits per day
        d => new Date(d.datetime).getDay() // Group by weekday (0 = Sunday, 6 = Saturday)
    );

    const mostActiveDay = dayCounts.length > 0
        ? dayCounts.sort((a, b) => b[1] - a[1])[0][0] // Find day with max commits
        : null;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const mostActiveDayName = mostActiveDay !== null ? dayNames[mostActiveDay] : "N/A";

    console.log("Stats Computed:", { avgLineLength, longestLine, avgFileLength, mostActiveDayName });

    const summary = d3.select("#summary");

    summary.html(""); // Clear previous content

    const stats = [
        { label: "Average Line Length", value: avgLineLength.toFixed(2) },
        { label: "Longest Line", value: longestLine },
        { label: "Average File Length", value: avgFileLength.toFixed(2) },
        { label: "Most Active Day", value: mostActiveDayName }
    ];

    stats.forEach(stat => {
        const statContainer = summary.append("div").attr("class", "stat-box");
        statContainer.append("dt").text(stat.label);
        statContainer.append("dd").text(stat.value);
    });
}

// Function to create the scatterplot
function createScatterplot(data) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 40, left: 50 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("overflow", "visible");

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.datetime))
        .range([margin.left, width - margin.right])
        .nice();

    const yScale = d3.scaleLinear()
        .domain([24, 0]) // 🔹 Reverse Y-axis so 00:00 is at the top
        .range([height - margin.bottom, margin.top]);

    const [minLines, maxLines] = d3.extent(data, d => d.line);

    // 🔹 Use a square root scale for size to better reflect visual perception
    const rScale = d3.scaleSqrt()
        .domain([minLines, maxLines])
        .range([3, 30]); // 🔹 Min size 3, Max size 30

    // 🔹 Sort commits by total lines changed (largest first)
    const sortedData = data.sort((a, b) => b.line - a.line);

    // Append Grid Lines
    svg.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(yScale.ticks())
        .join("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "#ddd")
        .attr("stroke-dasharray", "4");

    // Append X axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    // Append Y axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
            .tickFormat(d => `${String(d).padStart(2, '0')}:00`));

    // Tooltip setup
    const tooltip = document.getElementById("commit-tooltip");

    function updateTooltipContent(commit) {
        const link = document.getElementById('commit-link');
        const date = document.getElementById('commit-date');
        const time = document.getElementById('commit-time');
        const author = document.getElementById('commit-author');
        const lines = document.getElementById('commit-lines');

        if (Object.keys(commit).length === 0) return;

        link.href = commit.url;
        link.textContent = commit.id;
        date.textContent = commit.datetime?.toLocaleDateString('en', { dateStyle: 'full' });
        time.textContent = commit.datetime?.toLocaleTimeString('en', { timeStyle: 'short' });
        author.textContent = commit.author;
        lines.textContent = commit.line;
    }

    function updateTooltipVisibility(isVisible) {
        tooltip.hidden = !isVisible;
    }

    function updateTooltipPosition(event) {
        tooltip.style.left = `${event.clientX}px`;
        tooltip.style.top = `${event.clientY}px`;
    }

    // Append dots with tooltip interaction
    svg.append("g")
        .selectAll("circle")
        .data(sortedData) // 🔹 Use sorted data
        .join("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", d => rScale(d.line)) // 🔹 Scale dot size based on lines edited
        .attr("fill", "steelblue")
        .style("fill-opacity", d => 0.2 + (0.5 * (1 - rScale(d.line) / 30))) // 🔹 Larger dots more transparent
        .on("mouseover", function (event, commit) { 
            d3.selectAll("circle").style("fill-opacity", d => 0.2 + (0.5 * (1 - rScale(d.line) / 30))); // Reset all dots' opacity
            d3.select(this)
                .style("fill-opacity", 1) // Highlight hovered dot
                .attr("r", d => rScale(d.line) + 3); // 🔹 Expand dot size without jumping

            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on("mousemove", function (event) {
            const [mouseX, mouseY] = d3.pointer(event);
            
            // Find the nearest commit to the mouse pointer
            const nearestCommit = d3.least(sortedData, d => {
                const dx = mouseX - xScale(d.datetime);
                const dy = mouseY - yScale(d.hourFrac);
                return Math.sqrt(dx * dx + dy * dy); // Distance formula
            });
        
            if (nearestCommit) {
                updateTooltipContent(nearestCommit);
                updateTooltipPosition(event);
            }
        })
        .on("mouseout", function () {
            d3.select(this)
                .style("fill-opacity", d => 0.2 + (0.5 * (1 - rScale(d.line) / 30))) // 🔹 Restore transparency dynamically
                .attr("r", d => rScale(d.line)); // 🔹 Reset dot size

            updateTooltipContent({});
            updateTooltipVisibility(false);
        });
}



// Run the function when the page loads
document.addEventListener("DOMContentLoaded", loadData);
