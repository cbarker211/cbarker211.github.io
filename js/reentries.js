// Constants
const startYear = 2020;
const endYear = 2024;
const totalMonths = (endYear - startYear + 1) * 12 - 1;
const locationGroups = {
    "Known (Coordinates)" : [1],
    "Known (Named Location)": [2],
    "Known (Political Region)": [3],
    "Known (Geographic Region)": [4],
    "Known (Falcon Reusable)": [5], 
    "Approximate (Inclination Known)": [6],
    "Approximate (Inclination Unknown)": [7]
};
const toggleButton = document.getElementById('toggleTableButton');
const tableBody = document.getElementById('reentryTableBody');
const prettyNames = {
    BC: 'BC',
    unab_mass: 'Unablated Mass',
    Cl: 'Cl',
    Al2O3: 'AlO<sub>x</sub>',
    HCl: 'HCl',
    NOx: 'NO<sub>x</sub>'
};

const strongColors = {
    BC: 'rgba(0,0,0,1)',
    unab_mass: '#575757',
    Cl: '#2c20c9',
    Al2O3: '#c40000',
    HCl: '#1cba26',
    NOx: '#c99b24'
};

// Variables
let globe;
let countryPolygons, oceanPolygons;
var slider = document.getElementById('slider');
var yearSelect1 = document.getElementById('year-select1');
var yearSelect2 = document.getElementById('year-select2');
var monthSelect1 = document.getElementById('month-select1');
var monthSelect2 = document.getElementById('month-select2');
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              
// Small helper functions

function getLocationLabel(num) {
    for (const [label, arr] of Object.entries(locationGroups)) {
        if (arr.includes(num)) return label;
    }
    return num; // fallback
}

function indexToDate(index) {
    const year = startYear + Math.floor(index / 12);
    const monthIndex = Math.floor(Number(index)) % 12; // 0–11
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[monthIndex]} ${year}`;
}

function intToDateString(monthIndex, isEnd = false) {
    const year = startYear + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;

    if (isEnd) {
        // Create a date for the *last day* of the month
        const lastDay = new Date(year, month + 1, 0); // day 0 of next month = last day of current
        return lastDay.toISOString().split('T')[0];
    } else {
        // First day of the month
        const firstDay = new Date(year, month, 1);
        return firstDay.toISOString().split('T')[0];
    }
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

function updateCountryTable(country) {
    const table = document.getElementById('country-table');
    table.innerHTML = `<tr><th>Property</th><th>Value</th></tr>`;


    const reentriesHTML = `
        <div style="
            max-height: 150px; 
            overflow-y: auto; 
            padding: 4px; 
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.05);
        ">
            ${country.reentries.map(e =>
                `${e.date} — ${e.objname} (${e.id}) [${e.category}]`
            ).join('<br>')}
        </div>
    `;

    const rows = [
        ['Country', country.name],
        ['Re-entry Count', country.count],
        ['Re-entry Details', reentriesHTML]
    ];

    rows.forEach(([prop, val]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="wrap-text">${prop}</td><td class="wrap-text">${val}</td>`;
        table.appendChild(tr);
    });
}

function aggregateByRegion(reentries) {
    const regionCounts = {};

    for (let i = 0; i < reentries.lat.length; i++) {
        const pt = turf.point([reentries.lon[i], reentries.lat[i]]);

        // Check countries first
        let found = false;
        for (const feat of countryPolygons.features) {
            if (turf.booleanPointInPolygon(pt, feat)) {
                const name = feat.properties.ADMIN;
                regionCounts[name] = (regionCounts[name] || 0) + 1;
                found = true;
                break;
            }
        }

        // Check oceans if not in a country
        if (!found && oceanPolygons) {
            for (const feat of oceanPolygons.features) {
                if (turf.booleanPointInPolygon(pt, feat)) {
                    const name = feat.properties.NAME;
                    regionCounts[name] = (regionCounts[name] || 0) + 1;
                    break;
                }
            }
        }
    }
    return regionCounts;
}

noUiSlider.create(slider, {
    start: [48, 60],
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
        density: 12,
        filter: function(value) {
            // Show label only every 12 months (1 year)
            return (value % 12 === 0) ? 1 : 0;  // 1 = show label, 0 = hide
        },
        format: {
            to: function(value) {
                // label only for year start (Jan)
                return value % 12 === 0 ? (startYear + value / 12) : '';
            }
        }
    }
});

// Append the option elements
for (var i = 2020; i <= 2024; i++) {

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
    console.log(startDate, endDate);
    fetchEventsData();
}

yearSelect1.addEventListener('change', updateSliderFromSelects);
monthSelect1.addEventListener('change', updateSliderFromSelects);
yearSelect2.addEventListener('change', updateSliderFromSelects);
monthSelect2.addEventListener('change', updateSliderFromSelects);

function populateFilters(reentries) {
    // Get unique values from filtered_reentries for each filter
    const categories = [...new Set(reentries.category)];
    const locations = [...new Set(reentries.location)];
    const smcValues = [...new Set(reentries.smc)];

    // Function to populate checkboxes inside a given filter dropdown
    function populateCheckboxes(filterId, values, isLocation = false) {
        const dropdown = document.getElementById(filterId);
        const ul = dropdown.querySelector('ul');
        ul.innerHTML = ''; // Clear any previous entries

        values.forEach(value => {
            const label = isLocation ? getLocationLabel(value) : value;
            const li = document.createElement('li');
            li.innerHTML = `<label><input type="checkbox" value="${value}" /> ${label}</label>`;
            ul.appendChild(li);
        });
    }

    // Populate each filter
    populateCheckboxes('locationFilter', [...new Set(reentries.location)], true);
    populateCheckboxes('categoryFilter', categories.sort());
    populateCheckboxes('smcFilter', smcValues);
}

function filterreentries(all_reentries) {

    function getSelectedfilters(filter) {
        const var_filter = document.getElementById(filter);
        const checkboxes = var_filter.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.value);
    }

    // Get selected values from each filter
    const selectedReusabilities = getSelectedfilters('locationFilter');
    const selectedCategories    = getSelectedfilters('categoryFilter');
    const selectedSmc           = getSelectedfilters('smcFilter');

    // Find indices to keep based on selected filters
    let indicesToKeep = [...Array(all_reentries.date.length).keys()];  // All indices initially

    console.log(all_reentries.location)
    // Filter by reusability
    if (selectedReusabilities.length > 0) {
        indicesToKeep = indicesToKeep.filter(i => selectedReusabilities.includes(String(all_reentries.location[i])));
    }

    // Filter by category
    if (selectedCategories.length > 0) {
        indicesToKeep = indicesToKeep.filter(i => selectedCategories.includes(all_reentries.category[i]));
    }

    // Filter by SMC
    if (selectedSmc.length > 0) {
        indicesToKeep = indicesToKeep.filter(i => selectedSmc.includes(all_reentries.smc[i]));
    }

    // Return the filtered group (keeping the structure)
    const filteredData = {
        date: indicesToKeep.map(i => all_reentries.date[i]),
        time: indicesToKeep.map(i => all_reentries.time[i]),
        lat: indicesToKeep.map(i => all_reentries.lat[i]),
        lon: indicesToKeep.map(i => all_reentries.lon[i]),
        location: indicesToKeep.map(i => all_reentries.location[i]),
        id: indicesToKeep.map(i => all_reentries.id[i]),
        category: indicesToKeep.map(i => all_reentries.category[i]),
        smc: indicesToKeep.map(i => all_reentries.smc[i] ? "Yes" : "No"),
        objname: indicesToKeep.map(i => all_reentries.objname[i]),
        Al2O3: indicesToKeep.map(i => all_reentries.Al2O3[i]),
        NOx: indicesToKeep.map(i => all_reentries.NOx[i]),
        BC: indicesToKeep.map(i => all_reentries.BC[i]),
        HCl: indicesToKeep.map(i => all_reentries.HCl[i]),
        Cl: indicesToKeep.map(i => all_reentries.Cl[i]),
        unab_mass: indicesToKeep.map(i => all_reentries.unab_mass[i])
    };

    // Update the visualizations with the filtered data
    updateVisualizations(filteredData);
}

async function fetchEventsData() {
    try {
        // Fetch the data from the API (replace with your actual API URL)
        const response = await fetch(`https://cbarker.pythonanywhere.com/api/reentries?start_date=${startDate}&end_date=${endDate}`); // Replace with your actual API URL
        const reentryData = await response.json();
        
        all_reentries = {
            date: [],
            id: [],
            time: [],
            location: [],
            objname: [],
            lat: [],
            lon: [],
            smc: [],
            category: [],
            Al2O3: [],
            NOx: [],
            BC: [],
            HCl: [],
            Cl: [],
            unab_mass: []
        };

        Object.keys(reentryData).forEach(date => {
            reentryData[date].reentries.forEach(reentry => {
                all_reentries.date.push(reentry.date);
                all_reentries.time.push(reentry.time);
                all_reentries.lat.push(parseFloat(reentry.lat));
                all_reentries.lon.push(parseFloat(reentry.lon));
                all_reentries.location.push(reentry.location);
                all_reentries.id.push(reentry.id);
                all_reentries.category.push(reentry.category);
                all_reentries.smc.push(reentry.smc.toString());
                all_reentries.objname.push(reentry.name);
                all_reentries.BC.push(parseFloat(reentry.emissions.BC));
                all_reentries.Al2O3.push(parseFloat(reentry.emissions.Al2O3));
                all_reentries.NOx.push(parseFloat(reentry.emissions.NOx));
                all_reentries.HCl.push(parseFloat(reentry.emissions.HCl));
                all_reentries.Cl.push(parseFloat(reentry.emissions.Cl));
                all_reentries.unab_mass.push(reentry.emissions.Unablated_Mass);
            });
        });

        populateFilters(all_reentries);
        updateVisualizations(all_reentries);

    } catch (error) {
        console.error('Error fetching or processing the events data:', error);
    }
}

function updateVisualizations(filtered_reentries) {
    updateTables(filtered_reentries);
    updateGraph(filtered_reentries);
    updateGlobe(filtered_reentries);
    updateStack(filtered_reentries);
}

async function updateGlobe(filtered_reentries) {

    // Ensure country/ocean polygons are loaded
    if (!window.countryPolygons || !window.oceanPolygons) {
        const countriesRes = await fetch('datasets/ne_110m_admin_0_countries.geojson');
        window.countryPolygons = await countriesRes.json();

        //const oceansRes = await fetch('datasets/ne_110m_ocean.geojson');
        //window.oceanPolygons = await oceansRes.json();
    }

    // Aggregate re-entries by region
    const regionCounts = {};
    for (let i = 0; i < filtered_reentries.lat.length; i++) {
        const pt = turf.point([filtered_reentries.lon[i], filtered_reentries.lat[i]]);
        let found = false;

        // Check countries first
        for (const feat of window.countryPolygons.features) {
            if (turf.booleanPointInPolygon(pt, feat)) {
                const name = feat.properties.ADMIN;
                regionCounts[name] = (regionCounts[name] || 0) + 1;
                found = true;
                break;
            }
        }

        // Check oceans if not in a country
        if (!found && window.oceanPolygons) {
            for (const feat of window.oceanPolygons.features) {
                if (turf.booleanPointInPolygon(pt, feat)) {
                    const name = feat.properties.NAME;
                    regionCounts[name] = (regionCounts[name] || 0) + 1;
                    break;
                }
            }
        }
    }

    // Build country detail map
    const countryDataMap = {};

    window.countryPolygons.features.forEach(f => {
        const name = f.properties.ADMIN;
        const count = regionCounts[name] || 0;

        countryDataMap[name] = {
            name: name,
            count: count,
            // Extract all matching re-entries for this country:
            reentries: filtered_reentries.date
                .map((_, i) => i)
                .filter(i => {
                    const pt = turf.point([filtered_reentries.lon[i], filtered_reentries.lat[i]]);
                    return turf.booleanPointInPolygon(pt, f);
                })
                .map(i => ({
                    date: filtered_reentries.date[i],
                    id: filtered_reentries.id[i],
                    objname: filtered_reentries.objname[i],
                    category: filtered_reentries.category[i]
                }))
        };
    });

    window.countryDataMap = countryDataMap;

    // Map counts to country polygons
    window.countryPolygons.features.forEach(f => {
        const name = f.properties.ADMIN;
        f.properties.reentryCount = regionCounts[name] || 0;
    });

    // Optional: Map counts to oceans
    if (window.oceanPolygons) {
        window.oceanPolygons.features.forEach(f => {
            const name = f.properties.NAME;
            f.properties.reentryCount = regionCounts[name] || 0;
        });
    }

    // Determine max count for scaling
    const maxCount = Math.max(...Object.values(regionCounts), 1);

    // Color scale for polygons
    const colorScale = d3.scaleSequentialSqrt(d3.interpolateYlOrRd).domain([0, maxCount]);

    // Initialize Globe if not already
    if (!globe) {
        globe = new Globe(document.getElementById('globe'))
            .showGraticules(true)
            .showAtmosphere(false)
            .backgroundColor('rgba(0,0,0,0)')
            .polygonAltitude(0.01)
            .onPolygonHover(hoverD => globe
                .polygonCapColor(d => d === hoverD ? 'steelblue' : colorScale(d.properties.reentryCount))
            )
            .polygonsTransitionDuration(0)
            .onPolygonClick(country => {
                const data = window.countryDataMap[country.properties.ADMIN];
                updateCountryTable(data);
            });

        // Initial camera view
        setTimeout(() => {
            globe.pointOfView({ lat: 35, lng: -95, altitude: 1.5 }, 1000);
        }, 0);
    }

    // Add country polygons
    globe.polygonsData(window.countryPolygons.features)
        .polygonCapColor(f => colorScale(f.properties.reentryCount))
        .polygonLabel(f => `
            <b>${f.properties.ADMIN}</b><br/>
            Re-entries: ${f.properties.reentryCount || 0}
        `);
}

function updateTables(filtered_reentries) {
    
    const table1Body = document.getElementById('reentryTableBody');
    const table1Foot = document.getElementById('reentryTableFoot');
    table1Body.innerHTML = '';
    table1Foot.innerHTML = '';
    let totalBC = 0, totalmass = 0, totalHCl = 0;
    let totalAl2O3 = 0, totalCl = 0; totalNOx = 0;
    filtered_reentries.id.forEach((location, index) => {
        const row = document.createElement('tr');
        const BC = filtered_reentries.BC[index];
        const Al2O3 = filtered_reentries.Al2O3[index];
        const HCl = filtered_reentries.HCl[index];
        const Cl = filtered_reentries.Cl[index];
        const NOx = filtered_reentries.NOx[index];
        const unab_mass = filtered_reentries.unab_mass[index];
        totalBC    += BC;
        totalAl2O3 += Al2O3;
        totalNOx   += NOx;
        totalHCl   += HCl;
        totalCl    += Cl;
        totalmass  += unab_mass;
        
        row.innerHTML = `
            <td>${filtered_reentries.date[index]}</td>
            <td>${filtered_reentries.id[index]}</td>
            <td>${filtered_reentries.time[index].toFixed(2)}</td>
            <td class="wrap-text">${getLocationLabel(filtered_reentries.location[index])}</td>
            <td class="wrap-text">${filtered_reentries.objname[index]}</td>
            <td>${filtered_reentries.category[index]}</td>
            <td>${filtered_reentries.smc[index]}</td>
            <td>${filtered_reentries.Al2O3[index].toFixed(1)}</td>
            <td>${filtered_reentries.NOx[index].toFixed(1)}</td>
            <td>${filtered_reentries.BC[index].toFixed(1)}</td>
            <td>${filtered_reentries.HCl[index].toFixed(1)}</td>
            <td>${filtered_reentries.Cl[index].toFixed(1)}</td>
            <td>${filtered_reentries.unab_mass[index].toFixed(1)}</td>
        `;
        table1Body.appendChild(row);
    });
    // Add Totals to Re-entry Table
    const totalRow1 = document.createElement('tr');
    totalRow1.innerHTML = `
        <td>Total</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>${totalAl2O3.toFixed(2)}</td>
        <td>${totalNOx.toFixed(2)}</td>
        <td>${totalBC.toFixed(2)}</td>
        <td>${totalHCl.toFixed(2)}</td>
        <td>${totalCl.toFixed(2)}</td>
        <td>${totalmass.toFixed(2)}</td>
    `;
    table1Foot.appendChild(totalRow1);
}

function updateGraph(filtered_reentries) {

    const totals = {
        Al2O3: 0,
        NOx: 0,
        unab_mass: 0,
        BC: 0,
        HCl: 0,
        Cl: 0
    };

    filtered_reentries.id.forEach((location, index) => {
        totals.Al2O3     += filtered_reentries.Al2O3[index];
        totals.NOx       += filtered_reentries.NOx[index];
        totals.unab_mass += filtered_reentries.unab_mass[index];
        totals.BC        += filtered_reentries.BC[index];
        totals.HCl       += filtered_reentries.HCl[index];
        totals.Cl        += filtered_reentries.Cl[index];
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

function updateStack(filtered_reentries) {

    const species = ['Al2O3', 'NOx', 'unab_mass', 'BC', 'HCl', 'Cl'];
    const monthlySums = {};

    // Step 1: Loop through each launch (index)
    for (let i = 0; i < filtered_reentries.date.length; i++) {
        const month = filtered_reentries.date[i].slice(0, 7);  // 'YYYY-MM'
        if (!monthlySums[month]) {
            monthlySums[month] = {};
            species.forEach(sp => monthlySums[month][sp] = 0);
        }
        species.forEach(sp => {
            monthlySums[month][sp] += Number(filtered_reentries[sp][i]) || 0; // Ensure numeric
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
    const minSelectableIndex = (2020 - startYear) * 12; // January 1957
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
    fetchEventsData();
});

document.addEventListener('DOMContentLoaded', async () => {

    const daterange = slider.noUiSlider.get();
    startDate = intToDateString(Number(daterange[0]));
    endDate = intToDateString(Number(daterange[1]),true);
    console.log(startDate, endDate);
    fetchEventsData(); // Fetch data for the default date

    document.getElementById('applyFilters').addEventListener('click', () => {
        filterreentries(all_reentries);
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
const numStars = 50;

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