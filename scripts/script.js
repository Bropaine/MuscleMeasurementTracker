$(document).ready(function () {
    renderLineChart();
    // Highlight muscle areas on hover
    $('#muscle-image').maphilight();

    // Handle clicks on muscle areas
    $('area').on('click', function (event) {
        event.preventDefault();
        let muscle = $(this).data('muscle');
        $('#selected-muscle').val(muscle);
        $('#measurement-modal').modal('show');
    });

    // Get all the parent rows
    const parentRows = document.querySelectorAll('.parent-row');

    // Add a click event listener to each parent row
    parentRows.forEach(row => {
        row.addEventListener('click', () => {
            // Remove the "selected" class from all the parent rows
            parentRows.forEach(row => row.classList.remove('selected'));

            // Add the "selected" class to the clicked parent row
            row.classList.add('selected');
        });
    });

    let measurements = JSON.parse(localStorage.getItem("measurements")) || {};

    updateTable();
    renderRadialChart();

    function saveMeasurements() {
        localStorage.setItem("measurements", JSON.stringify(measurements));
    }

    // Check if the device is in landscape mode
function isLandscape() {
    return window.innerWidth > window.innerHeight;
  }
  
  // Show the warning message if the device is in portrait mode
  if (!isLandscape()) {
    var warning = document.getElementById("landscape-warning");
    warning.style.display = "block";
  }
  

    function getRadialChartData() {
        const muscleGroups = Object.keys(measurements);
        const values = muscleGroups.map((muscle) => {
            const mostRecentEntry = measurements[muscle][measurements[muscle].length - 1];
            return [mostRecentEntry.value];
            
        }).flat();
        return {
            labels: muscleGroups,
            datasets: [{
                label: 'Muscle Measurements',
                data: values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)',
                ],
                borderColor: 'rgba(0,0,0,1)',
                borderWidth: 1
            }]
        };
    }

    function renderRadialChart() {
        const canvas = document.getElementById('radial-chart');
        const chartData = getRadialChartData();
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    suggestedMax: 15,
                    suggestedMin: 0
                }
            }
        };
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
        new Chart(canvas, {
            type: 'radar',
            data: chartData,
            options: chartOptions
        });
    }


    function getLineChartData(muscleData) {
        let labels = muscleData.map(entry => entry.date);
        let values = muscleData.map(entry => entry.value);
        if (muscleData.length === 1) {
            values = [muscleData[0].value, muscleData[0].value];
            labels = [muscleData[0].date,  muscleData[0].date];
        }
        return {
            labels,
            datasets: [{
                label: 'Muscle Measurements',
                data: values,
                borderColor: 'blue',
                fill: false,
            }]
        };
    }

    function renderLineChart(muscleData = []) {
        const canvas = document.getElementById('line-chart');
        const chartData = getLineChartData(muscleData);
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Measurement (in inches)'
                    }
                }
            }
        };
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
        new Chart(canvas, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
    }



    function updateTable() {
        let tableBody = document.querySelector("#measurement-data-table tbody");
        tableBody.innerHTML = "";

        for (let muscle in measurements) {
            let muscleData = measurements[muscle];
            let mostRecentEntry = muscleData[muscleData.length - 1];

            let row = document.createElement('tr');
            row.classList.add('main-row');

            row.innerHTML = `
<td>${muscle}</td>
<td>${mostRecentEntry.date}</td>
<td>${mostRecentEntry.value}</td>
<td>${(mostRecentEntry.value - muscleData[0].value).toFixed(2)} ${mostRecentEntry.value < muscleData[0].value ? '<span style="color: red;">(-)</span>' : ''}</td>

<td>${muscleData.length > 1 ? (mostRecentEntry.value - muscleData[muscleData.length - 2].value).toFixed(2) : '-'}</td>
`;
            tableBody.appendChild(row);

            let detailsRow = document.createElement('tr');
            let detailsCell = document.createElement('td');
            detailsCell.colSpan = 5;

            let details = document.createElement('details');
            let summary = document.createElement('summary');
            summary.style.display = 'none';
            details.appendChild(summary);

            let historyTable = document.createElement('table');
            historyTable.classList.add('table', 'table-striped', 'nested-history-table');

            // Clone table headers
            let headers = document.querySelector("#measurement-data-table thead").cloneNode(true);
            let headerCells = headers.querySelectorAll("th");
            headerCells.forEach(headerCell => headerCell.textContent = "");
            historyTable.appendChild(headers);

            muscleData.sort((a, b) => new Date(b.date) - new Date(a.date));

            for (let i = 0; i < muscleData.length - 1; i++) {
                let historyRow = document.createElement('tr');
                historyRow.innerHTML = `
<td class="title">${muscle}</td>
<td class="date">${muscleData[i].date}</td>
<td class="measurement">${muscleData[i].value}</td>
<td class="diff">${(muscleData[i].value - muscleData[0].value).toFixed(2)}</td>
<td class="inc_diff">${i > 0 ? (muscleData[i].value - muscleData[i - 1].value).toFixed(2) : '-'}</td>
`;
                historyTable.appendChild(historyRow);
            }

            details.appendChild(historyTable);
            detailsCell.appendChild(details);
            detailsRow.appendChild(detailsCell);
            tableBody.appendChild(detailsRow);

            row.addEventListener('click', function () {
                details.open = !details.open;
                if (details.open) {
                    renderLineChart(muscleData);
                    renderRadialChart(muscleData, muscle);
                } else {
                    // removeRadialChart(muscle);
                }
            });
        }
    }

    updateTable();

    // Call updateTable() after saving measurements in localStorage
    document.querySelector("#muscle-measurement-form").addEventListener("submit", function (event) {
        event.preventDefault();


        updateTable();
    });

    document.querySelector("#muscle-measurement-form").addEventListener("submit", function (event) {
        event.preventDefault();

        let muscle = document.querySelector("#selected-muscle").value;
        let date = document.querySelector("#measurement-date").value;
        let value = parseFloat(document.querySelector("#measurement-value").value);

        if (!measurements[muscle]) {
            measurements[muscle] = [];
        }

        measurements[muscle].push({ date, value });
        saveMeasurements();
        updateTable();

        this.reset();
        $('#measurement-modal').modal('hide');
    });
});