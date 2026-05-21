/**
 * CREDITS
 *
 * Min: Wrote 90% of the code
 * Damon: Page authentication logic
 * Danielle: Wrote helper function for distance between coordinates and the filter panel logic
 * Sofia: Refactored Min's comments, fixed geolocation logic to pull from db,
 *        made minor changes to pull $$, phone #, and backdrop image from db
 */

/**
 * Verifies authentication prior to accessing the Saved Page
 */
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  } else {
    // Sends the login user's email to load their saved locations.
    await loadSavedLocations(auth.email);
  }
}
checkAuth();

// User's inital saved places before filtering
let initialSavedLocations = [];

// User's chosen tags for filtering
let selectedTags = [];

// User's chosen location
let userLocation = null;

// Current method used to sort (default)
let currentSort = "distance";

/**
 * Loads saved locations only from the logged in user.
 * If the user accesses this page from Home, then display all categories of the saved places.
 * If the user accesses this page from See all Locations, then display certain cegory of the saved places.
 *
 * @param {*} userEmail the email to find the logged in user's saved location
 *
 * Reference: COMP1800_202530_BBY21 project
 * https://github.com/RuleOfSix/1800_202530_BBY21
 * https://medium.com/@louistrinh/get-url-parameters-in-javascript-efd99c5ddcaf
 * https://frontendinterviewquestions.medium.com/remove-double-quotes-from-string-in-javascript-3262def24f38
 */
async function loadSavedLocations(userEmail) {
  const locations = await loadLocations();
  const userSavedList = await loadUserSavedList(userEmail);
  const authRes = await fetch("/api/authentication", {
    credentials: "include",
  });
  const auth = await authRes.json();

  // 1. Finds user's saved places from all locations
  let savedLocations = locations.filter((location) =>
    userSavedList.includes(location._id),
  );

  // 2. (Optional) Displays only certain category of the saved places.
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const category = urlParams.get("category");

  if (category) {
    const trimmedCategory = category.replace(/"/g, "").trim().toLowerCase();
    savedLocations = savedLocations.filter((location) => {
      if (location.tags && location.tags[0]) {
        return location.tags[0].trim().toLowerCase() === trimmedCategory;
      }
      return false;
    });
  }

  // Copies this savedlocations for tags filtering logic as initial saved places
  initialSavedLocations = savedLocations;

  // Gets userLocation to calculate distance
  userLocation = auth.selectedlocation ?? [-123.0016, 49.2532];

  // Intentionally skipped sorting by distance to preserve user's saved order
  renderCards(savedLocations);
  loadFilterTags();
}

/**
 * Loads in locations from the database. (helper method)
 */
async function loadLocations() {
  const res = await fetch("/api/locations");
  return await res.json();
}

/**
 * Loads saved_list in users from the database (helper method)
 *
 * @param {*} userEmail the email to find the logged in user's saved location
 */
async function loadUserSavedList(userEmail) {
  const res = await fetch("/api/users");
  const users = await res.json();
  const loggedinUser = users.find((user) => user.email === userEmail);

  if (loggedinUser && loggedinUser.saved_list) {
    return loggedinUser.saved_list;
  } else {
    return [];
  }
}

/**
 * Renders saved location cards to the page.
 *
 * @param {*} savedLocations User saved locations and optionally filtered by its category.
 */
function renderCards(savedLocations) {
  const grid = document.getElementById("section__saved-page");

  // Clears the page
  grid.innerHTML = "";

  // Exits early if there are no saved places to render
  if (savedLocations.length == 0) {
    return;
  }

  for (let i = 0; i < savedLocations.length; i++) {
    const savedLocationId = savedLocations[i]._id;
    const imagePath = savedLocations[i].images[0];

    // Calculates the distance, defaults to 0
    let distance = "0";
    if (userLocation && savedLocations[i].geo?.coordinates) {
      distance =
        getDistanceKm(userLocation, savedLocations[i].geo.coordinates) + " km";
    }

    grid.insertAdjacentHTML(
      "beforeend",
      `<article class="locationBox" data-id="${savedLocationId}">

        <button type="button" class="bookmarkButton card__save-btn">
          <span class="material-symbols-outlined material-symbols-outlined-bookmark">
           bookmark
          </span>
        </button>

        <a href="Details.html?locationId=${savedLocationId}">
    
      <div class="locationImage">
          <img src="${imagePath}" alt="${savedLocations[i].name}" />
      </div>

      <div class="hubInfo">
        <h3 class="locationName">${savedLocations[i].name}</h3>
        
        <div class="locationDetails">
          <div class="distanceInfo">
            <span class="locationIcon">
              <img src="../img/locationIcon.png" alt="icon" />
            </span>
            <span class="locationDistanceKm">${distance}</span>
          </div>
          <span class="relativePrice">${savedLocations[i].relativePrice}</span>
       </div>

      <div class="tagRow">
        ${savedLocations[i].tags
          .map((tag) => `<span class="tag">${tag}</span>`)
          .join("")}
      </div>
    </div>

    </a>
    </article>
    `,
    );

    // Gets the card to go to detailed page
    const lastCard = grid.lastElementChild;
    lastCard.addEventListener("click", (event) => {
      // Prevents going to detailed page when bookmark icon is clicked
      if (event.target.closest(".card__save-btn")) {
        return;
      }
      location.href = `Details.html?locationId=${savedLocationId}`;
    });

    // Gets save button to bookmark the location
    const saveBtn = lastCard.querySelector(".card__save-btn");
    const bookmarkIcon = saveBtn.querySelector(
      ".material-symbols-outlined-bookmark",
    );

    // Makes button clickable
    saveBtn.addEventListener("click", () => {
      toggleSaveBtn(savedLocations[i]._id, bookmarkIcon);
    });
  }
}

/**
 * Changes bookmark icon as the user clicked and updates user's saved_list.
 *
 * @param {*} savedLocationsId the id of each card that needs to be updated.
 * @param {*} bookmarkIcon the icon in the save button that the user clicked.
 */
async function toggleSaveBtn(savedLocationId, bookmarkIcon) {
  const savedIcon = bookmarkIcon.classList.contains(
    "material-symbols-outlined-bookmark",
  );

  // If the location is already saved, then makes the location unsaved.
  if (savedIcon) {
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark-unsave");
    unsavePlace(savedLocationId);
  } else {
    // Saves the location again before the user leaves the page.
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark-unsave");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark");
    savePlace(savedLocationId);
  }
}

/**
 * Removes a savedlocation ID to the user's saved_list in the database. (helper method)
 *
 * @param {*} savedLocationId the id of each card that needs to be updated.
 *
 * Example: postJson(data)
 * https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 */
async function unsavePlace(savedLocationId) {
  const response = await fetch("/api/unsave-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ savedLocationId: savedLocationId }),
  });

  if (response.ok) {
    console.log(`unsaved location: ${savedLocationId}`);
  }
}

/**
 * Adds a savedlocation ID to the user's saved_list in the database. (helper method)
 *
 * @param {*} savedLocationId the id of each card that needs to be updated.
 */
async function savePlace(savedLocationId) {
  const response = await fetch("/api/save-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ savedLocationId: savedLocationId }),
  });

  if (response.ok) {
    console.log(`saved location: ${savedLocationId}`);
  }
}

// Makes explore button clickable: moves to Home.html when it is clicked.
const exploreBtn = document.querySelector(".header__btn");
exploreBtn.addEventListener("click", () => {
  location.href = "Home.html";
});

// Makes back button clickable: moves to the previous page when it is clicked.
const backBtn = document.querySelector(".header__back-btn");
backBtn.addEventListener("click", () => {
  window.history.back();
});

/**
 * Filters the locations from the user's saved_list (intialSavedList) not from the whole list.
 * Filter logic is based from See_All_Locations.js and modified to saved page logic
 */

// Filter event listners
document.getElementById("filter-btn").addEventListener("click", openFilters);
document
  .getElementById("filterPanelBg")
  .addEventListener("click", closeFilters);

/**
 * Opens the filter panel overlay
 */
function openFilters() {
  const panel = document.getElementById("filterPanel");
  const overlay = document.getElementById("filterPanelBg");

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
  for (let i = 0; i < initialSavedLocations.length; i++) {
    for (let j = 0; j < initialSavedLocations[i].tags.length; j++) {
      if (!allTags.includes(initialSavedLocations[i].tags[j])) {
        allTags.push(initialSavedLocations[i].tags[j]);
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
  for (let i = 0; i < initialSavedLocations.length; i++) {
    let matchesAll = true;
    for (let j = 0; j < selectedTags.length; j++) {
      if (!initialSavedLocations[i].tags.includes(selectedTags[j])) {
        matchesAll = false;
        break;
      }
    }
    if (matchesAll) {
      filtered.push(initialSavedLocations[i]);
    }
  }
  currentSort = document.getElementById("sort-select").value;
  renderCards(sortLocations(filtered));
  closeFilters();
}

/**
 * Clears all tags selected.
 */
function clearFilters() {
  selectedTags = [];
  currentSort = "distance";

  document.getElementById("sort-select").value = "distance";

  const filterTags = document.querySelectorAll(".filter-tag");
  for (let i = 0; i < filterTags.length; i++) {
    filterTags[i].classList.remove("active");
  }
  renderCards(initialSavedLocations);
  closeFilters();
}

/**
 * Calculates the distance in kilometers between two coordinates.
 * Uses the Haversine formula.
 *
 * getDistanceKm code is from See_All_Locations.js
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

/**
 * Sorts locations by the current sort setting.
 *
 * sortLocations code is from See_All_Locations.js
 *
 * @param {*} locations the list of locations to sort
 *
 * @returns sorted list of locations
 */

function sortLocations(initialSavedLocations) {
  const sorted = [];
  for (let i = 0; i < initialSavedLocations.length; i++) {
    sorted.push(initialSavedLocations[i]);
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
