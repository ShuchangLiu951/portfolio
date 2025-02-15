async function loadData() {
    try {
        const data = await d3.csv("loc.csv", row => ({
            ...row,
            line: +row.line,
            depth: +row.depth,
            length: +row.length,
            datetime: new Date(row.datetime),
            hourFrac: new Date(row.datetime).getHours() + new Date(row.datetime).getMinutes() / 60
        }));

        console.log("CSV Loaded:", data); // Debugging log

        displayStats(data);
        createScatterplot(data);
    } catch (error) {
        console.error("Error loading CSV:", error);
    }
}

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
        .domain([24, 0]) // 🔹 Reverse the Y-axis domain
        .range([height - margin.bottom, margin.top]);

    
    // Append X axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));


    // Append Y axis (reversed order)
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
            .tickFormat(d => `${String(d).padStart(2, '0')}:00`));

    // Append grid lines
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

    // Append dots
    svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac)) // 🔹 Keep hour mapping correct
        .attr("r", 5)
        .attr("fill", "steelblue");
}


// Run the function when the page loads
document.addEventListener("DOMContentLoaded", loadData);
