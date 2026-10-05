
/**
 * VSWR Calculator for Complex Load Impedance
 * Calculates Voltage Standing Wave Ratio across multiple frequencies with user-defined loads per frequency
 */

/**
 * Complex number operations
 */
class Complex {
	constructor(real = 0, imag = 0) {
		this.real = real;
		this.imag = imag;
	}

	// Addition
	add(other) {
		return new Complex(this.real + other.real, this.imag + other.imag);
	}

	// Subtraction
	subtract(other) {
		return new Complex(this.real - other.real, this.imag - other.imag);
	}

	// Multiplication
	multiply(other) {
		const real = this.real * other.real - this.imag * other.imag;
		const imag = this.real * other.imag + this.imag * other.real;
		return new Complex(real, imag);
	}

	// Division
	divide(other) {
		const denominator = other.real ** 2 + other.imag ** 2;
		const real = (this.real * other.real + this.imag * other.imag) / denominator;
		const imag = (this.imag * other.real - this.real * other.imag) / denominator;
		return new Complex(real, imag);
	}

	// Magnitude
	magnitude() {
		return Math.sqrt(this.real ** 2 + this.imag ** 2);
	}

	// Phase in radians
	phase() {
		return Math.atan2(this.imag, this.real);
	}

	// String representation
	toString() {
		const sign = this.imag >= 0 ? '+' : '';
		return `${this.real.toFixed(2)} ${sign} j${this.imag.toFixed(2)}`;
	}

	// Convert to string for display
	toDisplayString() {
		if (Math.abs(this.imag) < 0.001) {
			return `${this.real.toFixed(2)}`;
		}
		if (Math.abs(this.real) < 0.001) {
			return `j${this.imag.toFixed(2)}`;
		}
		const sign = this.imag >= 0 ? '+' : '';
		return `${this.real.toFixed(2)} ${sign}j${this.imag.toFixed(2)}`;
	}
}

/**
 * Calculate VSWR from impedances
 * @param {Complex} Z_L - Load impedance
 * @param {Complex} Z_0 - Characteristic impedance
 * @returns {object} - Object with gamma (magnitude), VSWR, and formatted strings
 */
function calculateVSWRfromImpedance(Z_L, Z_0) {
	// Reflection coefficient: Γ = (Z_L - Z_0) / (Z_L + Z_0)
	const numerator = Z_L.subtract(Z_0);
	const denominator = Z_L.add(Z_0);
    
	// Avoid division by zero
	if (denominator.magnitude() === 0) {
		return {
			gamma_magnitude: 0,
			gamma_phase: 0,
			gamma_string: '0.00',
			vswr: 1.00,
			vswr_string: '1.00'
		};
	}

	const gamma = numerator.divide(denominator);
	const gamma_mag = gamma.magnitude();
	const gamma_phase = gamma.phase();

	// VSWR = (1 + |Γ|) / (1 - |Γ|)
	// Handle case where gamma_mag ≈ 1 (high mismatch)
	let vswr;
	if (gamma_mag >= 0.9999) {
		vswr = 999.99;
	} else {
		vswr = (1 + gamma_mag) / (1 - gamma_mag);
	}

	return {
		gamma_magnitude: gamma_mag,
		gamma_phase: gamma_phase,
		gamma_string: `${gamma_mag.toFixed(4)} ∠${(gamma_phase * 180 / Math.PI).toFixed(1)}°`,
		vswr: vswr,
		vswr_string: vswr >= 999 ? '∞' : vswr.toFixed(2)
	};
}

/**
 * Parse frequency input and generate frequency array with loads
 */
function getFrequenciesWithLoads() {
	const rows = document.querySelectorAll('.freq-input-row');
	const frequencies = [];

	rows.forEach(row => {
		const freqInput = row.querySelector('.freq-input');
		const resistanceInput = row.querySelector('.resistance-input');
		const reactanceInput = row.querySelector('.reactance-input');

		const freq = parseFloat(freqInput.value);
		const resistance = parseFloat(resistanceInput.value);
		const reactance = parseFloat(reactanceInput.value);

		if (!isNaN(freq) && freq > 0 && !isNaN(resistance) && !isNaN(reactance)) {
			frequencies.push({
				frequency: freq,
				resistance: resistance,
				reactance: reactance
			});
		}
	});

	// Sort by frequency
	frequencies.sort((a, b) => a.frequency - b.frequency);

	return frequencies;
}

/**
 * Add a new frequency row to the table
 */
function addFrequencyRow() {
	const tbody = document.getElementById('freqTableBody');
	if (!tbody) return;

	const row = document.createElement('tr');
	row.className = 'freq-input-row';
	row.innerHTML = `
		<td><input type="number" class="freq-input" placeholder="e.g., 100" step="any"></td>
		<td><input type="number" class="resistance-input" placeholder="e.g., 50" step="any"></td>
		<td><input type="number" class="reactance-input" placeholder="e.g., 0" step="any"></td>
		<td><button type="button" class="remove-btn" data-remove-frequency>Remove</button></td>
	`;

	const removeBtn = row.querySelector('[data-remove-frequency]');
	if (removeBtn) {
		removeBtn.addEventListener('click', () => removeFrequencyRow(removeBtn));
	}

	tbody.appendChild(row);
}

/**
 * Sections table helpers
 */
function addSectionRow() {
	const tbody = document.getElementById('sectionsBody');
	if (!tbody) return;

	const existingRows = tbody.querySelectorAll('tr').length;
	const sectionNumber = Math.floor(existingRows / 2) + 1;

	const row1 = document.createElement('tr');
	row1.dataset.section = String(sectionNumber);
	row1.innerHTML = `
		<td rowspan="2">${sectionNumber}</td>
		<td>Line1</td>
		<td><input type="number" data-section-field="line1-length-min" value="0" step="any" min="0"></td>
		<td><input type="number" data-section-field="line1-length-max" value="50" step="any" min="0"></td>
		<td><input type="number" data-section-field="line1-ro-min" value="10" step="any" min="0"></td>
		<td><input type="number" data-section-field="line1-ro-max" value="100" step="any" min="0"></td>
		<td rowspan="2"><button type="button" class="remove-btn" data-remove-section>Remove</button></td>
	`;
	const removeSectionBtn = row1.querySelector('[data-remove-section]');
	if (removeSectionBtn) {
		removeSectionBtn.addEventListener('click', () => removeSectionRow(removeSectionBtn));
	}

	const row2 = document.createElement('tr');
	row2.dataset.section = String(sectionNumber);
	row2.innerHTML = `
		<td>Line2</td>
		<td><input type="number" data-section-field="line2-length-min" value="0" step="any" min="0"></td>
		<td><input type="number" data-section-field="line2-length-max" value="200" step="any" min="0"></td>
		<td><input type="number" data-section-field="line2-ro-min" value="10" step="any" min="0"></td>
		<td><input type="number" data-section-field="line2-ro-max" value="100" step="any" min="0"></td>
	`;

	tbody.appendChild(row1);
	tbody.appendChild(row2);
}

function removeSectionRow(button) {
	const row = button && button.closest ? button.closest('tr') : null;
	if (!row) return;

	const nextRow = row.nextElementSibling;
	if (nextRow && row.parentElement === nextRow.parentElement) {
		nextRow.remove();
	}
	row.remove();

	const rows = document.querySelectorAll('#sectionsBody tr');
	for (let i = 0; i < rows.length; i += 2) {
		const sectionCell = rows[i]?.querySelector('td');
		if (sectionCell) {
			sectionCell.textContent = `${Math.floor(i / 2) + 1}`;
		}
	}
}

/**
 * Remove a frequency row from the table
 */
function removeFrequencyRow(button) {
	const row = button && button.closest ? button.closest('tr') : null;
	if (!row) return;
	row.remove();

	const remainingRows = document.querySelectorAll('#freqTableBody .freq-input-row');
	if (remainingRows.length === 0) {
		addFrequencyRow();
	}
}

/**
 * Main calculation function - Updated to use frequency-specific loads
 */
function calculateVSWR() {
	// Get input values
	const feedingImpedanceInput = parseFloat(document.getElementById('feedingImpedance')?.value);

	if (isNaN(feedingImpedanceInput) || feedingImpedanceInput <= 0) {
		alert('Please enter a valid feeding line characteristic impedance');
		return;
	}

	const frequenciesWithLoads = getFrequenciesWithLoads();
	if (frequenciesWithLoads.length === 0) {
		alert('Please enter at least one frequency with resistance and reactance values');
		return;
	}

	const Ro_feed = new Complex(feedingImpedanceInput, 0);
	const vFactorInput = parseFloat(document.getElementById('velocityFactor')?.value);
	const velocityFactor = (!isNaN(vFactorInput) && vFactorInput > 0) ? vFactorInput : 1.0;
	const sectionRows = document.querySelectorAll('#sectionsBody tr');
	const sections = [];

	function randRange(min, max) {
		const mn = isNaN(min) ? 0 : min;
		const mx = isNaN(max) ? mn : max;
		if (mx < mn) return mn;
		return mn + Math.random() * (mx - mn);
	}

	for (let i = 0; i < sectionRows.length; i += 2) {
		const row1 = sectionRows[i];
		const row2 = sectionRows[i + 1] || sectionRows[i];
		if (!row1) continue;

		const line1LenMin = parseFloat(row1.querySelector('[data-section-field="line1-length-min"]')?.value);
		const line1LenMax = parseFloat(row1.querySelector('[data-section-field="line1-length-max"]')?.value);
		const line1RoMin = parseFloat(row1.querySelector('[data-section-field="line1-ro-min"]')?.value);
		const line1RoMax = parseFloat(row1.querySelector('[data-section-field="line1-ro-max"]')?.value);

		const line2LenMin = parseFloat(row2.querySelector('[data-section-field="line2-length-min"]')?.value);
		const line2LenMax = parseFloat(row2.querySelector('[data-section-field="line2-length-max"]')?.value);
		const line2RoMin = parseFloat(row2.querySelector('[data-section-field="line2-ro-min"]')?.value);
		const line2RoMax = parseFloat(row2.querySelector('[data-section-field="line2-ro-max"]')?.value);

		const line1Length_mm = randRange(line1LenMin, line1LenMax);
		const line2Length_mm = randRange(line2LenMin, line2LenMax);
		const line1Ro = randRange(line1RoMin, line1RoMax);
		const line2Ro = randRange(line2RoMin, line2RoMax);

		sections.push({
			sectionNumber: sections.length + 1,
			stubLen_mm: line1Length_mm,
			mainLen_mm: line2Length_mm,
			stubRo: line1Ro,
			mainRo: line2Ro,
			line1Length_mm: line1Length_mm,
			line1Ro: line1Ro,
			line2Length_mm: line2Length_mm,
			line2Ro: line2Ro
		});
	}

	const results = [];

	frequenciesWithLoads.forEach(item => {
		let Zcurrent = new Complex(item.resistance, item.reactance);
		const c = 299792458;
		const freqHz = item.frequency * 1e6;
		const vp = c * velocityFactor;
		const beta = 2 * Math.PI * freqHz / vp;

		function parallel(Za, Zb) {
			return Za.multiply(Zb).divide(Za.add(Zb));
		}

		sections.forEach(s => {
			const Lstub = (isNaN(s.stubLen_mm) ? 0 : s.stubLen_mm) / 1000.0;
			const tan_stub = Math.tan(beta * Lstub);
			const Ro_stub_input = new Complex(0, s.stubRo * tan_stub);
			const Zcombined = parallel(Zcurrent, Ro_stub_input);

			const Lmain = (isNaN(s.mainLen_mm) ? 0 : s.mainLen_mm) / 1000.0;
			const tan_main = Math.tan(beta * Lmain);
			const Ro_main = new Complex(s.mainRo, 0);
			const denom_alt = Ro_main.add(Zcombined.multiply(new Complex(0, tan_main)));
			const numer_alt = Zcombined.add(new Complex(0, Ro_main.real * tan_main));
			const Zin_section = Ro_main.multiply(numer_alt).divide(denom_alt);
			Zcurrent = Zin_section;
		});

		const Zin = Zcurrent;
		const vswr_data = calculateVSWRfromImpedance(Zin, Ro_feed);

		results.push({
			frequency: item.frequency,
			load_impedance: Zin,
			gamma: vswr_data.gamma_string,
			gamma_mag: vswr_data.gamma_magnitude,
			vswr: vswr_data.vswr_string,
			vswr_value: vswr_data.vswr
		});
	});

	try {
		if (Array.isArray(sections) && sections.length > 0) {
			console.log('Selected section values:');
			sections.forEach(section => {
				console.log(`Section ${section.sectionNumber}: Line1 = ${Number(section.line1Length_mm).toFixed(2)} mm, ${Number(section.line1Ro).toFixed(2)} Ω | Line2 = ${Number(section.line2Length_mm).toFixed(2)} mm, ${Number(section.line2Ro).toFixed(2)} Ω`);
			});
		}

		if (results.length > 0) {
			let maxR = results[0];
			for (let i = 1; i < results.length; i++) {
				if (results[i].vswr_value > maxR.vswr_value) maxR = results[i];
			}
			console.log('Max VSWR:', maxR.vswr, ' (numeric:', Number(maxR.vswr_value.toFixed(4)), ')');
			console.log('Zin (next Zload):', maxR.load_impedance.toDisplayString(), `[${maxR.load_impedance.real.toFixed(4)} + j${maxR.load_impedance.imag.toFixed(4)}]`);
		} else {
			console.log('Max VSWR: N/A');
		}
	} catch (e) {
		// ignore console errors
	}

	displayResults(results, sections);
}

/**
 * Display results in the table - shows the actual chosen values for every section and the maximum VSWR summary
 */
function displayResults(results, sections) {
	const resultsBody = document.getElementById('resultsBody');
	if (!resultsBody) return;

	if (!results || results.length === 0) {
		resultsBody.innerHTML = '<tr><td colspan="2" class="no-results">No results to display</td></tr>';
		return;
	}

	resultsBody.innerHTML = '';

	if (Array.isArray(sections) && sections.length > 0) {
		const sectionHeader = document.createElement('tr');
		sectionHeader.innerHTML = '<td colspan="2"><strong>Chosen section values</strong></td>';
		resultsBody.appendChild(sectionHeader);

		sections.forEach(section => {
			const row = document.createElement('tr');
			row.innerHTML = `
				<td>Section ${section.sectionNumber}</td>
				<td>Line1: ${Number(section.line1Length_mm).toFixed(2)} mm, ${Number(section.line1Ro).toFixed(2)} Ω<br>Line2: ${Number(section.line2Length_mm).toFixed(2)} mm, ${Number(section.line2Ro).toFixed(2)} Ω</td>
			`;
			resultsBody.appendChild(row);
		});
	}

	let maxResult = results[0];
	let maxVSWRValue = maxResult.vswr_value;

	for (let i = 1; i < results.length; i++) {
		if (results[i].vswr_value > maxVSWRValue) {
			maxVSWRValue = results[i].vswr_value;
			maxResult = results[i];
		}
	}

	const summaryHeader = document.createElement('tr');
	summaryHeader.innerHTML = '<td colspan="2"><strong>Maximum VSWR summary</strong></td>';
	resultsBody.appendChild(summaryHeader);

	const gamma_mag = maxResult.gamma_mag || 0;
	let mismatchLoss = '0.00';
	if (gamma_mag >= 1) {
		mismatchLoss = '∞';
	} else {
		const ml = -10 * Math.log10(1 - gamma_mag * gamma_mag);
		mismatchLoss = `${ml.toFixed(2)} dB`;
	}

	const items = [
		{p: 'Maximum VSWR', v: `${maxResult.vswr}`},
		{p: 'Mismatch Loss', v: mismatchLoss}
	];

	items.forEach(it => {
		const r = document.createElement('tr');
		r.innerHTML = `<td>${it.p}</td><td>${it.v}</td>`;
		resultsBody.appendChild(r);
	});
}

/**
 * Clear results
 */
function clearResults() {
	document.getElementById('resultsBody').innerHTML = 
		'<tr><td colspan="2" class="no-results">Results will appear here after calculation</td></tr>';
}

function clearConsole() {
	try {
		console.clear();
	} catch (e) {
		// some browsers may restrict console.clear; ignore
	}
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
	// Set default value for characteristic impedance
	const feedingImpedance = document.getElementById('feedingImpedance');
	if (feedingImpedance && feedingImpedance.value === '') {
		feedingImpedance.value = '50';
	}

	// Add one default empty row
	addFrequencyRow();
});

