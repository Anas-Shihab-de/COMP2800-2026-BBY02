/**
 * CREDITS
 *
 * Anas: Wrote 90% of the map logic, wrote comments.
 * Sofia: Modified 10% of the code to implement the radius feature,
 *        wrote comments.
 *
 *
 * Side Note: references to local storage are old, defunct, and no
 * longer in use.
 *
 * A user's location is only saved upon clicking the Select this location
 * button, not when clicking a location on the map.
 */
const mapboxgl = window.mapboxgl;

// Fetches the mapbox token
const tokenRes = await fetch("/api/mapbox-token");
const tokenParsed = await tokenRes.json();
mapboxgl.accessToken = tokenParsed.token;

let map;
let userLocation;
let selectedLocation = null;
let userMarker = null;
let locationMarkers = [];

// The default radius
let radius = 5;
const slider = document.getElementById("radius-slider");
const radiusLabel = document.getElementById("radius-value");
const regionSelect = document.getElementById("regionSelector");

// List of locations within radius
let currentFilteredLocations = [];

// Coordinates to represent each region (Sofia)
const CENTER_OF_REGION = {
  downtownVancouver: [-123.1207, 49.2827],
  burnaby: [-122.9693, 49.2488],
  newWest: [-122.9109, 49.2057],
  richmond: [-123.136, 49.1666],
  coquitlam: [-122.7932, 49.2838],
};

await initializeMap();

/**
 * Initializes the map object.
 */
async function initializeMap() {
  // Gets user's saved location
  userLocation = await getUserLocation();

  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: userLocation,
    zoom: 13,
  });

  map.addControl(new mapboxgl.NavigationControl());

  map.once("load", async () => {
    // Places the user's marker on the map
    userMarker = createUserMarker(userLocation);

    setupMapClickHandler();
    setupSetLocationButton();
    setupCurrentLocationButton();

    // Adds the gray radius overlay
    updateMapMask(radius);

    // Keeps overlay the same, even upon zooming or moving the map
    map.on("move", () => updateMapMask(radius));
    map.on("zoom", () => updateMapMask(radius));

    // Sets up the dropdown menu
    setupRegionSelect();
  });
}

/**
 * Calculates the distance in kilometers between two coordinates.
 *
 * Uses the Haversine formula.
 *
 * @returns distance in kilometers
 */
function getDistanceKm(a, b) {
  const R = 6371;

  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;

  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return R * (2 * Math.asin(Math.sqrt(x)));
}

/**
 * Checks if a point is within a given radius.
 */
function isWithinRadius(userLoc, pointLoc, radiusKm) {
  return getDistanceKm(userLoc, pointLoc) <= radiusKm;
}

/**
 * Updates the gray radius overlay.
 */
function updateMapMask(radiusKm) {
  if (!map) return;

  const center = map.getCenter();
  const zoom = map.getZoom();

  // Converts km to px based on the current zoom level
  const mpp =
    (40075016.686 * Math.cos((center.lat * Math.PI) / 180)) /
    Math.pow(2, zoom + 8);

  const radiusMeters = radiusKm * 1000;
  let radiusPx = radiusMeters / mpp;

  // Tries to prevent the overlay from extending past the width/height of the map
  const rect = map.getCanvas().getBoundingClientRect();
  const maxRadius = Math.sqrt(rect.width ** 2 + rect.height ** 2) / 2;
  radiusPx = Math.min(radiusPx, maxRadius - 20);

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // The CSS overlay
  const mask = `radial-gradient(
        circle ${radiusPx}px at ${centerX}px ${centerY}px,
        transparent 0 ${radiusPx}px,
        black ${radiusPx}px 100%
        )`;

  const overlay = document.getElementById("map-overlay");
  overlay.style.webkitMaskImage = mask;
  overlay.style.maskImage = mask;
}

/**
 * Creates the marker representing the user's location.
 */
function createUserMarker(location) {
  return new mapboxgl.Marker({ color: "green" }).setLngLat(location).addTo(map);
}

/**
 * Collects data from the html page and uses the
 * backend API to save information to a user's fields
 * in the database.
 */
async function saveLocationToDB(location, radius, region = null) {
  const locationData = {
    selectedlocation: location,
    selectedradius: radius,
  };

  try {
    await fetch("/api/saveuserlocation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(locationData),
    });
  } catch (err) {
    console.error("There was a problem saving the location: ", err);
  }
}

/**
 * On click, creates a new location (selectedLocation),
 * then immediately sets the userLocation to it.
 *
 * Updates the user pin to be the new user location.
 */
function setupMapClickHandler() {
  map.on("click", (event) => {
    selectedLocation = [event.lngLat.lng, event.lngLat.lat];
    userLocation = selectedLocation;

    if (userMarker) {
      userMarker.setLngLat(userLocation);
    } else {
      userMarker = createUserMarker(userLocation);
    }

    map.flyTo({
      center: userLocation,
      zoom: 15,
    });

    const settings = JSON.parse(localStorage.getItem("userSettings")) || {};
    settings.location = userLocation;
    localStorage.setItem("userSettings", JSON.stringify(settings));

    loadLocations();
    updateMapMask(radius);
  });
}

/**
 * Creates the location button.
 */
function setupSetLocationButton() {
  const button = document.getElementById("set-location-btn");
  if (!button) return;

  button.addEventListener("click", handleSetLocation);
}

/**
 * Saves the user's chosen location to the database.
 *
 * Then redirects to the home page.
 */
function handleSetLocation() {
  console.log("Choose location clicked");
  console.log("userLocation is:", userLocation);

  if (!userLocation) {
    console.log("No userLocation, cannot save");
    return;
  }

  // Save to DB
  saveLocationToDB(userLocation, radius);

  const settings = JSON.parse(localStorage.getItem("userSettings")) || {};
  settings.location = userLocation;
  settings.radius = radius;
  localStorage.setItem("userSettings", JSON.stringify(settings));

  window.location.href = "/html/Home.html";
}

/**
 * Gets the user's location.
 *
 * Uses default location if none exists.
 */
async function getUserLocation() {
  const defaultLocation = [-123.0016, 49.2532];

  if (!navigator.geolocation) return defaultLocation;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve([pos.coords.longitude, pos.coords.latitude]);
      },
      () => resolve(defaultLocation),
    );
  });
}

/**
 * Loads all locations from the json folder into an array.
 *
 * Calls a helper function to add them to the map.
 */
async function loadLocations() {
  try {
    const res = await fetch("../resource/locations.JSON");
    const locations = await res.json();

    const arr = Array.isArray(locations) ? locations : [locations];
    renderLocations(arr);
  } catch (err) {
    console.error("There was an error loading the JSON file: ", err);
  }
}

/**
 * Gets the coordinates of every location, uses a
 * helper function to see what's within radius.
 *
 * Once the helper function returns, it sets the filtered
 * locations to it.
 */
function renderLocations(locations) {
  currentFilteredLocations = [];

  for (const loc of locations) {
    const coords = loc?.geo?.coordinates;
    if (!coords) continue;
    if (!userLocation) continue;

    if (!isWithinRadius(userLocation, coords, radius)) continue;

    currentFilteredLocations.push(loc);
  }

  console.log("Filtered locations within radius:", currentFilteredLocations);
}

/**
 * Creates the slider for search distance.
 *
 * Updates the map mask.
 */
slider?.addEventListener("input", () => {
  radius = Number(slider.value);
  if (radiusLabel) radiusLabel.textContent = radius;

  const settings = JSON.parse(localStorage.getItem("userSettings")) || {};
  settings.radius = radius;
  localStorage.setItem("userSettings", JSON.stringify(settings));

  updateMapMask(radius);
  loadLocations();

  const zoom = 14 - radius * 0.25;
  map.easeTo({ zoom, duration: 400 });
});

/**
 * Defines the "current location" button.
 */
function setupCurrentLocationButton() {
  const button = document.getElementById("use-current-location-btn");
  if (!button) return;

  button.addEventListener("click", setUserPinToCurrentLocation);
}

/**
 * Changes the user's position to their current geo coordinates.
 *
 * Gets geo coordinates using the MapBox API.
 */
async function setUserPinToCurrentLocation() {
  const currentLocation = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve([pos.coords.longitude, pos.coords.latitude]);
      },
      reject,
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60000,
      },
    );
  });

  userLocation = currentLocation;

  if (userMarker) {
    userMarker.setLngLat(userLocation);
  } else {
    userMarker = createUserMarker(userLocation);
  }

  map.flyTo({
    center: userLocation,
    zoom: 15,
  });

  const settings = JSON.parse(localStorage.getItem("userSettings")) || {};
  settings.location = userLocation;
  localStorage.setItem("userSettings", JSON.stringify(settings));

  await loadLocations();
  updateMapMask(radius);
}

/**
 * Sets up the dropdown menu for selecting regions.
 *
 * When a region is selected, the user's location
 * is set to the center of that region.
 */
function setupRegionSelect() {
  if (!regionSelect) return;

  regionSelect.addEventListener("change", () => {
    const value = regionSelect.value;
    if (!value || !CENTER_OF_REGION[value]) return;

    const center = CENTER_OF_REGION[value];
    userLocation = center;

    if (userMarker) {
      userMarker.setLngLat(userLocation);
    } else {
      userMarker = createUserMarker(userLocation);
    }

    map.flyTo({
      center: userLocation,
      zoom: 13,
    });

    const settings = JSON.parse(localStorage.getItem("userSettings")) || {};
    settings.location = userLocation;
    localStorage.setItem("userSettings", JSON.stringify(settings));

    loadLocations();
    updateMapMask(radius);
  });
}
