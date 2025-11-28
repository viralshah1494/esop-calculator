// ESOP Calculator - India Tax Rules
// Based on Excel calculation logic

const shareQuantities = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];

// Tab switching logic
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active to clicked
            btn.classList.add('active');
            document.getElementById('tab-' + tabId).classList.add('active');
        });
    });

    // Initial calculations for all tabs
    calculateExerciseTab();
});

// Get inputs for Exercise Only tab (multiple strike prices)
function getExerciseInputs() {
    const strikePricesStr = document.getElementById('ex_strikePrices').value || '';
    const strikePrices = strikePricesStr.split(',')
        .map(s => parseFloat(s.trim()))
        .filter(n => !isNaN(n) && n >= 0);

    return {
        strikePrices: strikePrices.length > 0 ? strikePrices : [0.133],
        fmvPrice: parseFloat(document.getElementById('ex_fmvPrice').value) || 0,
        dollarRate: parseFloat(document.getElementById('ex_dollarRate').value) || 0,
        shortTermTaxHigh: (parseFloat(document.getElementById('ex_shortTermTaxHigh').value) || 0) / 100,
        shortTermTaxActual: (parseFloat(document.getElementById('ex_shortTermTaxActual').value) || 0) / 100
    };
}

// Get inputs for Vested Options (Same-Day Sale) tab
function getVestedInputs() {
    return {
        strikePrice: parseFloat(document.getElementById('vs_strikePrice').value) || 0,
        fmvPrice: parseFloat(document.getElementById('vs_fmvPrice').value) || 0,
        sellPrice: parseFloat(document.getElementById('vs_sellPrice').value) || 0,
        dollarRate: parseFloat(document.getElementById('vs_dollarRate').value) || 0,
        shortTermTaxHigh: (parseFloat(document.getElementById('vs_shortTermTaxHigh').value) || 0) / 100,
        shortTermTaxActual: (parseFloat(document.getElementById('vs_shortTermTaxActual').value) || 0) / 100
    };
}

// Get inputs for Long Term Sale tab
function getLongTermInputs() {
    return {
        fmvAtExercise: parseFloat(document.getElementById('lt_fmvAtExercise').value) || 0,
        sellPrice: parseFloat(document.getElementById('lt_sellPrice').value) || 0,
        dollarRate: parseFloat(document.getElementById('lt_dollarRate').value) || 0,
        longTermTax: (parseFloat(document.getElementById('lt_longTermTax').value) || 0) / 100
    };
}

// Get inputs for Comparison tab
function getComparisonInputs() {
    return {
        strikePrice: parseFloat(document.getElementById('cp_strikePrice').value) || 0,
        fmvPrice: parseFloat(document.getElementById('cp_fmvPrice').value) || 0,
        fmvAtExercise: parseFloat(document.getElementById('cp_fmvAtExercise').value) || 0,
        sellPrice: parseFloat(document.getElementById('cp_sellPrice').value) || 0,
        dollarRate: parseFloat(document.getElementById('cp_dollarRate').value) || 0,
        shortTermTaxHigh: (parseFloat(document.getElementById('cp_shortTermTaxHigh').value) || 0) / 100,
        shortTermTaxActual: (parseFloat(document.getElementById('cp_shortTermTaxActual').value) || 0) / 100,
        longTermTax: (parseFloat(document.getElementById('cp_longTermTax').value) || 0) / 100
    };
}

function formatUSD(value) {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatINR(value) {
    return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDual(usdValue, dollarRate) {
    const inrValue = usdValue * dollarRate;
    return `<span class="usd-value">${formatUSD(usdValue)}</span><span class="inr-value">${formatINR(inrValue)}</span>`;
}

function formatNumber(value) {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function calculateTaxEvents(inputs) {
    const { strikePrice, fmvPrice, fmvAtExercise, sellPrice, shortTermTaxHigh, shortTermTaxActual, longTermTax } = inputs;
    
    return {
        taxEvent1High: (fmvPrice - strikePrice) * shortTermTaxHigh,      // Perquisite tax per share (high rate)
        taxEvent1Actual: (fmvPrice - strikePrice) * shortTermTaxActual,  // Perquisite tax per share (actual rate)
        overallTax: (sellPrice - strikePrice) * shortTermTaxHigh,        // Overall tax if direct sale
        taxEvent2Short: (sellPrice - fmvPrice) * shortTermTaxHigh,       // Short term capital gains tax
        taxEvent2Long: (sellPrice - fmvAtExercise) * longTermTax         // Long term capital gains tax
    };
}

function calculateVestedOptions(numOptions, inputs, taxEvents) {
    const { strikePrice, sellPrice, dollarRate } = inputs;
    
    const exerciseAmount = numOptions * strikePrice;
    const sellProceeds = numOptions * sellPrice;
    const taxEvent1 = numOptions * taxEvents.taxEvent1High;
    const companyDeducts = exerciseAmount + taxEvent1;
    const transferToAccount = sellProceeds - companyDeducts;
    const transferInRs = transferToAccount * dollarRate;
    const taxEvent2Short = numOptions * taxEvents.taxEvent2Short;
    const overallDirectTax = numOptions * taxEvents.overallTax;
    const finalRemains = transferToAccount - taxEvent2Short;
    const taxRefund = numOptions * (taxEvents.taxEvent1High - taxEvents.taxEvent1Actual);
    const finalWithRefund = finalRemains + taxRefund;
    const finalInRs = finalWithRefund * dollarRate;
    
    return {
        numOptions, exerciseAmount, sellProceeds, taxEvent1, companyDeducts,
        transferToAccount, transferInRs, taxEvent2Short, overallDirectTax,
        finalRemains, taxRefund, finalWithRefund, finalInRs
    };
}

function calculateExercisedShares(numShares, inputs, taxEvents) {
    const { sellPrice, dollarRate } = inputs;
    
    const sellProceeds = numShares * sellPrice;
    const transferToAccount = sellProceeds;
    const transferInRs = transferToAccount * dollarRate;
    const taxEvent2Long = numShares * taxEvents.taxEvent2Long;
    const finalRemains = transferToAccount - taxEvent2Long;
    const finalInRs = finalRemains * dollarRate;
    
    return {
        numShares, sellProceeds, transferToAccount, transferInRs,
        taxEvent2Long, finalRemains, finalInRs
    };
}

function calculateExerciseOnly(numOptions, inputs, taxEvents) {
    const { strikePrice } = inputs;

    const exerciseAmount = numOptions * strikePrice;
    const taxAtHighRate = numOptions * taxEvents.taxEvent1High;      // Company deducts at 42.74%
    const taxAtActualRate = numOptions * taxEvents.taxEvent1Actual;  // Your actual tax slab
    const totalCompanyDeducts = exerciseAmount + taxAtHighRate;      // What you pay upfront
    const taxRefund = taxAtHighRate - taxAtActualRate;               // Claim in ITR
    const netCostAfterRefund = totalCompanyDeducts - taxRefund;      // Effective cost

    return {
        numOptions,
        exerciseAmount,
        taxAtHighRate,
        taxAtActualRate,
        totalCompanyDeducts,
        taxRefund,
        netCostAfterRefund
    };
}

function renderSummary(inputs, taxEvents) {
    const grid = document.getElementById('summaryGrid');
    const { dollarRate } = inputs;
    const items = [
        { label: 'Perquisite Tax (High) / Share', usd: taxEvents.taxEvent1High },
        { label: 'Perquisite Tax (Actual) / Share', usd: taxEvents.taxEvent1Actual },
        { label: 'Short Term CG Tax / Share', usd: taxEvents.taxEvent2Short },
        { label: 'Long Term CG Tax / Share', usd: taxEvents.taxEvent2Long },
        { label: 'Gain per Share (Sell - Strike)', usd: inputs.sellPrice - inputs.strikePrice },
        { label: 'FMV Gain (FMV - Strike)', usd: inputs.fmvPrice - inputs.strikePrice }
    ];

    grid.innerHTML = items.map(item => `
        <div class="summary-item">
            <div class="label">${item.label}</div>
            <div class="value dual-value">
                <span class="usd-value">${formatUSD(item.usd)}</span>
                <span class="inr-value">${formatINR(item.usd * dollarRate)}</span>
            </div>
        </div>
    `).join('');
}

function renderVestedOptionsTable(data, dollarRate) {
    const table = document.getElementById('vestedOptionsTable');
    table.querySelector('thead').innerHTML = `
        <tr>
            <th>Options</th>
            <th>Exercise Cost</th>
            <th>Sell Proceeds</th>
            <th>Tax Event 1<br><small>(Perquisite)</small></th>
            <th>Company Deducts</th>
            <th>Transfer to A/C</th>
            <th>Tax Event 2<br><small>(STCG)</small></th>
            <th>Tax Refund</th>
            <th>Final Amount</th>
        </tr>`;

    table.querySelector('tbody').innerHTML = data.map(row => `
        <tr>
            <td>${formatNumber(row.numOptions)}</td>
            <td>${formatDual(row.exerciseAmount, dollarRate)}</td>
            <td>${formatDual(row.sellProceeds, dollarRate)}</td>
            <td>${formatDual(row.taxEvent1, dollarRate)}</td>
            <td>${formatDual(row.companyDeducts, dollarRate)}</td>
            <td>${formatDual(row.transferToAccount, dollarRate)}</td>
            <td>${formatDual(row.taxEvent2Short, dollarRate)}</td>
            <td>${formatDual(row.taxRefund, dollarRate)}</td>
            <td class="highlight">${formatDual(row.finalWithRefund, dollarRate)}</td>
        </tr>`).join('');
}

function renderExercisedSharesTable(data, dollarRate) {
    const table = document.getElementById('exercisedSharesTable');
    table.querySelector('thead').innerHTML = `
        <tr>
            <th>Shares</th>
            <th>Sell Proceeds</th>
            <th>Transfer to A/C</th>
            <th>Tax Event 2<br><small>(LTCG)</small></th>
            <th>Final Amount</th>
        </tr>`;

    table.querySelector('tbody').innerHTML = data.map(row => `
        <tr>
            <td>${formatNumber(row.numShares)}</td>
            <td>${formatDual(row.sellProceeds, dollarRate)}</td>
            <td>${formatDual(row.transferToAccount, dollarRate)}</td>
            <td>${formatDual(row.taxEvent2Long, dollarRate)}</td>
            <td class="highlight">${formatDual(row.finalRemains, dollarRate)}</td>
        </tr>`).join('');
}

function renderExerciseOnlyTable(data, dollarRate) {
    const table = document.getElementById('exerciseOnlyTable');
    table.querySelector('thead').innerHTML = `
        <tr>
            <th>Options</th>
            <th>Exercise Amount</th>
            <th>Tax @ High Rate<br><small>(42.74% - Company Deducts)</small></th>
            <th>Total Company Deducts<br><small>(Upfront Payment)</small></th>
            <th>Tax @ Actual Rate<br><small>(Your Slab)</small></th>
            <th>Tax Refund<br><small>(Claim in ITR)</small></th>
            <th>Net Cost<br><small>(After Refund)</small></th>
        </tr>`;

    table.querySelector('tbody').innerHTML = data.map(row => `
        <tr>
            <td>${formatNumber(row.numOptions)}</td>
            <td>${formatDual(row.exerciseAmount, dollarRate)}</td>
            <td>${formatDual(row.taxAtHighRate, dollarRate)}</td>
            <td class="highlight-warning">${formatDual(row.totalCompanyDeducts, dollarRate)}</td>
            <td>${formatDual(row.taxAtActualRate, dollarRate)}</td>
            <td class="highlight-positive">${formatDual(row.taxRefund, dollarRate)}</td>
            <td class="highlight">${formatDual(row.netCostAfterRefund, dollarRate)}</td>
        </tr>`).join('');
}

function renderComparisonTable(vestedData, exercisedData, exerciseData, dollarRate) {
    const table = document.getElementById('comparisonTable');
    table.querySelector('thead').innerHTML = `
        <tr>
            <th>Quantity</th>
            <th>Option Sale<br><small>(Final)</small></th>
            <th>Share Sale<br><small>(Final)</small></th>
            <th>Exercise Cost</th>
            <th>Net Gain<br><small>(Options)</small></th>
            <th>Net Gain<br><small>(Shares)</small></th>
            <th>Difference</th>
            <th>Better Option</th>
        </tr>`;

    table.querySelector('tbody').innerHTML = vestedData.map((vested, i) => {
        const exercised = exercisedData[i];
        const exercise = exerciseData[i];
        const netOptions = vested.finalWithRefund;
        const netShares = exercised.finalRemains - exercise.netCostAfterRefund;
        const diff = netShares - netOptions;
        const better = diff > 0 ? 'Shares (LTCG)' : 'Options (Same-Day)';
        const betterClass = diff > 0 ? 'positive' : 'negative';

        return `
        <tr>
            <td>${formatNumber(vested.numOptions)}</td>
            <td>${formatDual(vested.finalWithRefund, dollarRate)}</td>
            <td>${formatDual(exercised.finalRemains, dollarRate)}</td>
            <td>${formatDual(exercise.netCostAfterRefund, dollarRate)}</td>
            <td>${formatDual(netOptions, dollarRate)}</td>
            <td>${formatDual(netShares, dollarRate)}</td>
            <td class="${betterClass}">${formatDual(Math.abs(diff), dollarRate)}</td>
            <td class="${betterClass}">${better}</td>
        </tr>`;
    }).join('');
}

// Tab-specific calculate functions
function calculateExerciseTab() {
    const inputs = getExerciseInputs();
    const container = document.getElementById('exerciseTablesContainer');
    container.innerHTML = '';

    // Generate a table for each strike price
    inputs.strikePrices.forEach((strikePrice, index) => {
        const singleInputs = { ...inputs, strikePrice };
        const taxEvents = {
            taxEvent1High: (inputs.fmvPrice - strikePrice) * inputs.shortTermTaxHigh,
            taxEvent1Actual: (inputs.fmvPrice - strikePrice) * inputs.shortTermTaxActual
        };

        const exerciseData = shareQuantities.map(qty => calculateExerciseOnly(qty, singleInputs, taxEvents));

        // Create table wrapper
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper strike-table';
        tableWrapper.innerHTML = `
            <h3 class="strike-header">Strike Price: $${strikePrice.toFixed(3)} <span class="perquisite-info">(Perquisite/share: $${(inputs.fmvPrice - strikePrice).toFixed(2)})</span></h3>
            <table id="exerciseTable_${index}">
                <thead></thead>
                <tbody></tbody>
            </table>
        `;
        container.appendChild(tableWrapper);

        // Render table data
        renderExerciseOnlyTableById(`exerciseTable_${index}`, exerciseData, inputs.dollarRate);
    });

    // Add comparison summary
    renderExerciseComparison(inputs);
}

function renderExerciseOnlyTableById(tableId, data, dollarRate) {
    const table = document.getElementById(tableId);
    table.querySelector('thead').innerHTML = `
        <tr>
            <th>Options</th>
            <th>Exercise Amount</th>
            <th>Tax @ High Rate<br><small>(Company Deducts)</small></th>
            <th>Total Upfront<br><small>(Company Deducts)</small></th>
            <th>Tax @ Actual Rate</th>
            <th>Tax Refund<br><small>(ITR Claim)</small></th>
            <th>Net Cost<br><small>(After Refund)</small></th>
        </tr>`;

    table.querySelector('tbody').innerHTML = data.map(row => `
        <tr>
            <td>${formatNumber(row.numOptions)}</td>
            <td>${formatDual(row.exerciseAmount, dollarRate)}</td>
            <td>${formatDual(row.taxAtHighRate, dollarRate)}</td>
            <td class="highlight-warning">${formatDual(row.totalCompanyDeducts, dollarRate)}</td>
            <td>${formatDual(row.taxAtActualRate, dollarRate)}</td>
            <td class="highlight-positive">${formatDual(row.taxRefund, dollarRate)}</td>
            <td class="highlight">${formatDual(row.netCostAfterRefund, dollarRate)}</td>
        </tr>`).join('');
}

function renderExerciseComparison(inputs) {
    const container = document.getElementById('exerciseTablesContainer');

    // Create comparison table
    const compDiv = document.createElement('div');
    compDiv.className = 'table-wrapper comparison-summary';
    compDiv.innerHTML = `
        <h3 class="comparison-header">📊 Comparison Summary - Net Cost After Refund</h3>
        <table id="exerciseComparisonTable">
            <thead></thead>
            <tbody></tbody>
        </table>
    `;
    container.appendChild(compDiv);

    const table = document.getElementById('exerciseComparisonTable');

    // Header row with strike prices
    let headerRow = '<tr><th>Options</th>';
    inputs.strikePrices.forEach(sp => {
        headerRow += `<th>@ $${sp.toFixed(3)}</th>`;
    });
    headerRow += '<th>Best Option</th></tr>';
    table.querySelector('thead').innerHTML = headerRow;

    // Body rows
    let bodyRows = '';
    shareQuantities.forEach(qty => {
        let row = `<tr><td>${formatNumber(qty)}</td>`;
        let costs = [];

        inputs.strikePrices.forEach(strikePrice => {
            const taxEvents = {
                taxEvent1High: (inputs.fmvPrice - strikePrice) * inputs.shortTermTaxHigh,
                taxEvent1Actual: (inputs.fmvPrice - strikePrice) * inputs.shortTermTaxActual
            };
            const data = calculateExerciseOnly(qty, { ...inputs, strikePrice }, taxEvents);
            costs.push({ strikePrice, netCost: data.netCostAfterRefund });
            row += `<td>${formatDual(data.netCostAfterRefund, inputs.dollarRate)}</td>`;
        });

        // Find best (lowest cost)
        const best = costs.reduce((min, c) => c.netCost < min.netCost ? c : min, costs[0]);
        row += `<td class="highlight">$${best.strikePrice.toFixed(3)}</td>`;
        row += '</tr>';
        bodyRows += row;
    });

    table.querySelector('tbody').innerHTML = bodyRows;
}

function calculateVestedTab() {
    const inputs = getVestedInputs();
    const taxEvents = {
        taxEvent1High: (inputs.fmvPrice - inputs.strikePrice) * inputs.shortTermTaxHigh,
        taxEvent1Actual: (inputs.fmvPrice - inputs.strikePrice) * inputs.shortTermTaxActual,
        taxEvent2Short: (inputs.sellPrice - inputs.fmvPrice) * inputs.shortTermTaxHigh
    };

    const vestedData = shareQuantities.map(qty => calculateVestedOptions(qty, inputs, taxEvents));
    renderVestedOptionsTable(vestedData, inputs.dollarRate);
}

function calculateLongTermTab() {
    const inputs = getLongTermInputs();
    const taxEvents = {
        taxEvent2Long: (inputs.sellPrice - inputs.fmvAtExercise) * inputs.longTermTax
    };

    const exercisedData = shareQuantities.map(qty => calculateExercisedShares(qty, inputs, taxEvents));
    renderExercisedSharesTable(exercisedData, inputs.dollarRate);
}

function calculateComparisonTab() {
    const inputs = getComparisonInputs();
    const taxEvents = calculateTaxEvents(inputs);
    const { dollarRate } = inputs;

    const vestedData = shareQuantities.map(qty => calculateVestedOptions(qty, inputs, taxEvents));
    const exercisedData = shareQuantities.map(qty => calculateExercisedShares(qty, inputs, taxEvents));
    const exerciseData = shareQuantities.map(qty => calculateExerciseOnly(qty, inputs, taxEvents));

    renderComparisonTable(vestedData, exercisedData, exerciseData, dollarRate);
}

