const workingInput = document.getElementById("working");
const barSelect = document.getElementById("bar");
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

// Find all unit radios
const unitRadios = document.querySelectorAll('input[name="unit"]');

// Get the currently selected unit
function getSelectedUnit() {
  return document.querySelector('input[name="unit"]:checked').value;
}

// Rebuild the bar dropdown options based on the selected unit
function populateBars(unit) {
  let html = "";
  for (const bar of BARS[unit]) {
    html += `<option value="${bar.weight}">${bar.label}</option>`;
  }
  barSelect.innerHTML = html;
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
    return "(just the bar)";
  }
  return "(" + plates.join(", ") + " per side)";
}

// When unit changes, rebuild the bar dropdown
unitRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    populateBars(getSelectedUnit());
  });
});

// Populate the bar dropdown when the page first loads
populateBars(getSelectedUnit());

calculateButton.addEventListener("click", () => {
  const unit = getSelectedUnit();
  const working = parseFloat(workingInput.value);
  const barWeight = parseFloat(barSelect.value);
  const availablePlates = PLATES[unit];
  
  let result = "";
  
  for (const set of WARMUP_RAMP) {
    const target = working * (set.percent / 100);
    const plates = getPlatesPerSide(target, barWeight, availablePlates);
    const actual = actualWeight(barWeight, plates);
    
    result += set.percent + "% × " + set.reps + ": " + actual + " " + unit + " " + formatPlates(plates) + "\n";
  }
  
  const workingPlates = getPlatesPerSide(working, barWeight, availablePlates);
  const workingActual = actualWeight(barWeight, workingPlates);
  
  result += `\n<span class="working-set">Working: ${workingActual} ${unit} ${formatPlates(workingPlates)}</span>`;
  
  resultDiv.innerHTML = result;
});