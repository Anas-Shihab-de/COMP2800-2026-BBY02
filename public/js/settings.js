const mapboxgl = window.mapboxgl;

// =========================
// MAPBOX ACCESS TOKEN
// =========================
const token = await fetch("/api/mapbox-token", {
  credentials: "include",
});
const tokenParsed = await token.json();
mapboxgl.accessToken = tokenParsed.token;

// =========================
// ELEMENTS
// =========================
const addressInput = document.getElementById("address-input");
const saveBtn = document.getElementById("save-address");
const slider = document.getElementById("radius-slider");
const radiusLabel = document.getElementById("radius-value");
const status = document.getElementById("status");

// =========================
// LOAD EXISTING SETTINGS (LOCAL)
// =========================
const saved = getSettings();

if (saved.address) {
  addressInput.value = saved.address;
}

if (saved.radius !== undefined) {
  slider.value = saved.radius;
  radiusLabel.textContent = saved.radius;
}

// =========================
// SLIDER UI UPDATE
// =========================
slider.addEventListener("input", () => {
  radiusLabel.textContent = slider.value;
});

// =========================
// SAVE BUTTON
// =========================
saveBtn.addEventListener("click", async () => {
  const address = addressInput.value.trim();
  const radius = Number(slider.value);

  if (!address) {
    setStatus("Please enter an address.");
    return;
  }

  setStatus("Geocoding address...");

  const coords = await geocodeAddress(address);

  if (!coords) {
    setStatus("Invalid address. Try again.");
    return;
  }

  const settings = {
    address,
    radius,
    location: coords,
  };

  // =========================
  // SAVE LOCALLY
  // =========================
  localStorage.setItem("userSettings", JSON.stringify(settings));



// =========================
// GET LOCAL SETTINGS
// =========================
function getSettings() {
  return (
    JSON.parse(localStorage.getItem("userSettings")) || {
      address: "",
      radius: 5,
      location: null,
    }
  );
}

// =========================
// SAVE TO MONGODB (AUTH USER)
// =========================
async function saveSettingsToMongo(settings) {
  const res = await fetch("/api/save-settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // sends login session/cookie
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    throw new Error("Failed to save to database");
  }

  return await res.json();
}

// =========================
// GEOCODE ADDRESS (MAPBOX)
// =========================
async function geocodeAddress(address) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${mapboxgl.accessToken}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    return data.features[0].center;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// =========================
// STATUS HELPER
// =========================
function setStatus(msg) {
  status.textContent = msg;
}