// Check if authenticated
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  }
}
checkAuth();
let userLocation = null;
const rowCategories = [
  {
    id: "pantriesRow",
    category: "Food Pantry",
  },
  {
    id: "farmersMarketsRow",
    category: "Farmers Market",
  },
  {
    id: "localFoodMarketsRow",
    category: "Local Market",
  },
];

/**
 * Loads in locations from the database.
 */
async function loadLocations() {
  const res = await fetch("/api/locations");
  const locations = await res.json();
  console.log(locations); // Use _id as search params for now

  userLocation = await getUserLocation();
  await renderCards(locations);
}
loadLocations();

/**
 *
 * @param {*} locations
 */
function renderCards(allLocations) {
  for (let i = 0; i < rowCategories.length; i++) {
    let row = document.getElementById(rowCategories[i].id);
    let locations = allLocations.filter(
      (location) => location.tags[0] === rowCategories[i].category,
    );

    let distance = "N/A";
    if (userLocation && locations[i].geo?.coordinates) {
      distance =
        getDistanceKm(userLocation, locations[i].geo.coordinates) + " km";
    }
    for (let i = 0; i < locations.length; i++) {
      row.insertAdjacentHTML(
        "beforeend",
        `
            <article class="locationBox">
                <a href="Details.html?locationId=${locations[i]._id}">
                    <div class="locationImage">
                    <img src="${locations[i].images[0]}" />
                    <span class="imageTag">Seasonal</span>
                    </div>

                <div class="hubInfo">
                <h3 class="locationName">${locations[i].name}</h3>

                <div class="locationDetails">
                    <div class="distanceInfo">
                    <span class="locationIcon"
                        ><img src="../img/locationIcon.png"
                    /></span>
                    <span class="locationDistanceKm">${distance}</span>
                    </div>
                    <span class="relativePrice">$$</span>
                </div>

                <div class="tagRow">
                    ${locations[i].tags
                      .map((tag) => {
                        return '<span class="tag">' + tag + "</span>";
                      })
                      .join("")}
                </div>
                </div>
                </a>
            </article>
            `,
      );
    }
  }

  addHeaderButtonsListener();
  addSeeAllButtonsListener();
}

/**
 * adds button listeners in the header section.
 */
function addHeaderButtonsListener() {
  // 1. Saved Locations
  const savedLocBtn = document.getElementById("savedLocationsButton");
  savedLocBtn.addEventListener("click", () => {
    window.location.href = `/html/saved_page.html`;
  });
}

/**
 * adds button listeners to go to See_All_Locations.html with category
 */
function addSeeAllButtonsListener() {
  //1. Food Pantry
  const seeAllPantries = document.getElementById("seeAllPantries");
  seeAllPantries.addEventListener("click", () => {
    const category = "Food Pantry";
    window.location.href = `/html/See_All_Locations.html?category=${category}`;
  });

  //2. Farmers Market
  const seeAllFarmers = document.getElementById("seeAllFarmers");
  seeAllFarmers.addEventListener("click", () => {
    const category = "Farmers Market";
    window.location.href = `/html/See_All_Locations.html?category=${category}`;
  });

  //3. Local Market
  const seeAllLocals = document.getElementById("seeAllLocals");
  seeAllLocals.addEventListener("click", () => {
    const category = "Local Market";
    window.location.href = `/html/See_All_Locations.html?category=${category}`;
  });
}

/**
 * Gets the user's current coordinates using the browser's geolocation API.
 * getUserLocation  from See_All_Locations.js
 *
 * @returns the user's longitude and latitude
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
 * Calculates the distance in kilometers between two coordinates.
 * getDistanceKm code from See_All_Locations.js
 *
 * @param {*} a longitude and latitude of point a
 * @param {*} b longitude and latitude of point b
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

  return Math.round(R * (2 * Math.asin(Math.sqrt(x))) * 10) / 10;
}
