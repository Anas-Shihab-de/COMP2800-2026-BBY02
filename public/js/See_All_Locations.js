/**
 * CREDITS
 *
 * Min: Changed variable names and modified the logic related to filtered location.
 * Damon: Wrote the authorization code
 * Danielle: Wrote 90% of the code.
 * Sofia: Refactored comments, changed variable names & template code.
 */

/**
 * Verifies authentication prior to accessing the See All page.
 */
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  }
}
checkAuth();

/*
 * Maps each category name to its header on the page.
 */
const CATEGORIES = {
  "Food Pantry": { title: "Community Food Pantries" },
  "Farmers Market": { title: "BC Farmers Markets" },
  "Local Market": { title: "Local Food Markets" },
};

const params = new URLSearchParams(window.location.search);
const category = params.get("category");

let allLocations = [];
let userSavedList = [];

// User's chosen tag filters
let selectedTags = [];
// User's chosen location
let userLocation = null;
// Current method used to sort
let currentSort = "distance";
// List of locations after filtering
let filteredLocations;

/*
 * Sets page title to the category name, or uses a default value.
 */
if (CATEGORIES[category]) {
  document.getElementById("headerText").textContent =
    CATEGORIES[category].title;
} else {
  document.getElementById("headerText").textContent = "Food Locations";
}

// Event listeners
document
  .getElementById("backButton")
  .addEventListener("click", () => history.back());
document.getElementById("filterButton").addEventListener("click", openFilters);
document.getElementById("saveButton").addEventListener("click", openSaved);
document
  .getElementById("filterPanelBg")
  .addEventListener("click", closeFilters);

/**
 * Loads in all locations and user data.
 *
 * Applies category filters, re-renders the locations.
 */
async function loadLocations() {
  const locRes = await fetch("/api/locations");
  allLocations = await locRes.json();

  const authRes = await fetch("/api/authentication", {
    credentials: "include",
  });
  const auth = await authRes.json();

  const usersRes = await fetch("/api/users");
  const users = await usersRes.json();

  // Loads the user's saved_list
  const loggedInUser = users.find((user) => user.email === auth.email);
  userSavedList = loggedInUser?.saved_list || [];
  userLocation = auth.selectedlocation ?? [-123.0016, 49.2532];

  // Copies all locations prior to filtering
  filteredLocations = allLocations;

  const queryText = window.location.search;
  const urlParams = new URLSearchParams(queryText);
  const category = urlParams.get("category");

  if (category) {
    // Formats the URL category to remove quotes and spaces; Standardizes to all lowercase
    const urlCategory = category.replaceAll('"', "").trim().toLowerCase();

    // Only shows locations with a first tag matching the category
    filteredLocations = allLocations.filter((location) => {
      const firstTag = location.tags?.[0];

      if (!firstTag) {
        return false;
      }

      return firstTag.trim().toLowerCase() === urlCategory;
    });
  }

  renderCards(filteredLocations);
  loadFilterTags();
}
loadLocations();

/**
 * Renders each location onto the page.
 *
 * @param {*} locations the list of locations
 */
function renderCards(locations) {
  const grid = document.getElementById("locationsGrid");

  // Clears previous boxes
  grid.innerHTML = "";

  // Checks if the location is saved
  for (let i = 0; i < locations.length; i++) {
    const isSaved = userSavedList.includes(locations[i]._id);
    const badgeText = locations[i].featuredTag || "";

    // Calculates the distance, defaults to 0
    let distance = "0";
    if (userLocation && locations[i].geo?.coordinates) {
      distance =
        getDistanceKm(userLocation, locations[i].geo.coordinates) + " km";
    }

    grid.insertAdjacentHTML(
      "beforeend",
      `
  <article class="locationBox" data-location-id="${locations[i]._id}">
    
    <button 
      class="bookmarkButton" 
      onclick="toggleSave(event, '${locations[i]._id}')"
    >
    <span class="${
      isSaved
        ? "material-symbols-outlined material-symbols-outlined-bookmark"
        : "material-symbols-outlined material-symbols-outlined-bookmark-unsave"
    }">
        bookmark
      </span>
    </button>

    <a href="Details.html?locationId=${locations[i]._id}">
      
      <div class="locationImage">
        <img src="${locations[i].images?.[0] || ""}" alt="${locations[i].name}" />
        <span class="imageTag">${locations[i].featuredTag || ""}</span>
      </div>

      <div class="hubInfo">
        <h3 class="locationName">${locations[i].name}</h3>

        <div class="locationDetails">
          <div class="distanceInfo">
            <span class="locationIcon">
              <img src="../img/locationIcon.png" />
            </span>
            <span class="locationDistanceKm">${distance}</span>
          </div>

          <span class="relativePrice">$$</span>
        </div>

        <div class="tagRow">
          ${locations[i].tags
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}
        </div>
      </div>

    </a>
  </article>
  `,
    );

    // Makes the last box clickable, ignores clicks made on the bookmark icon
    const lastCard = grid.lastElementChild;
    lastCard.addEventListener("click", (event) => {
      if (event.target.closest(".bookmarkButton")) {
        return;
      }
      const locationId = lastCard.getAttribute("data-location-id");
      window.location.href = `Details.html?locationId=${locationId}`;
    });
  }
}

/**
 * Toggles saved/unsaved state for a location.
 *
 * @param {*} event the click event
 * @param {*} locationId the id of the location
 */
async function toggleSave(event, locationId) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const icon =
    btn.querySelector(".material-symbols-outlined-bookmark") ||
    btn.querySelector(".material-symbols-outlined-bookmark-unsave");

  if (userSavedList.includes(locationId)) {
    // Unsaved state
    userSavedList = userSavedList.filter((id) => id !== locationId);
    icon.classList.remove("material-symbols-outlined-bookmark");
    icon.classList.add("material-symbols-outlined-bookmark-unsave");
    await fetch("/api/unsave-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedLocationId: locationId }),
    });
  } else {
    // Saved state
    userSavedList.push(locationId);
    icon.classList.remove("material-symbols-outlined-bookmark-unsave");
    icon.classList.add("material-symbols-outlined-bookmark");
    await fetch("/api/save-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedLocationId: locationId }),
    });
  }
}

/**
 * Redirects user to the details page of the specific location.
 *
 * @param {*} locationId the id of the location
 */
function openLocation(locationId) {
  window.location.href = `../html/details.html?locationId=${locationId}`;
}

/**
 * Opens the filter panel overlay
 */
function openFilters() {
  const panel = document.getElementById("filterPanel");
  const overlay = document.getElementById("filterPanelBg");
  console.log("panel classes:", panel.classList);

  if (panel.classList.contains("hidden")) {
    panel.classList.remove("hidden");
    overlay.classList.remove("hidden");
  } else {
    closeFilters();
  }
}

/**
 * Closes the filter panel overlay
 */
function closeFilters() {
  document.getElementById("filterPanel").classList.add("hidden");
  document.getElementById("filterPanelBg").classList.add("hidden");
}

/**
 * Load all the tags from the database.
 */
function loadFilterTags() {
  const allTags = [];
  for (let i = 0; i < filteredLocations.length; i++) {
    for (let j = 0; j < filteredLocations[i].tags.length; j++) {
      if (!allTags.includes(filteredLocations[i].tags[j])) {
        allTags.push(filteredLocations[i].tags[j]);
      }
    }
  }
  renderFilterTags("filter-tags-container", allTags);
}

/**
 * Renders the filter tags
 *
 * @param {*} containerId the container id
 * @param {*} tags the list of tags
 */
function renderFilterTags(containerId, tags) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  for (let i = 0; i < tags.length; i++) {
    container.insertAdjacentHTML(
      "beforeend",
      `
      <button class="filter-tag" onclick="toggleTag(this, '${tags[i]}')">${tags[i]}</button>
    `,
    );
  }
}

/**
 * Toggles the filter tag as selected/unselected.
 *
 * @param {*} btn the button that was clicked
 * @param {*} tag the filter tag
 */
function toggleTag(btn, tag) {
  let found = false;
  for (let i = 0; i < selectedTags.length; i++) {
    if (selectedTags[i] === tag) {
      found = true;
      break;
    }
  }
  if (found) {
    const newTags = [];
    for (let i = 0; i < selectedTags.length; i++) {
      if (selectedTags[i] !== tag) {
        newTags.push(selectedTags[i]);
      }
    }
    selectedTags = newTags;
    btn.classList.remove("active");
  } else {
    selectedTags.push(tag);
    btn.classList.add("active");
  }
}

/**
 * Filters by the exact tags that the user chooses and re-renders the list.
 */
function applyFilters() {
  const filtered = [];
  for (let i = 0; i < filteredLocations.length; i++) {
    let matchesAll = true;
    for (let j = 0; j < selectedTags.length; j++) {
      if (!filteredLocations[i].tags.includes(selectedTags[j])) {
        matchesAll = false;
        break;
      }
    }
    if (matchesAll) {
      filtered.push(filteredLocations[i]);
    }
  }
  currentSort = document.getElementById("sort-select").value;
  renderCards(sortLocations(filtered));
  closeFilters();
}

/**
 * Clears all tags selected and resets sorting and filters.
 */
function clearFilters() {
  selectedTags = [];
  currentSort = "distance";

  document.getElementById("sort-select").value = "distance";

  const filterTags = document.querySelectorAll(".filter-tag");

  for (let i = 0; i < filterTags.length; i++) {
    filterTags[i].classList.remove("active");
  }
  renderCards(filteredLocations);
  closeFilters();
}

/**
 * Redirects to saved page (this is just showing ALL locations atm lol)
 */
function openSaved() {
  // to send url with the current category
  const queryText = window.location.search;
  const urlParams = new URLSearchParams(queryText);
  const category = urlParams.get("category");
  window.location.href = `/html/saved_page.html?category=${category}`;
}

/**
 * Calculates the distance in kilometers between two coordinates.
 *
 * Uses the Haversine formula.
 *
 * @param {*} a the first point's coordinates in [longitude, latitude]
 * @param {*} b the second point's coordinates in [longitude, latitude]
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

/**
 * Sorts locations by the current sort setting.
 *
 * @param {*} locations the list of locations to sort
 *
 * @returns sorted list of locations
 */
function sortLocations(locations) {
  const sorted = [];
  for (let i = 0; i < locations.length; i++) {
    sorted.push(locations[i]);
  }

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      let shouldSwap = false;

      if (currentSort === "distance") {
        let distanceA = 9999;
        let distanceB = 9999;
        if (userLocation && sorted[i].geo && sorted[i].geo.coordinates) {
          distanceA = getDistanceKm(userLocation, sorted[i].geo.coordinates);
        }
        if (userLocation && sorted[j].geo && sorted[j].geo.coordinates) {
          distanceB = getDistanceKm(userLocation, sorted[j].geo.coordinates);
        }
        if (distanceA > distanceB) {
          shouldSwap = true;
        }
      }

      if (currentSort === "name") {
        const nameA = sorted[i].name.toLowerCase();
        const nameB = sorted[j].name.toLowerCase();
        if (nameA > nameB) {
          shouldSwap = true;
        }
      }

      if (shouldSwap) {
        const temp = sorted[i];
        sorted[i] = sorted[j];
        sorted[j] = temp;
      }
    }
  }

  return sorted;
}
