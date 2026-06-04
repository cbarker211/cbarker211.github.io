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
    fetchEventsData();
}

yearSelect1.addEventListener('change', updateSliderFromSelects);
monthSelect1.addEventListener('change', updateSliderFromSelects);
yearSelect2.addEventListener('change', updateSliderFromSelects);
monthSelect2.addEventListener('change', updateSliderFromSelects);


function resetFilters(all_reentries) {

    function resetCheckboxes(filterId, defaultCheckedValues = []) {
        const filter = document.getElementById(filterId);
        const checkboxes = filter.querySelectorAll('input[type="checkbox"]');

        checkboxes.forEach(cb => {
            cb.checked = defaultCheckedValues.includes(cb.value);
        });
    }

    // Reset each filter
    resetCheckboxes('LocationFilter');
    resetCheckboxes('CategoryFilter');
    resetCheckboxes('MegaconstellationFilter');

    // Re-run filtering or show all data
    filterreentries(all_reentries);
}

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
            const checked = isLocation ? getLocationLabel(value) : value;
            const li = document.createElement('li');
            li.innerHTML = `<label><input type="checkbox" value="${value}" /> ${checked}</label>`;
            ul.appendChild(li);
        });
    }

    // Populate each filter
    populateCheckboxes('LocationFilter', locations, true);
    populateCheckboxes('CategoryFilter', categories.sort());
    populateCheckboxes('MegaconstellationFilter', smcValues);
}

function renderFilterChips(filters) {
    const container = document.getElementById("active-filters");
    container.innerHTML = ""; // clear existing


    Object.entries(filters).forEach(([filterType, values]) => {

        if (!values.length) return; // skip empty groups

        // ✅ Create group container
        const group = document.createElement("div");
        group.className = "filter-group";

        // ✅ Create header
        const header = document.createElement("div");
        header.className = "filter-group-title";
        header.textContent = filterType.replace("Filter", "");

        group.appendChild(header);

        // ✅ Create items
        values.forEach(value => {
            const item = document.createElement("div");
            item.className = "filter-item";

            item.innerHTML = `
                <button class="remove-chip"
                        data-filter="${filterType}"
                        data-value="${value}">
                    ×
                </button>
                <span>${value}</span>
            `;

            group.appendChild(item);
        });

        container.appendChild(group);
    });

    // Optional: hide container if empty
    container.style.display = container.children.length ? "block" : "none";
}

function filterreentries(all_reentries) {

    function getSelectedfilters(filter) {
        const var_filter = document.getElementById(filter);
        const checkboxes = var_filter.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.value);
    }

    // Get selected values from each filter
    const selectedReusabilities = getSelectedfilters('LocationFilter');
    const selectedCategories    = getSelectedfilters('CategoryFilter');
    const selectedSmc           = getSelectedfilters('MegaconstellationFilter');

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

    renderFilterChips({
        LocationFilter: selectedReusabilities,
        CategoryFilter: selectedCategories,
        MegaconstellationFilter: selectedSmc,
    });

}

async function fetchEventsData() {
    try {
        // Fetch the data from the API (replace with your actual API URL)
        const response = await fetch(`https://cbarker.pythonanywhere.com/api/reentries?start_date=${startDate}&end_date=${endDate}`); // Replace with your actual API URL
        const reentryData = await response.json();
        
        all_reentries = {
            date: [],
            id: [],
            location: [],
            objname: [],
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
        renderFilterChips({
            LocationFilter: [],
            CategoryFilter: [],
            MegaconstellationFilter: [],
        });

        filterreentries(all_reentries);

    } catch (error) {
        console.error('Error fetching or processing the events data:', error);
    }
}

function updateVisualizations(filtered_reentries) {
    updateTables(filtered_reentries);
    updateGraph(filtered_reentries);
    updateStack(filtered_reentries);
}

async function fetchAllDataForKeyMetrics() {
    try {
        const response = await fetch(
            `https://cbarker.pythonanywhere.com/api/reentries?start_date=1957-01-01&end_date=2025-12-31`
        );

        const reentryData = await response.json();

        const all = {
            date: [],
            rocket: [],
            smc: [],
            NOx: [],
        };

        Object.keys(reentryData).forEach(date => {
            reentryData[date].reentries.forEach(reentry => {
                all.date.push(reentry.date);

                all.rocket.push(
                    reentry.variant === "-" 
                        ? reentry.rocket 
                        : reentry.rocket + " " + reentry.variant
                );

                all.smc.push(reentry.smc.toString());

                const includeLow = true;   // default matches UI
                const includeHigh = false;
                
                const NOx =
                    (includeLow ? parseFloat(reentry.emissions.NOx) : 0) +
                    (includeHigh ? parseFloat(reentry.emissions_above.NOx) : 0);
                

                all.NOx.push(NOx);
            });
        });

        updateKeyMetrics(all);

    } catch (error) {
        console.error("Error loading full dataset:", error);
    }
}

function updateKeyMetrics(data) {

    const totalReentries = data.date.length;

    // --- Total NOx (kt) ---
    const totalNOx = data.NOx.reduce((a, b) => a + b, 0) / 1000;

    // --- % from megaconstellations (SMC) in 2025 ---
    let totalNOx_2025 = 0;
    let smcNOx_2025 = 0;

    data.date.forEach((date, i) => {
        if (date.startsWith("2025")) {
            const val = data.NOx[i];
            totalNOx_2025 += val;

            if (data.smc[i] === true || data.smc[i] === "true") {
                smcNOx_2025 += val;
            }
        }
    });

    const smcPercent = totalNOx_2025 > 0
        ? (smcNOx_2025 / totalNOx_2025) * 100
        : 0;


    const yearlyReentries = {};

    data.date.forEach((date) => {
        const year = date.slice(0, 4);
        if (!yearlyReentries[year]) yearlyReentries[year] = 0;
        yearlyReentries[year] += 1;
    });
    
    // --- Growth from 2024 to 2025 ---
    const reentries2024 = yearlyReentries["2024"] || 0;
    const reentries2025 = yearlyReentries["2025"] || 0;
    
    const avgIncrease = reentries2025 - reentries2024;    

    document.getElementById("kv-reentries").textContent =
        `${totalReentries.toLocaleString()}`;
    
    document.getElementById("kv-growth").textContent =
        `+${Math.round(avgIncrease)} yr⁻¹`;
    
    document.getElementById("kv-bc").textContent =
        `${totalNOx.toFixed(1)} kt`;
    
    document.getElementById("kv-smc").textContent =
        `${smcPercent.toFixed(1)}% of NOₓ`;
    
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
            <td>${filtered_reentries.date[index].replace("T", " ").replace("Z", " ")}</td>
            <td>${filtered_reentries.id[index]}</td>
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

    window.lastFilteredData = filtered_reentries;

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
 
    const pieContainer = document.getElementById('piechart');
    const height = pieContainer.clientHeight;

    // Set a threshold (tune this)
    const showLabels = height > 220;

    const trace = [{
        type: 'pie',
        labels: Object.keys(totals).map(key => prettyNames[key]),
        values: Object.keys(totals).map(key => Number((totals[key] / 1000).toFixed(2))),
        marker: {
            colors: Object.keys(totals).map(key => strongColors[key])
        },
        textinfo: showLabels ? 'label+value+percent' : 'none',
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
        height: height,
        font: { color: 'black', family: 'Space Grotesk, sans-serif', size: chartFontSize}, // general font
        annotations: [{
            text: showLabels ? 'Total<br>' + Math.round(totalSum/1000) + ' kt' : '',
            showarrow: false,
            font: { size: chartFontSize * 0.95 }
        }],
        hovermode: 'closest',
        dragmode: false,
        margin: {
            t: 0,
            r: chartFontSize,
            b: chartFontSize,
            l: chartFontSize,
        },
        showlegend: false
    };

    // Plot the chart inside the 'emissionsChart' div
    Plotly.react('piechart', trace, layout, {responsive: true, displayModeBar: false, scrollZoom: false });

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
            },
            bgcolor: 'rgba(255,255,255,1)',
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
            },
            bgcolor: 'rgba(255,255,255,1)',
            }
        ],
        yaxis: {
            title: {text: 'Mass [kilotonnes]'},
            showgrid: true,
            zeroline: true,
            gridcolor: '#bdbdbd',
            gridwidth: 1,
            griddash: 'dot'
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
    Plotly.react('stackchart', traces , layout, {
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
    fetchEventsData();
});

document.addEventListener('DOMContentLoaded', async () => {

    const daterange = slider.noUiSlider.get();
    startDate = intToDateString(Number(daterange[0]));
    endDate = intToDateString(Number(daterange[1]),true);

    fetchAllDataForKeyMetrics();

    document.getElementById('applyFilters').addEventListener('click', () => {
        filterreentries(all_reentries);
    });

    document.getElementById('resetFilters').addEventListener('click', () => {
        resetFilters(all_reentries);
    });

    const toggle = document.getElementById("timeToggle");
    toggle.addEventListener("change", () => {
        timeAggregation = toggle.checked ? "annual" : "monthly";
        const filteredReentries = filterreentries(all_reentries);
    });

    const tabEls = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabEls.forEach(function (tab) {
        tab.addEventListener('shown.bs.tab', function (event) {
            const activatedTabId = event.target.id;
            if (activatedTabId === 'chart-tab') {
                // Resize your Plotly charts
                Plotly.Plots.resize(document.getElementById('stackchart'));
                Plotly.Plots.resize(document.getElementById('piechart'));
                
                if (window.lastFilteredData) {
                    updateGraph(window.lastFilteredData);
                }
            }
        });
    });

    document.getElementById("active-filters").addEventListener("click", (e) => {
        const btn = e.target.closest(".remove-chip");
        if (!btn) return;
    
        const filterType = btn.dataset.filter;
        const value = btn.dataset.value;
    
        const filterEl = document.getElementById(filterType);
        const checkboxes = filterEl.querySelectorAll('input[type="checkbox"]');
    
        checkboxes.forEach(cb => {
            if (cb.value === value) {
                cb.checked = false;
            }
        });
    
        filterreentries(all_reentries);
    });

    // FAQ generation
    const faqData = [ 
        { question: "What are these chemicals?",
            answer: "NO<sub>x</sub> is nitrogen oxides, BC is black carbon or soot, and Cl<sub>y</sub> is a family of chlorine compounds. AlO<sub>x</sub> is a family of oxidised aluminium compounds produced as metal objects re-enter the Earth's atmosphere. The current scientific understanding is that this may be a mixture of aluminium oxide (alumina, Al<sub>2</sub>O<sub>3</sub>) and aluminium hydroxide (Al(OH)<sub>3</sub>). NO<sub>x</sub> and Cl<sub>y</sub> are gases. BC and Al<sub>2</sub>O<sub>3</sub> are particles."
        },
        { question: "How do these chemicals affect the atmosphere?",
            answer: "Re-entries release air pollutant emissions into the upper layers of the atmosphere, where they can have an outsized impact on our atmosphere and climate. NO<sub>x</sub> and Cl<sub>y</sub> are the largest contributors to destruction of the ozone layer from rocket emissions, with smaller destruction occuring from emissions of BC and AlO<sub>x</sub>. The largest climate impacts come from BC emissions, which absorb sunlight in the upper layers of the atmosphere, stopping it reaching the lower layers."
        },
        { question: "What does each filter represent?",
            answer: "Re-entry point allows users to filter for re-entering objects that are known and that we have had to approximate, as exact location data is not available. Known re-entries are further separated into Falcon and non-Falcon rocket and fairing re-entries.  Object Type distinguishes individual re-entering objects as Payload (P), C=Component (C1), Booster (B1-B4), and rocket stage (S1-S5). Megaconstellation allows users to select re-entries that are or are not associated with megaconstellation missions."
        },
        { question: "How is this data calculated?",
            answer: "Our calculations are based on the current best scientific knowledge available for emissions from object re-entries. We use object-specific ablation profiles to calculate AlO<sub>x</sub> emissions from object re-entries, including all objects with an apogee above 50 km. Emissions from failed launches before 2020 are not included."
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

window.addEventListener('load', () => {
    fetchEventsData();
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
            Plotly.Plots.resize(document.getElementById('stackchart'));
            Plotly.Plots.resize(document.getElementById('piechart'));
            if (window.lastFilteredData) {
                updateGraph(window.lastFilteredData);
            }
        }
    }, 300);
});

window.addEventListener('resize', () => {
    if (window.lastFilteredData) {
        updateGraph(window.lastFilteredData);
    }
});
