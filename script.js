const barSelect = document.getElementById("bar");
const repsInput = document.getElementById("reps");
const calculateButton = document.getElementById("calculate");
const resultDiv = document.getElementById("result");

// Available plates per side, largest to smallest, by unit
const PLATES = {
  lb: [45, 35, 25, 10, 5, 2.5],
  kg: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5]
};

// Bar options by unit
const BARS = {
  lb: [
    { weight: 45, label: "45 lb (standard)" },
    { weight: 35, label: "35 lb" },
    { weight: 30, label: "30 lb" }
  ],
  kg: [
    { weight: 20, label: "20 kg (standard)" },
    { weight: 15, label: "15 kg" },
    { weight: 10, label: "10 kg" }
  ]
};

// Warmup ramp: percent of working weight, plus prescribed reps
const WARMUP_RAMP = [
  { percent: 40, reps: 5 },
  { percent: 60, reps: 5 },
  { percent: 75, reps: 3 },
  { percent: 85, reps: 2 }
];

// RPE chart: keyed by RPE, each value is %s indexed by (reps - 1)
const RPE_CHART = {
  10:  [100, 95, 91, 87, 84, 81, 78, 75, 72, 70],
  9.5: [98, 93, 89, 86, 82, 79, 76, 73, 71, 68],
  9:   [96, 92, 88, 84, 81, 78, 75, 72, 69, 67],
  8.5: [94, 91, 86, 83, 79, 76, 73, 71, 68, 66],
  8:   [92, 89, 85, 81, 78, 75, 72, 69, 67, 64],
  7.5: [91, 87, 83, 80, 76, 73, 70, 68, 65, 63],
  7:   [89, 86, 82, 78, 75, 72, 69, 67, 64, 62],
  6.5: [88, 84, 80, 77, 73, 71, 68, 65, 63, 60],
  6:   [86, 83, 79, 75, 72, 69, 67, 64, 61, 59]
};

// Controls
const unitRadios = document.querySelectorAll('input[name="unit"]');
const modeRadios = document.querySelectorAll('input[name="mode"]');
const modeSections = document.querySelectorAll('.mode-section');

function getSelectedUnit() {
  return document.querySelector('input[name="unit"]:checked').value;
}

function getSelectedMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

// Rebuild the bar dropdown based on the selected unit
function populateBars(unit) {
  let html = "";
  for (const bar of BARS[unit]) {
    html += `<option value="${bar.weight}">${bar.label}</option>`;
  }
  barSelect.innerHTML = html;
}

// Show only the section matching the current mode
function updateModeUI() {
  const mode = getSelectedMode();
  modeSections.forEach(section => {
    section.classList.toggle('active', section.classList.contains(`mode-${mode}`));
  });
}

// Figure out the working weight from whatever mode is active
function calculateWorkingWeight() {
  const mode = getSelectedMode();
  
  if (mode === "weight") {
    return parseFloat(document.getElementById("working").value);
  }
  
  if (mode === "percent") {
    const oneRM = parseFloat(document.getElementById("oneRM-percent").value);
    const percent = parseFloat(document.getElementById("percent").value);
    return oneRM * (percent / 100);
  }
  
  if (mode === "rpe") {
    const oneRM = parseFloat(document.getElementById("oneRM-rpe").value);
    const reps = parseInt(repsInput.value);
    const rpe = parseFloat(document.getElementById("rpe-value").value);
    const percent = RPE_CHART[rpe][reps - 1];
    return oneRM * (percent / 100);
  }
}

// Figure out which plates to load per side to hit the target weight
function getPlatesPerSide(targetWeight, barWeight, availablePlates) {
  const perSide = (targetWeight - barWeight) / 2;
  
  if (perSide <= 0) {
    return [];
  }
  
  const platesUsed = [];
  let remaining = perSide;
  
  for (const plate of availablePlates) {
    while (remaining >= plate) {
      platesUsed.push(plate);
      remaining -= plate;
    }
  }
  
  return platesUsed;
}

// Sum plates × 2 + bar to get the actual loaded weight
function actualWeight(barWeight, plates) {
  let plateTotal = 0;
  for (const p of plates) {
    plateTotal += p;
  }
  return barWeight + (plateTotal * 2);
}

// Format the plate list for display
function formatPlates(plates) {
  if (plates.length === 0) {
    return "just the bar";
  }
  return plates.join(" · ") + " per side";
}

// Average of Epley and Brzycki — more robust than either alone in the 1-10 rep range
function projectedOneRM(weight, reps) {
  if (reps <= 1) {
    return weight;
  }
  const epley = weight * (1 + reps / 30);
  const brzycki = weight * (36 / (37 - reps));
  return (epley + brzycki) / 2;
}

// When unit changes, rebuild the bar dropdown
unitRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    populateBars(getSelectedUnit());
  });
});

// When mode changes, update which section is visible
modeRadios.forEach((radio) => {
  radio.addEventListener("change", updateModeUI);
});

// Initial setup
populateBars(getSelectedUnit());
updateModeUI();

calculateButton.addEventListener("click", () => {
  const unit = getSelectedUnit();
  const working = calculateWorkingWeight();
  const reps = parseInt(repsInput.value);
  const barWeight = parseFloat(barSelect.value);
  const availablePlates = PLATES[unit];
  
  // Graceful handling of missing or invalid input
  if (isNaN(working) || working <= 0) {
    resultDiv.innerHTML = '<div class="empty-state">Enter a weight to see your ramp.</div>';
    return;
  }
  
  let rows = "";
  
  for (const set of WARMUP_RAMP) {
    const target = working * (set.percent / 100);
    const plates = getPlatesPerSide(target, barWeight, availablePlates);
    const actual = actualWeight(barWeight, plates);
    
    rows += `
      <div class="set-row">
        <span class="set-label">${set.percent}% × ${set.reps}</span>
        <div class="set-detail">
          <span class="set-weight">${actual} ${unit}</span>
          <span class="set-plates">${formatPlates(plates)}</span>
        </div>
      </div>`;
  }
  
  const workingPlates = getPlatesPerSide(working, barWeight, availablePlates);
  const workingActual = actualWeight(barWeight, workingPlates);
  
  rows += `
      <div class="set-row working-row">
        <span class="set-label">Working × ${reps}</span>
        <div class="set-detail">
          <span class="set-weight">${workingActual} ${unit}</span>
          <span class="set-plates">${formatPlates(workingPlates)}</span>
        </div>
      </div>`;
  
  const projected = Math.round(projectedOneRM(workingActual, reps));
  rows += `
      <div class="projected-row">
        <span class="set-label">Projected 1RM</span>
        <span class="projected-value">${projected} ${unit}</span>
      </div>`;
  
  resultDiv.innerHTML = rows;
});