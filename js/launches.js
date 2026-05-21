// Constants
const startYear = 1955;
const endYear = 2025;
const totalMonths = (endYear - startYear + 1) * 12 - 1;
const toggleButton = document.getElementById('toggleTableButton');
const tableBody = document.getElementById('launchTableBody');

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

//Variables
let siteDataMap = {};
let startDate, endDate;
let timeAggregation = "annual";
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
    table.innerHTML = `<tr><th>Property</th><th>Value [click on launch site to load]</th></tr>`;

    const cleanedLaunches = site.labels.map(label => label.replace(/^Launch\s+/, ''));

    const launchesHTML = `
        <div style="
            max-height: 40vh; 
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
    start: [24, 851],
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
for (var i = 1957; i <= 2025; i++) {

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


function resetFilters(all_launches) {

    function resetCheckboxes(filterId, defaultCheckedValue = null) {
        const filter = document.getElementById(filterId);
        const checkboxes = filter.querySelectorAll('input[type="checkbox"]');

        checkboxes.forEach(cb => {
            // Check only the default value (if provided), otherwise uncheck all
            cb.checked = (defaultCheckedValue !== null && cb.value === defaultCheckedValue);
        });
    }

    // Reset each filter
    resetCheckboxes('locationFilter');
    resetCheckboxes('rocketFilter');
    resetCheckboxes('smcFilter');
    resetCheckboxes('altitudeFilter', '0-80 km'); // restore default

    // Re-run filtering or show all data
    filterlaunches(all_launches);
}

function populateFilters(launches) {
    // Get unique values from filtered_launches for each filter
    const locations = [...new Set(launches.text)];
    const rockets = [...new Set(launches.rocket)];
    const smcValues = [...new Set(launches.smc)];

    // Function to populate checkboxes inside a given filter dropdown
    function populateCheckboxes(filterId, values, defaultCheckedValue = null) {
        const dropdown = document.getElementById(filterId);
        const ul = dropdown.querySelector('ul');
        ul.innerHTML = ''; // Clear any previous entries

        values.forEach(value => {
            // Only check the box if it matches the defaultCheckedValue
            const checked = value === defaultCheckedValue ? 'checked' : '';
            const li = document.createElement('li');
            li.innerHTML = `<label><input type="checkbox" value="${value}" ${checked} /> ${value}</label>`;
            ul.appendChild(li);
        });
    }

    // Populate each filter
    populateCheckboxes('locationFilter', locations.sort());
    populateCheckboxes('rocketFilter',   rockets.sort());
    populateCheckboxes('smcFilter', smcValues);
    populateCheckboxes('altitudeFilter', ['0-80 km', '>80 km'], '0-80 km');
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
    const selectedAltitudes = getSelectedfilters('altitudeFilter');

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
    };

    // Include emissions based on selected altitude ranges
    const includeLow = selectedAltitudes.includes('0-80 km');
    const includeHigh = selectedAltitudes.includes('>80 km');
    const includeAllAltitudes = selectedAltitudes.length === 0;  // If no filter selected

    filteredData.BC = [];
    filteredData.CO = [];
    filteredData.CO2 = [];
    filteredData.H2O = [];
    filteredData.Al2O3 = [];
    filteredData.Cly = [];
    filteredData.NOx = [];

    indicesToKeep.forEach(i => {
        // Sum emissions per launch
        const BC   = ((includeAllAltitudes || includeLow) ? all_launches.BC[i] : 0)
                   + ((includeAllAltitudes || includeHigh) ? all_launches.BCabove[i] : 0);
        const CO   = ((includeAllAltitudes || includeLow) ? all_launches.CO[i] : 0)
                   + ((includeAllAltitudes || includeHigh) ? all_launches.COabove[i] : 0);
        const CO2  = ((includeAllAltitudes || includeLow) ? all_launches.CO2[i] : 0)
                   + ((includeAllAltitudes || includeHigh) ? all_launches.CO2above[i] : 0);
        const H2O  = ((includeAllAltitudes || includeLow) ? all_launches.H2O[i] : 0)
                   + ((includeAllAltitudes || includeHigh) ? all_launches.H2Oabove[i] : 0);
        const Al2O3 = ((includeAllAltitudes || includeLow) ? all_launches.Al2O3[i] : 0)
                    + ((includeAllAltitudes || includeHigh) ? all_launches.Al2O3above[i] : 0);
        const Cly  = ((includeAllAltitudes || includeLow) ? all_launches.Cly[i] : 0)
                   + ((includeAllAltitudes || includeHigh) ? all_launches.Clyabove[i] : 0);
        const NOx  = ((includeAllAltitudes || includeLow) ? all_launches.NOx[i] : 0)
                   + ((includeAllAltitudes || includeHigh) ? all_launches.NOxabove[i] : 0);

        filteredData.BC.push(BC);
        filteredData.CO.push(CO);
        filteredData.CO2.push(CO2);
        filteredData.H2O.push(H2O);
        filteredData.Al2O3.push(Al2O3);
        filteredData.Cly.push(Cly);
        filteredData.NOx.push(NOx);
    });

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
            NOx: [],
            BCabove: [],
            COabove: [],
            CO2above: [],
            H2Oabove: [],
            Al2O3above: [],
            Clyabove: [],
            NOxabove: []
        };

        Object.keys(launchData).forEach(date => {
            launchData[date].launches.forEach(launch => {
                all_launches.date.push(launch.date);
                all_launches.time.push(launch.time);
                all_launches.lat.push(parseFloat(launch.lat));
                all_launches.lon.push(parseFloat(launch.lon));
                all_launches.text.push(launch.location);
                all_launches.id.push(launch.id);
                all_launches.rocket.push(
                    launch.variant === "-" ? launch.rocket : launch.rocket + " " + launch.variant
                  );
                all_launches.smc.push(launch.smc.toString());
                all_launches.BC.push(parseFloat(launch.emissions.BC));
                all_launches.CO.push(parseFloat(launch.emissions.CO));
                all_launches.CO2.push(parseFloat(launch.emissions.CO2));
                all_launches.H2O.push(parseFloat(launch.emissions.H2O));
                all_launches.Al2O3.push(parseFloat(launch.emissions.Al2O3));
                all_launches.Cly.push(parseFloat(launch.emissions.Cly));
                all_launches.NOx.push(parseFloat(launch.emissions.NOx));
                all_launches.BCabove.push(parseFloat(launch.emissions_above.BC));
                all_launches.COabove.push(parseFloat(launch.emissions_above.CO));
                all_launches.CO2above.push(parseFloat(launch.emissions_above.CO2));
                all_launches.H2Oabove.push(parseFloat(launch.emissions_above.H2O));
                all_launches.Al2O3above.push(parseFloat(launch.emissions_above.Al2O3));
                all_launches.Clyabove.push(parseFloat(launch.emissions_above.Cly));
                all_launches.NOxabove.push(parseFloat(launch.emissions_above.NOx));
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
    updateMap(filtered_launches);
    updateStack(filtered_launches);
}

async function fetchAllDataForKeyMetrics() {
    try {
        const response = await fetch(
            `https://cbarker.pythonanywhere.com/api/launches?start_date=1957-01-01&end_date=2025-12-31`
        );

        const launchData = await response.json();

        console.log("Dates returned:", Object.keys(launchData).length);
        console.log("Total launches raw:", Object.values(launchData).reduce((sum, d) => sum + d.launches.length, 0));

        const all = {
            date: [],
            rocket: [],
            smc: [],
            BC: [],
        };

        Object.keys(launchData).forEach(date => {
            launchData[date].launches.forEach(launch => {
                all.date.push(launch.date);

                all.rocket.push(
                    launch.variant === "-" 
                        ? launch.rocket 
                        : launch.rocket + " " + launch.variant
                );

                all.smc.push(launch.smc.toString());

                const includeLow = true;   // default matches UI
                const includeHigh = false;
                
                const BC =
                    (includeLow ? parseFloat(launch.emissions.BC) : 0) +
                    (includeHigh ? parseFloat(launch.emissions_above.BC) : 0);
                

                all.BC.push(BC);
            });
        });

        console.log(new Set(all.date).size, all.date.length);

        updateKeyMetrics(all);

    } catch (error) {
        console.error("Error loading full dataset:", error);
    }
}

function updateKeyMetrics(data) {

    const totalLaunches = data.date.length;

    // --- Total BC (kt) ---
    const totalBC = data.BC.reduce((a, b) => a + b, 0) / 1000;

    // --- % from megaconstellations (SMC) in 2025 ---
    let totalBC_2025 = 0;
    let smcBC_2025 = 0;

    data.date.forEach((date, i) => {
        if (date.startsWith("2025")) {
            const val = data.BC[i];
            totalBC_2025 += val;

            if (data.smc[i] === true || data.smc[i] === "true") {
                smcBC_2025 += val;
            }
        }
    });

    const smcPercent = totalBC_2025 > 0
        ? (smcBC_2025 / totalBC_2025) * 100
        : 0;


    const yearlyLaunches = {};

    data.date.forEach((date) => {
        const year = date.slice(0, 4);
        if (!yearlyLaunches[year]) yearlyLaunches[year] = 0;
        yearlyLaunches[year] += 1;
    });
    
    // --- Growth from 2024 to 2025 ---
    const launches2024 = yearlyLaunches["2024"] || 0;
    const launches2025 = yearlyLaunches["2025"] || 0;
    
    const avgIncrease = launches2025 - launches2024;    

    document.getElementById("kv-launches").textContent =
        `${totalLaunches.toLocaleString()}`;
    
    document.getElementById("kv-growth").textContent =
        `+${Math.round(avgIncrease)} yr⁻¹`;
    
    document.getElementById("kv-bc").textContent =
        `${totalBC.toFixed(1)} kt`;
    
    document.getElementById("kv-smc").textContent =
        `${smcPercent.toFixed(1)}% of BC`;
    
}

async function updateMap(filtered_launches) {

    // Step 1: Group launches by site (lat/lon + site name as key)
    const siteMap = {};
    filtered_launches.lat.forEach((lat, i) => {
        const lon = filtered_launches.lon[i];
        const site = filtered_launches.text[i];  // launch site name
        const id = filtered_launches.id[i];
        const vehicle = filtered_launches.rocket[i];

        if (!siteMap[site]) {
            siteMap[site] = {
            lat: lat,
            lon,
            name: site,
            labels: []
            };
        }

        siteMap[site].labels.push(`Launch ${id} - ${vehicle}`);
    });

    
    // Step 2: Convert to array
    const sites = Object.values(siteMap);

    // Step 3: Extract data for Plotly
    const lats = sites.map(s => s.lat);
    const lons = sites.map(s => s.lon);
    const counts = sites.map(s => s.labels.length);

    // ✅ Bubble size scaling (important!)
    const sizes = counts.map(c => 6 + Math.sqrt(c) * 6);

    const text = sites.map(s => 
        `${s.name}<br>Launches: ${s.labels.length}`
    );

    // Store for click interaction
    siteDataMap = {};
    sites.forEach(s => siteDataMap[s.name] = s);
  
   // Step 4: Plotly trace
    const trace = {
        type: "scattergeo",
        mode: "markers",
        lat: lats,
        lon: lons,
        text: text,
        hoverinfo: "text",
        marker: {
            size: 6,
            color: counts,
            colorscale: [
                [0.0, "white"],
                [1.0, "red"]
            ],
            showscale: true,
            opacity: 0.7,
            line: {
                width: 0.5,
                color: "white"
            }
        }
    };

    // Step 5: Layout
    const layout = {
        margin: { t: 0, b: 0, l: 0, r: 0 },
        geo: {
            scope: "world",
            projection: { type: "natural earth" },
            showland: true,
            landcolor: "#1e1e1e",
            showocean: true,
            oceancolor: "#143d59",
            showcountries: true,
            countrycolor: "#444",
            bgcolor: "rgba(0,0,0,0)"
        }
    };

    // Step 6: Render
    Plotly.react("map", [trace], layout, { responsive: true });

    const mapEl = document.getElementById("map");

    // Change cursor to pointer when hovering over points
    mapEl.on('plotly_hover', function() {
        mapEl.style.cursor = 'pointer';
    });

    // Revert cursor when not hovering
    mapEl.on('plotly_unhover', function() {
        mapEl.style.cursor = 'default';
    });

    document.getElementById("map").on('plotly_click', function(data) {
        const pointIndex = data.points[0].pointIndex;
        const siteName = sites[pointIndex].name;
        const site = siteDataMap[siteName];
        updateSiteTable(site);
    });

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
        NOx: 0,
        Cly: 0,
        Al2O3: 0, 
        H2O: 0,
        CO: 0,
        CO2: 0,
        BC: 0,
    };
    filtered_launches.id.forEach((location, index) => {
        totals.NOx   += filtered_launches.NOx[index];
        totals.BC    += filtered_launches.BC[index];
        totals.CO    += filtered_launches.CO[index];
        totals.CO2   += filtered_launches.CO2[index];
        totals.H2O   += filtered_launches.H2O[index];
        totals.Al2O3 += filtered_launches.Al2O3[index];
        totals.Cly   += filtered_launches.Cly[index];
        
    });
    
    const trace = [{
        type: 'pie',
        labels: Object.keys(totals).map(key => prettyNames[key]),
        values: Object.keys(totals).map(key => Number((totals[key] / 1000).toFixed(2))),
        marker: {
            colors: Object.keys(totals).map(key => strongColors[key])
        },
        textinfo: 'label+percent',
        hoverinfo: 'label+value+percent',
        textposition: 'auto',
        hole: 0.4,
        automargin: true,
        sort: false,
    }];

    const bodyStyles = window.getComputedStyle(document.body);
    const chartFontSize = parseFloat(bodyStyles.fontSize);
    const totalSum = Object.values(totals).reduce((sum, val) => sum + val, 0);

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        autosize: true,
        font: { color: 'black', family: 'Space Grotesk, sans-serif', size: chartFontSize}, // general font
        annotations: [{
            text: 'Total<br>' + Math.round(totalSum/1000) + ' kt',
            showarrow: false,
            font: { size: 14 }
        }],
        hovermode: 'closest',
        dragmode: false,
        margin: { t: 70, r: 40, b: 20, l: 40 },
        showlegend: false
    };

    // Plot the chart inside the 'emissionsChart' div
    Plotly.react('bar', trace, layout, {responsive: true, displayModeBar: false, scrollZoom: false });

}

function updateStack(filtered_launches) {

    const species = ['BC', 'CO', 'CO2', 'H2O', 'Al2O3', 'Cly', 'NOx'];
    const sums = {};

    function yearRange(startDate, endDate) {
        const start = new Date(startDate);
        const end   = new Date(endDate);
        const years = [];

        for (let y = start.getUTCFullYear(); y <= end.getUTCFullYear(); y++) {
            years.push(String(y));
        }
        return years;
    }
    
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

    // --- Choose bins ---
    let bins;
    if (timeAggregation === "annual") {
        bins = yearRange(startDate, endDate);
    } else {
        bins = monthRange(startDate, endDate);
    }

    // --- Zero sums ---
    bins.forEach(t => {
        sums[t] = {};
        species.forEach(sp => sums[t][sp] = 0);
    });

    // --- Accumulate ---
    for (let i = 0; i < filtered_launches.date.length; i++) {
        const dateStr = filtered_launches.date[i];

        const bin = (timeAggregation === "annual")
            ? dateStr.slice(0, 4)   // YYYY
            : dateStr.slice(0, 7);  // YYYY-MM

        species.forEach(sp => {
            sums[bin][sp] += Number(filtered_launches[sp][i]) || 0;
        });
    }

    const xVals = Object.keys(sums).sort();
    const maxYValue = Math.max(...xVals);

    const traces = species.map(sp => {
        if (timeAggregation === "annual") {
            return {
                x: xVals,
                y: xVals.map(b => sums[b][sp] / 1000),
                type: 'bar',
                name: prettyNames[sp],
                marker: { color: strongColors[sp] }
            };
        } else {
            return {
                x: xVals,
                y: xVals.map(b => sums[b][sp] / 1000),
                type: 'scatter',
                mode: 'none',
                stackgroup: 'one',
                name: prettyNames[sp],
                fillcolor: strongColors[sp]
            };
        }
    });

    const bodyStyles = window.getComputedStyle(document.body);
    const chartFontSize = parseFloat(bodyStyles.fontSize);
    
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        autosize: true,
        font: { color: 'black', family: 'Space Grotesk, sans-serif', size: chartFontSize},
        legend: { 
            orientation: 'v',
            x: 0, 
            y: 1, 
            font: { 
                color: 'black', 
                size: chartFontSize * 0.95, 
                family: 'Space Grotesk, sans-serif'
            }
        },
        annotations: [
            {
            text: "Click legend<br>to show/hide<br>species ←",
            x: 0.,
            y: 1,
            xref: "paper",
            yref: "paper",
            yshift: -4,
            xshift: 80,
            xanchor: "left",
            yanchor: "top",
            showarrow: false,
            align: "left",
            font: {
                size: chartFontSize * 0.95,
                color: "rgba(0,0,0,0.6)"
            }
            }
        ],
        yaxis: {
            title: {text: 'Mass [kilotonnes]'},
            showgrid: false,
            zeroline: false
        },
        xaxis: {
            showgrid: false,
            zeroline: false
        },
        hovermode: 'closest',
        margin: {
            t: chartFontSize * 2,
            r: chartFontSize * 2,
            b: chartFontSize * 2,
            l: chartFontSize * 4
        },
        barmode: 'stack',  
    };
    Plotly.react('stack', traces , layout, {
        responsive: true, 
        displayModeBar: true 
    });

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

    fetchEventsData(); // Fetch data for the default date
    fetchAllDataForKeyMetrics();

    document.getElementById('applyFilters').addEventListener('click', () => {
        filterlaunches(all_launches);
    });

    document.getElementById('resetFilters').addEventListener('click', () => {
        resetFilters(all_launches);
    });

    const toggle = document.getElementById("timeToggle");
    toggle.addEventListener("change", () => {
        timeAggregation = toggle.checked ? "annual" : "monthly";
        const filteredLaunches = filterlaunches(all_launches);
        updateStack(filteredLaunches);
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
            if (activatedTabId === 'map-tab') {
                Plotly.Plots.resize(document.getElementById('map'));
            }
        });
    });

    // FAQ generation
    const faqData = [ 
        { question: "What are these chemicals?",
            answer: "NO<sub>x</sub> is nitrogen oxides, H<sub>2</sub>O is water vapour, CO<sub>2</sub> is carbon dioxide, BC is black carbon or soot, Al<sub>2</sub>O<sub>3</sub> is aluminium oxide or alumina, and Cl<sub>y</sub> is a family of chlorine compounds. NO<sub>x</sub>, H<sub>2</sub>O, CO<sub>2</sub>, and Cl<sub>y</sub> are released as gases, BC and Al<sub>2</sub>O<sub>3</sub> as particles."
        },
        { question: "How do these chemicals affect the atmosphere?",
            answer: "Unlike anthropogenic emissions from the surface of the Earth, rocket launches release air pollutant and CO<sub>2</sub> emissions throughout the atmosphere, where they can have an outsized impact on our atmosphere and climate. NO<sub>x</sub> and Cl<sub>y</sub> are the largest contributors to destruction of the ozone layer from rocket emissions, with smaller destruction occuring from emissions of BC and Al<sub>2</sub>O<sub>3</sub> particles. The largest climate impacts come from BC emissions, which warm the upper layers of the atmosphere while cooling the lower layers."
        },
        { question: "What does each filter represent?",
            answer: "Launch site refers to the location of the rocket launch. Launch vehicle refers to the type of rocket used for the launch. Megaconstellation refers to whether the launch contains megaconstellation payloads."
        },
        { question: "How is this data calculated?",
            answer: "Our calculations are based on the current best scientific knowledge available for emissions from rocket launches. We include the effects of a changing chemical environment with altitude in our launch emissions, and calculate geolocated emissions globally up to a maximum altitude of 80 km. Paths shown in the Globe view are fixed at the launch site and do not represent real rocket trajectories. Emissions from failed launches before 2020 are not included."
        },
        { question: "Where can I find the original methodology and data?",
        answer: "You can find further details on the methodology in our study published in Nature Scientific Data: Global 3D rocket launch and re-entry air pollutant and carbon dioxide emissions for 2020-2022</strong>. C. R. Barker, E. A. Marais (2024). doi:10.5522/04/26325382. [<a href='https://doi.org/10.5522/04/26325382' target='_blank' rel='noopener noreferrer'>Data</a>]. [<a href='https://www.nature.com/articles/s41597-024-03910-z' target='_blank' rel='noopener noreferrer'>Publication</a>]. For details of changes since the publication, please visit the <a href='https://github.com/cbarker211/Emissions_API/blob/main/docs/changefile.md' target='_blank' rel='noopener noreferrer'>changefile.</a>"
        }
    ];
    const faqsContainer = document.getElementById('faqs-container');

    if (faqsContainer) {
        faqData.forEach(item => {
            let article = document.createElement('article');
            article.classList.add('faq-item');

            article.innerHTML = `
                <div class="filter">
                    <label>${item.question}</label>
                </div>
                <div class="item-answer">
                    <span>${item.answer}</span>
                </div>
            `;

            faqsContainer.append(article);
        });

        document.querySelectorAll('.filter').forEach(q => {
            q.addEventListener('click', () => {
                q.parentElement.classList.toggle("show-answer");
            });
        });
    }

    // Modal logic
    const modal = document.getElementById("faqModal");
    const faqButton = document.getElementById("faqButton");
    const closeBtn = document.getElementById("closeModal");

    //modal.classList.add("active")

    // open via button
    faqButton.onclick = () => {
        modal.classList.add("active");
    };

    // close
    closeBtn.onclick = () => {
        modal.classList.remove("active");
    };

    // click outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    };

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

const sidebarToggle = document.getElementById('toggleSidebar');

sidebarToggle.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-collapsed');

    setTimeout(() => {
        if (typeof Plotly !== 'undefined') {
            Plotly.Plots.resize(document.getElementById('stack'));
            Plotly.Plots.resize(document.getElementById('bar'));
            Plotly.Plots.resize(document.getElementById('map'));
        }
    }, 300);
});