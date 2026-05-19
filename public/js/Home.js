/**
 * Checks that the user is authenticated prior to
 * accessing the Home page.
 */
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  }
}
checkAuth();

// Stores the user's location from the db
let userLocation = null;

// Categories for grouping locations into rows
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
 *
 * Loads the user's radius and location chosen on the Map page.
 */
async function loadLocations() {
  const res = await fetch("/api/locations");
  const locations = await res.json();

  const response = await fetch("/api/authentication");
  const auth = await response.json();

  // Uses saved location or default long./lat.
  userLocation = auth.selectedlocation ?? [-123.0016, 49.2532];

  // Uses saved radius or defaults to a 5km radius
  radius = auth.selectedradius ?? 5;

  await renderCards(locations);
}

loadLocations();

/**
 * Applies the situation (dropdown) filters to all locations.
 */
function applySituationFilters(locations) {
  return locations.filter((loc) => {
    // Grabs all hidden tags
    const tags = loc.hiddenTags || [];

    if (situationFilters.noId) {
      const requiresId = tags.includes("id-required");
      if (requiresId) {
        return false;
      }
    }

    if (situationFilters.wheelchair) {
      const hasWheelchairAccess = tags.includes("wheelchair");
      if (!hasWheelchairAccess) {
        return false;
      }
    }

    if (situationFilters.cultural) {
      const isCulturallyDiverse = tags.includes("culturally diverse");
      if (!isCulturallyDiverse) {
        return false;
      }
    }

    if (situationFilters.walking) {
      const tooFarToWalk = loc.distance > 1.5;
      if (tooFarToWalk) {
        return false;
      }
    }
    if (situationFilters.openNow) {
      const currentlyOpen = isOpenNow(loc.hours);
      if (!currentlyOpen) {
        return false;
      }
    }

    // Keeps the location if none of the earlier filters removed it
    return true;
  });
}

/**
 * Renders the locations into the right category row.
 *
 * @param {*} locations
 */
function renderCards(allLocations) {
  for (const rowCategory of rowCategories) {
    const row = document.getElementById(rowCategory.id);
    row.innerHTML = "";

    // Filters locations by category
    const locations = allLocations.filter((loc) =>
      loc.tags.includes(rowCategory.category),
    );

    // Calculates distance for each location
    const locationsWithDistance = locations.map((location) => {
      let distanceToUser = 0;

      /* 
        Only calculates distance if:
         We know the users location.
         The location has valid coordinates.
      */
      if (userLocation && location.geo && location.geo.coordinates) {
        distanceToUser = getDistanceKm(userLocation, location.geo.coordinates);
      }

      const locationWithDistance = {
        _id: location._id,
        name: location.name,
        tags: location.tags,
        geo: location.geo,
        featuredTag: location.featuredTag,
        hiddenTags: location.hiddenTags,
        hours: location.hours,
        images: location.images,
        relativePrice: location.relativePrice,
        distance: distanceToUser,
      };

      return locationWithDistance;
    });

    const filteredLocations = applySituationFilters(locationsWithDistance);

    // Sorts by nearest (by default)
    filteredLocations.sort((locationA, locationB) => {
      return locationA.distance - locationB.distance;
    });

    let locationsToDisplay;
    if (showAll) {
      // Shows all locations
      locationsToDisplay = filteredLocations;
    } else {
      // Otherwise, only shows locations within radius
      locationsToDisplay = filteredLocations.filter((location) => {
        return location.distance <= radius;
      });
    }

    // If locations exist within the user's radius, show them all
    if (locationsToDisplay.length > 0) {
      for (const location of locationsToDisplay) {
        const distanceText = location.distance.toFixed(1) + " km";

        insertLocationCard(row, location, distanceText, location.featuredTag);
      }
    }
    // If no locations within radius exist, show the closest one
    else if (filteredLocations.length > 0) {
      const closestLocation = filteredLocations[0];
      const distanceText = closestLocation.distance.toFixed(1) + " km";

      insertLocationCard(
        row,
        closestLocation,
        distanceText,
        closestLocation.featuredTag,
      );
    }
  }
  addHeaderButtonsListener();
  addSeeAllButtonsListener();
}
/**
 * Inserts a single location into a row.
 */
function insertLocationCard(row, location, distanceText, badgeText) {
  row.insertAdjacentHTML(
    "beforeend",
    `
      <article class="locationBox">
        <a href="Details.html?locationId=${location._id}">
          <div class="locationImage">
            <img src="${location.images[0]}" />
            <span class="imageTag">${badgeText}</span>
          </div>

          <div class="hubInfo">
            <h3 class="locationName">${location.name}</h3>

            <div class="locationDetails">
              <div class="distanceInfo">
                <span class="locationIcon">
                  <img src="../img/locationIcon.png" />
                </span>
                <span class="locationDistanceKm">${distanceText}</span>
              </div>
              <span class="relativePrice">${location.relativePrice}</span>
            </div>

            <div class="tagRow">
              ${location.tags
                .map((tag) => `<span class="tag">${tag}</span>`)
                .join("")}
            </div>
          </div>
        </a>
      </article>
    `,
  );
}

/**
 * Adds event listeners to the header buttons.
 */
function addHeaderButtonsListener() {
  // 1. Saved Locations
  const savedLocBtn = document.getElementById("savedLocationsButton");
  savedLocBtn.addEventListener("click", () => {
    window.location.href = `/html/saved_page.html`;
  });
}

/**
 * Adds event listeners for the See All buttons in each category.
 */
function addSeeAllButtonsListener() {
  // 1. Food Pantry
  const seeAllPantries = document.getElementById("seeAllPantries");
  seeAllPantries.addEventListener("click", () => {
    const category = "Food Pantry";
    window.location.href = `/html/See_All_Locations.html?category=${category}`;
  });

  // 2. Farmers Market
  const seeAllFarmers = document.getElementById("seeAllFarmers");
  seeAllFarmers.addEventListener("click", () => {
    const category = "Farmers Market";
    window.location.href = `/html/See_All_Locations.html?category=${category}`;
  });

  // 3. Local Market
  const seeAllLocals = document.getElementById("seeAllLocals");
  seeAllLocals.addEventListener("click", () => {
    const category = "Local Market";
    window.location.href = `/html/See_All_Locations.html?category=${category}`;
  });
}

/**
 * Calculates the distance in kilometers between two coordinates.
 *
 * Uses the Haversine formula.
 *
 * @param {*} a longitude, latitude of point a
 * @param {*} b longitude, latitude of point b
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

// Initial state
let situationFilters = {
  noId: false,
  wheelchair: false,
  walking: false,
  cultural: false,
  openNow: false,
};

document.getElementById("mySituationButton").addEventListener("click", () => {
  document.querySelector(".situationDropdown").classList.toggle("open");
});

const checkboxList = [
  { id: "filterNoId", filterkey: "noId" },
  { id: "filterWheelchair", filterkey: "wheelchair" },
  { id: "filterWalking", filterkey: "walking" },
  { id: "filterCultural", filterkey: "cultural" },
  { id: "filterOpenNow", filterkey: "openNow" },
];

for (const item of checkboxList) {
  const checkbox = document.getElementById(item.id);

  // Listens for checkbox clicks
  checkbox.addEventListener("change", (event) => {
    // Updates the filters in use
    situationFilters[item.filterkey] = event.target.checked;

    // Re-renders locations
    loadLocations();
  });
}

/**
 * Determines if a location is open based on its daily hours.
 */
function isOpenNow(hours) {
  const now = new Date();
  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const today = weekdays[now.getDay()];

  const todaysHours = hours[today];
  if (!todaysHours) {
    return false;
  }

  const currentTime = now.getHours() + now.getMinutes() / 60;

  // Checks if location is open at any period of today
  for (const period of todaysHours) {
    const openingTimeString = period.open;
    const closingTimeString = period.close;
    const openingTime = parseFloat(openingTimeString.replace(":", "."));
    const closingTime = parseFloat(closingTimeString.replace(":", "."));

    // If current time is between open and closed, then location is open
    const isWithinOpenHours =
      currentTime >= openingTime && currentTime <= closingTime;

    if (isWithinOpenHours) {
      return true;
    }
  }
  // Otherwise, closed
  return false;
}

document.getElementById("settingsButton").addEventListener("click", () => {
  window.location.href = "/html/Settings2.html";
});

// Switches between showing all locations or only those within radius
let showAll = false;
document.getElementById("showAllButton").addEventListener("click", () => {
  showAll = !showAll;

  document.getElementById("showAllButton").textContent = showAll
    ? "Show Nearby"
    : "Show All";

  loadLocations();
});
