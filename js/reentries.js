// Constants
const startYear = 1955;
const endYear = 2025;
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

//Variables
let globe;
let startDate, endDate;
let timeAggregation = "annual";
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
    start: [540, 839],
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
    updateStack(filtered_reentries);
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
        BC: 0,
        Al2O3: 0,
        unab_mass: 0, 
        HCl: 0,
        Cl: 0,
        NOx: 0
    };
    filtered_reentries.id.forEach((location, index) => {
        totals.unab_mass += filtered_reentries.unab_mass[index];
        totals.BC        += filtered_reentries.BC[index];
        totals.Al2O3     += filtered_reentries.Al2O3[index];
        totals.HCl       += filtered_reentries.HCl[index];
        totals.Cl        += filtered_reentries.Cl[index];
        totals.NOx       += filtered_reentries.NOx[index];
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
    for (let i = 0; i < filtered_reentries.date.length; i++) {
        const dateStr = filtered_reentries.date[i];

        const bin = (timeAggregation === "annual")
            ? dateStr.slice(0, 4)   // YYYY
            : dateStr.slice(0, 7);  // YYYY-MM

        species.forEach(sp => {
            sums[bin][sp] += Number(filtered_reentries[sp][i]) || 0;
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

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        autosize: true,
        font: { color: 'white', family: 'Space Grotesk, sans-serif', size: 14},
        legend: { 
            orientation: 'v',
            x: 1.05, 
            y: 1, 
            font: { 
                color: 'white', 
                size: 13, 
                family: 'Space Grotesk, sans-serif'
            }
        },
        title: {
            text: timeAggregation === "annual"
                ? 'Annual Emissions (click legend to show/hide species)'
                : 'Monthly Emissions (click legend to show/hide species)',
            xref: 'paper',
            xanchor: 'center',
            y: 1,
            pad: { t: 40 }},
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
        margin: {t: 70, r: 40, b: 20,l: 40},
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
    console.log(startDate, endDate,'DOM');
    fetchEventsData(); // Fetch data for the default date

    document.getElementById('applyFilters').addEventListener('click', () => {
        filterreentries(all_reentries);
    });

    const toggle = document.getElementById("timeToggle");
    toggle.addEventListener("change", () => {
        timeAggregation = toggle.checked ? "annual" : "monthly";
        const filteredReentries = filterreentries(all_reentries);
        updateStack(filteredReentries);
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
                resizeGlobe();
            }
        });
    });
});

// Function to resize the globe
function resizeGlobe() {
    const globeContainer = document.getElementById('globe');
    console.log(globeContainer.offsetWidth,globeContainer.offsetHeight)
    const globeWidth = globeContainer.offsetWidth;
    const globeHeight = globeContainer.offsetHeight;

    // Update the globe's dimensions
    if (globe) {
        globe.width(globeWidth).height(globeHeight);
    }
}

// Attach the resize function to the window resize event
window.onresize = resizeGlobe;

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