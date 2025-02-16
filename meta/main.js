let data = [];
let commits = d3.groups(data, (d) => d.commit);
let xScale;
let yScale;
async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), 
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
      }));
  
    displayStats();
    createScatterplot();

    
  }


  function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          writable: false,   
          enumerable: false,  
          configurable: false
        
        });
  
        return ret;
      });
  }


  function displayStats() {
    processCommits(); 

    const status = d3.select('#status');
    status.html(""); 

    const stats = [
        { label: "Commits", value: commits.length },
        { label: "Longest Line", value: Math.max(...commits.flatMap(commit => commit.lines.map(line => line.length))) },
        { label: "Total Files", value: getTotalFiles() },  
        { label: "Most Active Day", value: getMostActiveDay() }
    ];

    stats.forEach(stat => {
        const statContainer = status.append("dl").attr("class", "stat-box");
        statContainer.append("dt").text(stat.label);
        statContainer.append("dd").text(stat.value);
    });
}


function getTotalFiles() {
    const uniqueFiles = new Set(commits.flatMap(commit => commit.lines.map(line => line.file)));
    return uniqueFiles.size;
}

function getMostActiveDay() {
    const dayCounts = d3.rollups(commits, v => v.length, d => new Date(d.datetime).getDay());
    const mostActiveDay = dayCounts.length > 0 ? dayCounts.sort((a, b) => b[1] - a[1])[0][0] : null;
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return mostActiveDay !== null ? dayNames[mostActiveDay] : "N/A";
}




document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});





 function createScatterplot(){
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 30 };

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
  .scaleSqrt() 
  .domain([minLines, maxLines])
  .range([2, 30]);


  
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);


    const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');



  xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, width])
  .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);


  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);


  
const xAxis = d3.axisBottom(xScale);
const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');



svg
  .append('g')
  .attr('transform', `translate(0, ${usableArea.bottom})`)
  .call(xAxis);


svg
  .append('g')
  .attr('transform', `translate(${usableArea.left}, 0)`)
  .call(yAxis);



const dots = svg.append('g').attr('class', 'dots');

dots
  .selectAll('circle')
  .data(sortedCommits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', 5)
  .attr('fill', 'steelblue')
  .attr('r', (d) => rScale(d.totalLines))
  .style('fill-opacity', 0.7) 

dots.selectAll('circle')
    .on('mouseenter',  (event, commit) => { 
        updateTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
        d3.select(event.currentTarget).style('fill-opacity', 1);
    })
    .on('mouseleave', () => {
        updateTooltipContent({});
        updateTooltipVisibility(false);
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
    });



  
const gridlines = svg
.append('g')
.attr('class', 'gridlines')
.attr('transform', `translate(${usableArea.left}, 0)`);


gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

brushSelector();
 }






 function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    //console.log(link)
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
  }


  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }

  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }


  function brushSelector() {
    const svg = document.querySelector('svg');
    d3.select(svg).call(d3.brush().on('start brush end', brushed));
        // Create brush

// Raise dots and everything after overlay
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
  }



  let brushSelection = null;

  function brushed(event) {
    brushSelection = event.selection;
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
  }
  
  function isCommitSelected(commit) {
    if (!brushSelection) {
      return false;
    }
    const min = { x: brushSelection[0][0], y: brushSelection[0][1] }; 
    const max = { x: brushSelection[1][0], y: brushSelection[1][1] }; 
    const x = xScale(commit.date); const y = yScale(commit.hourFrac); 
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y; 
}
  
  function updateSelection() {
    // Update visual state of dots based on selection
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
  }

  function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }



  function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
        ? commits.filter(isCommitSelected)
        : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }

    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type
    );

    // Update DOM with breakdown
    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

        const div = document.createElement("div");
        div.classList.add("language-stat");
        div.innerHTML = `
            <dt>${language}</dt>
            <dd>${count} lines</dd>
            <span>(${formatted})</span>
        `;
        container.appendChild(div);
    }

    return breakdown;
}
