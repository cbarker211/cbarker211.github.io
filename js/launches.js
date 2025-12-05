// Constants
const startYear = 1955;
const endYear = 2024;
const totalMonths = (endYear - startYear + 1) * 12 - 1;
const toggleButton = document.getElementById('toggleTableButton');
const tableBody = document.getElementById('launchTableBody');
//Variables
let globe;
let siteDataMap = {};
let startDate, endDate;
var slider = document.getElementById('slider');
var yearSelect1 = document.getElementById('year-select1');
var yearSelect2 = document.getElementById('year-select2');
var monthSelect1 = document.getElementById('month-select1');
var monthSelect2 = document.getElementById('month-select2');
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function indexToDate(index) {
    const year = startYear + Math.floor(index / 12);
    const monthIndex = Math.floor(Number(index)) % 12; // 0–11
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[monthIndex]} ${year}`;
}

function updateSiteTable(site) {
    const table = document.getElementById('site-table');
    table.innerHTML = `<tr><th>Property</th><th>Value</th></tr>`;

    const cleanedLaunches = site.labels.map(label => label.replace(/^Launch\s+/, ''));

    const launchesHTML = `
        <div style="
            max-height: 150px; 
            overflow-y: auto; 
            padding: 4px; 
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.05);
        ">
            ${cleanedLaunches.join('<br>')}
        </div>
    `;

    const rows = [
        ['Name', site.name],
        ['Latitude', site.lat],
        ['Longitude', site.lon],
        ['Number of Launches', site.labels.length],
        ['Launches', launchesHTML],
    ];

    rows.forEach(([prop, val]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="wrap-text">${prop}</td><td class="wrap-text">${val}</td>`;
        table.appendChild(tr);
    });
}

function intToDateString(monthIndex, isEnd = false) {
    const year = startYear + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;

    let day;
    if (isEnd) {
        // Last day of month: create date for the first day of next month, then subtract 1 day
        day = new Date(Date.UTC(year, month + 1, 0)); // UTC ensures no timezone shift
    } else {
        // First day of month
        day = new Date(Date.UTC(year, month, 1));
    }

    // Format as YYYY-MM-DD
    const yyyy = day.getUTCFullYear();
    const mm = String(day.getUTCMonth() + 1).padStart(2, '0'); // month is 0-indexed
    const dd = String(day.getUTCDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

function fromMonthIndex(index) {
    const year = startYear + Math.floor(index / 12);
    const month = (index % 12) + 1; // 1–12
    return { year, month };
}

function toMonthIndex(year, month) {
    return (year - startYear) * 12 + (month - 1);
}

// Main functions

noUiSlider.create(slider, {
    start: [780, 839],
    connect: true,
    step: 1,
    range: {
        min: 0,
        max: totalMonths,
    },
    tooltips: [        
        {
            to: value => indexToDate(value),
            from: () => 0
        },
        {
            to: value => indexToDate(value),
            from: () => 0
        }
    ],
    format: {
        to: value => Math.round(value),
        from: value => Number(value)
    },
    pips: {
        mode: 'steps',
        density: 100,
        filter: function(value) {
            // Show label only every 30 months (5 years)
            if (value % 60 === 0) return 1;  // every 5 years → major tick + label
            if (value % 12 === 0) return 2;  // every 1 year → minor tick
            return 0;   
        },
        format: {
            to: function(value) {
                // label only for year start (Jan)
                return value % 60 === 0 ? (startYear + value / 12) : '';
            }
        }
    }
});

// Append the option elements
for (var i = 1957; i <= 2024; i++) {

    var option1 = document.createElement("option");
    option1.text = i;
    option1.value = i;

    var option2 = document.createElement("option");
    option2.text = i;
    option2.value = i;

    yearSelect1.appendChild(option1);
    yearSelect2.appendChild(option2);
}

months.forEach((month, index) => {
var option1 = document.createElement("option");
option1.text = month;
option1.value = index + 1; // 1 = Jan, 12 = Dec

var option2 = document.createElement("option");
option2.text = month;
option2.value = index + 1;

monthSelect1.appendChild(option1);
monthSelect2.appendChild(option2);
});

function updateSliderFromSelects() {
    console.log(yearSelect1.value,yearSelect2.value,monthSelect1.value,monthSelect2.value)
    // Convert month/year to an index (months since startYear)
    let startMonthIndex =
        (yearSelect1.value - startYear) * 12 + (monthSelect1.value - 1);
    let endMonthIndex =
        (yearSelect2.value - startYear) * 12 + (monthSelect2.value - 1);

    if (endMonthIndex <= startMonthIndex) {
        endMonthIndex = startMonthIndex + 1;

        // Update the selects so UI reflects the change
        let newEndYear = startYear + Math.floor(endMonthIndex / 12);
        let newEndMonth = (endMonthIndex % 12) + 1;

        yearSelect2.value = newEndYear;
        monthSelect2.value = newEndMonth;
    }

    slider.noUiSlider.set([startMonthIndex, endMonthIndex]);

    startDate = intToDateString(startMonthIndex);
    endDate = intToDateString(endMonthIndex, true);
    console.log(startDate, endDate,'Update');
    fetchEventsData();
}

yearSelect1.addEventListener('change', updateSliderFromSelects);
monthSelect1.addEventListener('change', updateSliderFromSelects);
yearSelect2.addEventListener('change', updateSliderFromSelects);
monthSelect2.addEventListener('change', updateSliderFromSelects);

function populateFilters(launches) {
    // Get unique values from filtered_launches for each filter
    const locations = [...new Set(launches.text)];
    const rockets = [...new Set(launches.rocket)];
    const smcValues = [...new Set(launches.smc)];

    // Function to populate checkboxes inside a given filter dropdown
    function populateCheckboxes(filterId, values) {
        const dropdown = document.getElementById(filterId);
        const ul = dropdown.querySelector('ul');
        ul.innerHTML = ''; // Clear any previous entries

        values.forEach(value => {
            const li = document.createElement('li');
            li.innerHTML = `<label><input type="checkbox" value="${value}" /> ${value}</label>`;
            ul.appendChild(li);
        });
    }

    // Populate each filter
    populateCheckboxes('locationFilter', locations.sort());
    populateCheckboxes('rocketFilter',   rockets.sort());
    populateCheckboxes('smcFilter', smcValues);
}

function filterlaunches(all_launches) {

    function getSelectedfilters(filter) {
        const var_filter = document.getElementById(filter);
        const checkboxes = var_filter.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.value);
    }

    // Get selected values from each filter
    const selectedLocations = getSelectedfilters('locationFilter');
    const selectedRockets   = getSelectedfilters('rocketFilter');
    const selectedSmc       = getSelectedfilters('smcFilter');

    // Find indices to keep based on selected filters
    let indicesToKeep = [...Array(all_launches.date.length).keys()];  // All indices initially

    // Filter by location
    if (selectedLocations.length > 0) {
        indicesToKeep = indicesToKeep.filter(i => selectedLocations.includes(all_launches.text[i]));
    }

    // Filter by rocket
    if (selectedRockets.length > 0) {
        indicesToKeep = indicesToKeep.filter(i => selectedRockets.includes(all_launches.rocket[i]));
    }

    // Filter by SMC
    if (selectedSmc.length > 0) {
        indicesToKeep = indicesToKeep.filter(i => selectedSmc.includes(all_launches.smc[i]));
    }

    // Filter the column arrays using the indicesToKeep
    const filteredData = {
        date: indicesToKeep.map(i => all_launches.date[i]),
        time: indicesToKeep.map(i => all_launches.time[i]),
        lat: indicesToKeep.map(i => all_launches.lat[i]),
        lon: indicesToKeep.map(i => all_launches.lon[i]),
        text: indicesToKeep.map(i => all_launches.text[i]),
        id: indicesToKeep.map(i => all_launches.id[i]),
        rocket: indicesToKeep.map(i => all_launches.rocket[i]),
        smc: indicesToKeep.map(i => all_launches.smc[i] ? "Yes" : "No"),
        BC: indicesToKeep.map(i => all_launches.BC[i]),
        CO: indicesToKeep.map(i => all_launches.CO[i]),
        CO2: indicesToKeep.map(i => all_launches.CO2[i]),
        H2O: indicesToKeep.map(i => all_launches.H2O[i]),
        Al2O3: indicesToKeep.map(i => all_launches.Al2O3[i]),
        Cly: indicesToKeep.map(i => all_launches.Cly[i]),
        NOx: indicesToKeep.map(i => all_launches.NOx[i]),
    };

    // Update the visualizations with the filtered data
    updateVisualizations(filteredData);
}

async function fetchEventsData() {
    try {
        // Fetch the data from the API (replace with your actual API URL)
        // Data is in tonnes in json files.
        const response = await fetch(`https://cbarker.pythonanywhere.com/api/launches?start_date=${startDate}&end_date=${endDate}`); // Replace with your actual API URL
        const launchData = await response.json();
        
        all_launches = {
            date: [],
            time: [],
            lat: [],
            lon: [],
            text: [],
            id: [],
            rocket: [],
            smc: [],
            BC: [],
            CO: [],
            CO2: [],
            H2O: [],
            Al2O3: [],
            Cly: [],
            NOx: []
        };

        Object.keys(launchData).forEach(date => {
            launchData[date].launches.forEach(launch => {
                all_launches.date.push(launch.date);
                all_launches.time.push(launch.time);
                all_launches.lat.push(parseFloat(launch.lat));
                all_launches.lon.push(parseFloat(launch.lon));
                all_launches.text.push(launch.location);
                all_launches.id.push(launch.id);
                all_launches.rocket.push(launch.rocket);
                all_launches.smc.push(launch.smc.toString());
                all_launches.BC.push(launch.emissions.BC);
                all_launches.CO.push(launch.emissions.CO);
                all_launches.CO2.push(launch.emissions.CO2);
                all_launches.H2O.push(launch.emissions.H2O);
                all_launches.Al2O3.push(launch.emissions.Al2O3);
                all_launches.Cly.push(launch.emissions.Cly);
                all_launches.NOx.push(launch.emissions.NOx);
            });
        });
        
        populateFilters(all_launches);
        updateVisualizations(all_launches);

    } catch (error) {
        console.error('Error fetching or processing the events data:', error);
    }
}

function updateVisualizations(filtered_launches) {
    updateTables(filtered_launches);
    updateGraph(filtered_launches);
    updateGlobe(filtered_launches);
    updateStack(filtered_launches);
}

const prettyNames = {
    BC: 'BC',
    CO: 'CO',
    CO2: 'CO<sub>2</sub>',
    H2O: 'H<sub>2</sub>O',
    Al2O3: 'Al<sub>2</sub>O<sub>3</sub>',
    Cly: 'Cl<sub>y</sub>',
    NOx: 'NO<sub>x</sub>'
};

const strongColors = {
    BC: 'rgba(0,0,0,1)',
    CO: '#A820A8',
    CO2: '#969696',
    H2O: '#2c20c9',
    Al2O3: '#c40000',
    Cly: '#1cba26',
    NOx: '#c99b24'
};

async function updateGlobe(filtered_launches) {

    // Step 1: Group launches by site (lat/lon + site name as key)
    const siteMap = {};
    filtered_launches.lat.forEach((lat, i) => {
        const lon = filtered_launches.lon[i];
        const site = filtered_launches.text[i];  // launch site name
        const id = filtered_launches.id[i];
        const vehicle = filtered_launches.rocket[i];
        const key = `${site}`;

        if (!siteMap[key]) {
            siteMap[key] = {
            lat: lat,
            lon,
            name: site,
            labels: []
            };
        }

        siteMap[key].labels.push(`Launch ${id} - ${vehicle}`);
    });

    // Step 2: Convert to array
    const labelSites = Object.values(siteMap).sort((a, b) => a.lat - b.lat);
    const OPACITYPATH  = 0.3;
    const minimalSites = labelSites.map(s => ({
        lat: s.lat,
        lon: s.lon,
        name: s.name,
        altitude: 0.05 + 0.0005 * s.labels.length
    }));

    siteDataMap = {};
    labelSites.forEach(s => siteDataMap[s.name] = s);

    if (!globe) {
        globe = new Globe(document.getElementById('globe'))
            .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
            .showGraticules(true)
            .showAtmosphere(false)
            .backgroundColor('rgba(0,0,0,0)')
            .pointLat(d => d.lat)
            .pointLng(d => d.lon)
            .pointColor(() => `rgba(0, 255, 0, ${OPACITYPATH})`)
            .pointRadius(0.4)
            .pointAltitude(d => d.altitude) 
            .labelLat(d => d.lat)
            .labelLng(d => d.lon)
            .labelText(d => d.name)
            .labelResolution(2)
            .labelsTransitionDuration(0)
            .labelSize(1)
            .labelDotRadius(0)
            .onPointClick(site => {
                updateSiteTable(siteDataMap[site.name]);
                globe.labelsData([site]);
            })
        
        setTimeout(() => {
            globe.pointOfView({ lat: 35, lng: -95, altitude: 1.5 }, 1000);
        }, 0);};

    globe.pointsData(minimalSites);
}

function updateTables(filtered_launches) {
    
    const table1Body = document.getElementById('launchTableBody');
    const table1Foot = document.getElementById('launchTableFoot');
    table1Body.innerHTML = '';
    table1Foot.innerHTML = '';
    let totalBC = 0, totalCO = 0, totalCO2 = 0, totalH2O = 0;
    let totalAl2O3 = 0, totalCly = 0, totalNOx = 0;
    filtered_launches.id.forEach((location, index) => {
        const row = document.createElement('tr');
        const CO = filtered_launches.CO[index];
        const CO2 = filtered_launches.CO2[index];
        const H2O = filtered_launches.H2O[index];
        const BC = filtered_launches.BC[index];
        const Al2O3 = filtered_launches.Al2O3[index];
        const Cly = filtered_launches.Cly[index];
        const NOx = filtered_launches.NOx[index];
        totalCO    += CO;
        totalCO2   += CO2;
        totalH2O   += H2O;
        totalBC    += BC;
        totalAl2O3 += Al2O3;
        totalNOx   += NOx;
        totalCly   += Cly;
        
        row.innerHTML = `
            <td>${filtered_launches.date[index]}</td>
            <td>${location}</td>
            <td>${filtered_launches.time[index].toFixed(2)}</td>
            <td class="wrap-text">${filtered_launches.text[index]}</td>
            <td class="wrap-text">${filtered_launches.rocket[index]}</td>
            <td>${filtered_launches.smc[index]}</td>
            <td>${filtered_launches.BC[index].toFixed(1)}</td>
            <td>${filtered_launches.CO[index].toFixed(1)}</td>
            <td>${filtered_launches.CO2[index].toFixed(1)}</td>
            <td>${filtered_launches.H2O[index].toFixed(1)}</td>
            <td>${filtered_launches.Al2O3[index].toFixed(1)}</td>
            <td>${filtered_launches.Cly[index].toFixed(1)}</td>
            <td>${filtered_launches.NOx[index].toFixed(1)}</td>
        `;
        table1Body.appendChild(row);
    });
    // Add Totals to Launch Table
    const totalRow1 = document.createElement('tr');
    totalRow1.innerHTML = `
        <td>Total</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>${totalBC.toFixed(1)}</td>
        <td>${totalCO.toFixed(1)}</td>
        <td>${totalCO2.toFixed(1)}</td>
        <td>${totalH2O.toFixed(1)}</td>
        <td>${totalAl2O3.toFixed(1)}</td>
        <td>${totalCly.toFixed(1)}</td>
        <td>${totalNOx.toFixed(1)}</td>
    `;
    table1Foot.appendChild(totalRow1);
}

function updateGraph(filtered_launches) {

    const totals = {
        BC: 0,
        CO: 0,
        CO2: 0,
        H2O: 0,
        Al2O3: 0,
        Cly: 0,
        NOx: 0
    };
    filtered_launches.id.forEach((location, index) => {
        totals.BC    += filtered_launches.BC[index];
        totals.CO    += filtered_launches.CO[index];
        totals.CO2   += filtered_launches.CO2[index];
        totals.H2O   += filtered_launches.H2O[index];
        totals.Al2O3 += filtered_launches.Al2O3[index];
        totals.Cly   += filtered_launches.Cly[index];
        totals.NOx   += filtered_launches.NOx[index];
    });
    
    // Prepare the data for Plotly
    const maxYValue = Object.values(totals).reduce((sum, val) => sum + val, 0);
    
    const trace = Object.keys(totals).map(key => ({
        x: ['Total'],
        y: [totals[key] / 1000],
        name: prettyNames[key],
        type: 'bar',
        marker: {color: strongColors[key]}
    }));
    
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        autosize: true,
        font: { color: 'white', family: 'Space Grotesk, sans-serif', size: 14}, // general font
        legend: { 
            orientation: 'v',
            x: 1.05, 
            y: 1, 
            itemwidth: 3, 
            font: { 
            color: 'white', 
            size: 13, 
            family: 'Space Grotesk, sans-serif'
            }
        },
        title: {
            text: 'Total Emissions [kt]',
            xref: 'paper',
            xanchor: 'center',
            yref:'paper',
            y: 1,
            pad: { t: -30 }},
        barmode: 'stack',
        hovermode: 'closest',
        yaxis: {
            range: [0,maxYValue / 1000]
        },
        margin: { t: 70, r: 40, b: 20, l: 40 } 
    };

    // Plot the chart inside the 'emissionsChart' div
    Plotly.react('bar', trace, layout, {responsive: true, displayModeBar: true });

}

function updateStack(filtered_launches) {

    const species = ['BC', 'CO', 'CO2', 'H2O', 'Al2O3', 'Cly', 'NOx'];
    const monthlySums = {};
    
    function monthRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
    
        // Normalize both to the first day of their month
        const startUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
        const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    
        const months = [];
        const current = new Date(startUTC);
    
        while (current <= endUTC) {
            const year = current.getUTCFullYear();
            const month = String(current.getUTCMonth() + 1).padStart(2, "0");
            months.push(`${year}-${month}`);
    
            // Move to next month
            current.setUTCMonth(current.getUTCMonth() + 1);
        }
    
        return months;
    }
    
    const allMonths = monthRange(startDate,endDate);

    // Zero the monthly emissions
    allMonths.forEach(m => {
        monthlySums[m] = {};
        species.forEach(sp => monthlySums[m][sp] = 0);
    });

    for (let i = 0; i < filtered_launches.date.length; i++) {
        const month = filtered_launches.date[i].slice(0, 7); // 'YYYY-MM'
        species.forEach(sp => {
            monthlySums[month][sp] += Number(filtered_launches[sp][i]) || 0;
        });
    }

    const months = Object.keys(monthlySums).sort();
    const maxYValue = Math.max(...months);

    const traces = species.map(sp => ({
        x: months,
        y: months.map(m => monthlySums[m][sp] / 1000),
        stackgroup: 'one',
        name: prettyNames[sp],
        type: 'scatter',
        mode: 'none',
        fillcolor: strongColors[sp]
    }));

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        autosize: true,
        font: { color: 'white', family: 'Space Grotesk, sans-serif', size: 14}, // general font
        legend: { 
            orientation: 'v',
            x: 1.05, 
            y: 1, 
            itemwidth: 3, 
            font: { 
            color: 'white', 
            size: 13, 
            family: 'Space Grotesk, sans-serif'
            }
        },
        title: {
            text: 'Monthly Emissions (click legend to show/hide species)',
            xref: 'paper',
            xanchor: 'center',
            yref:'paper',
            y: 1,
            pad: { t: -30 }},
        yaxis: {
            title: {
                text: 'Mass [kilotonnes]',
            },
            range: [0,maxYValue / 1000]
        },
        hovermode: 'closest',
        margin: {t: 70, r: 40, b: 20,l: 40}
    };
    Plotly.react('stack', traces , layout, {responsive: true, displayModeBar: true });

}

// Events

slider.noUiSlider.on('update', (values, handle) => {
    const startIndex = Math.round(values[0]);
    const endIndex = Math.round(values[1]);

    // Update the selects to match the slider
    const start = fromMonthIndex(startIndex);
    const end = fromMonthIndex(endIndex);

    monthSelect1.value = start.month;
    yearSelect1.value = start.year;
    monthSelect2.value = end.month;
    yearSelect2.value = end.year;
});

slider.noUiSlider.on('slide', (values, handle) => {
    const minSelectableIndex = (1957 - startYear) * 12; // January 1957
    const maxSelectableIndex = totalMonths;

    let value = Math.round(values[handle]);
    if (value < minSelectableIndex) {
        value = minSelectableIndex;
    } else if (value > maxSelectableIndex) {
        value = maxSelectableIndex;
    }

    // Set the slider handle back to the restricted value
    slider.noUiSlider.setHandle(handle, value);
});

slider.noUiSlider.on('end', (values) => {
    const startIndex = Math.round(values[0]);
    const endIndex = Math.round(values[1]);

    startDate = intToDateString(startIndex);
    endDate = intToDateString(endIndex, true);
    console.log(startDate, endDate,'End');
    fetchEventsData();
});

document.addEventListener('DOMContentLoaded', async () => {

    const daterange = slider.noUiSlider.get();
    startDate = intToDateString(Number(daterange[0]));
    endDate = intToDateString(Number(daterange[1]),true);
    console.log(startDate, endDate,'DOM');
    fetchEventsData(); // Fetch data for the default date

    document.getElementById('applyFilters').addEventListener('click', () => {
        filterlaunches(all_launches);
    });

    const tabEls = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabEls.forEach(function (tab) {
        tab.addEventListener('shown.bs.tab', function (event) {
            const activatedTabId = event.target.id;
            if (activatedTabId === 'chart-tab') {
                // Resize your Plotly charts
                Plotly.Plots.resize(document.getElementById('stack'));
                Plotly.Plots.resize(document.getElementById('bar'));
            }
            if (activatedTabId === 'globe-tab') {
                // Resize your Globe.gl renderer (assuming you have one)
                if (window.globe) {
                    const container = document.getElementById('globe');
                    const screenHeight = window.innerHeight;
                    const globeHeight = screenHeight * 0.52 - 30;
                    const globeWidth = container.offsetWidth - 30;
                    globe.width(globeWidth).height(globeHeight);
                    
                    // Manually reset the canvas element size to match the container size
                    const canvas = document.querySelector('#globe canvas');
                    if (canvas) {
                        canvas.style.width = `${globeWidth}px`;
                        canvas.style.height = `${globeHeight}px`;
                        canvas.style.transform = 'none';
                    }	
                }
            }
        });
    });
});

toggleButton.addEventListener('click', () => {
    const isHidden = tableBody.style.display === 'none';
    tableBody.style.display = isHidden ? 'table-row-group' : 'none';
    toggleButton.innerHTML = isHidden ? '&#9660;' : '&#9650;'; // Down arrow when shown, up arrow when hidden
});

document.querySelectorAll('.filter').forEach(filter => {
    filter.addEventListener('click', e => {
        // Prevent toggling when clicking inside dropdown list itself
        if (e.target.closest('.dropdown ul')) return;

        // Close other open dropdowns first (optional)
        document.querySelectorAll('.filter.open').forEach(openFilter => {
        if (openFilter !== filter) openFilter.classList.remove('open');
        });

        // Toggle current filter open class
        filter.classList.toggle('open');
    });
});

document.addEventListener('click', e => {
    if (!e.target.closest('.filter')) {
        document.querySelectorAll('.filter.open').forEach(openFilter => {
        openFilter.classList.remove('open');
        });
    }
});

// Starfield
const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
const numStars = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: numStars }, () => ({
        x: (Math.random() - 0.5) * canvas.width,
        y: (Math.random() - 0.5) * canvas.height,
        z: Math.random() * canvas.width
    }));
}

resize();
let resizeTimeout;

window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 300);
});

function animate() {
    ctx.fillStyle = "rgba(5,7,15,0.5)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.beginPath();
    for (let star of stars) {
        star.z -= 2;
        if (star.z <= 0) star.z = canvas.width;

        const k = 128.0 / star.z;
        const px = star.x * k + canvas.width / 2;
        const py = star.y * k + canvas.height / 2;

        if (px < 0 || px > canvas.width || py < 0 || py > canvas.height) continue;

        const starScale = 1 - star.z / canvas.width;
        const size = starScale * 2;

        ctx.moveTo(px, py);
        ctx.arc(px, py, size, 0, Math.PI*2);
    }
    ctx.fillStyle = "white";
    ctx.fill();

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);