/**
 * TODO:
 * Update CSS so that all the page has the same header and the card section, bg
 */

// Global variables
// for tags logic
let initialSavedLocations = [];
let selectedTags = [];
//for distance logic
let userLocation = null;
let currentSort = "distance"; //default

// Check if authenticated
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  } else {
    // send the login user's email to load their saved locations.
    await loadSavedLocations(auth.email);
  }
}
checkAuth();

/**
 * Loads saved location only from the logged in user.
 * Load all locations and filter them to have only the same ids in the userSavedList.
 *
 * -- updated logic:
 * -- To  get filtered by category (food pantries, farmers' market, local market) as well before rendering cards.
 * -- If "saved_places button" is clicked from Home.html, this updated logic wouldn't be applied.
 * @param userEmail the email to find the logged in user's saved location
 *
 * Reference: COMP1800_202530_BBY21 project
 * https://github.com/RuleOfSix/1800_202530_BBY21
 * https://medium.com/@louistrinh/get-url-parameters-in-javascript-efd99c5ddcaf
 * https://frontendinterviewquestions.medium.com/remove-double-quotes-from-string-in-javascript-3262def24f38
 */
async function loadSavedLocations(userEmail) {
  const locations = await loadLocations();
  const userSavedList = await loadUserSavedList(userEmail);

  // 1. filter by user
  let savedLocations = locations.filter((location) =>
    userSavedList.includes(location._id),
  );

  // 2. filter by category (optional)
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

  // 3. copy filtered savedlocations for tags logic
  initialSavedLocations = savedLocations;

  // get userLocation to calculate distance
  userLocation = await getUserLocation();

  // draw the page
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
 * @param userEmail the email to find the logged in user's saved location
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
 * @param savedLocations locations that filtered by user saved list.
 *        User saved list contains array of ids that user saved.
 */
function renderCards(savedLocations) {
  const grid = document.getElementById("section__saved-page");
  grid.innerHTML = "";

  if (savedLocations.length == 0) {
    return;
  }
  for (let i = 0; i < savedLocations.length; i++) {
    const savedLocationId = savedLocations[i]._id;
    const imagePath = savedLocations[i].images[0];

    // calcualte distance based on the location's coordinate
    let distance = "N/A";
    if (userLocation && savedLocations[i].geo?.coordinates) {
      distance =
        getDistanceKm(userLocation, savedLocations[i].geo.coordinates) + " km";
    }

    grid.insertAdjacentHTML(
      "beforeend",
      `<article class="card" data-id="${savedLocationId}">
        <div class="card__image-container">

            <img
            src="${imagePath}"
            alt="Queensborough Coummnity Centre"
            />
            <button type="button" class="card__save-btn">
            <span
                class="material-symbols-outlined material-symbols-outlined-bookmark"
            >
                bookmark
            </span>
            </button>
        </div>
        <div class="card__text-container">
            <h3 class="card__title">${savedLocations[i].name}</h3>
            <div class="card-meta">
            <span class="meta-distance">${distance}</span>
            <span class="meta-price">$$</span>
          </div>
          <div class="card-tags">
            ${savedLocations[i].tags
              .map((tag) => {
                return '<span class="tag">' + tag + "</span>";
              })
              .join("")}
          </div>
        </div>
    </article>
    `,
    );

    // card to go to detailed page
    const lastCard = grid.lastElementChild;
    lastCard.addEventListener("click", (event) => {
      // to prevent going to details page when bookmark icon is clicked
      if (event.target.closest(".card__save-btn")) {
        return;
      }

      location.href = `Details.html?locationId=${savedLocationId}`;
    });

    // bookmark button to save/unsave location
    const saveBtn = lastCard.querySelector(".card__save-btn");
    const bookmarkIcon = saveBtn.querySelector(
      ".material-symbols-outlined-bookmark",
    );

    saveBtn.addEventListener("click", () => {
      toggleSaveBtn(savedLocations[i]._id, bookmarkIcon);
    });
  }
}

/**
 * Changes bookmark icon as the user clicked and updates user's saved_list.
 * @pararm savedLocationsId the id of each card that needs to be updated.
 * @param bookmarkIcon the icon in the save button that the user clicked.
 */
async function toggleSaveBtn(savedLocationId, bookmarkIcon) {
  const savedIcon = bookmarkIcon.classList.contains(
    "material-symbols-outlined-bookmark",
  );

  if (savedIcon) {
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark-unsave");
    unsavePlace(savedLocationId);
  } else {
    // to save the place again before leaving the page
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark-unsave");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark");
    savePlace(savedLocationId);
  }
}

/**
 * Example: postJson(data)
 * https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 *
 * Removes a savedlocation ID to the user's saved_list in the database. (helper method)
 * @param savedLocationId the id of each card that needs to be updated.
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
 * @param savedLocationId the id of each card that needs to be updated.
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

// explore all button
const exploreBtn = document.querySelector(".header__btn");
exploreBtn.addEventListener("click", () => {
  location.href = "Home.html";
});

// back button
const backBtn = document.querySelector(".header__back-btn");
backBtn.addEventListener("click", () => {
  window.history.back();
});

/**
 * ========================================================
 * Filter button logic based from See_All_Locations.js
 * Filters item from the user's saved_list (intialSavedList) not from the whole list.
 * ========================================================
 */

// filter button
document.getElementById("filter-btn").addEventListener("click", openFilters);
document
  .getElementById("filter-overlay")
  .addEventListener("click", closeFilters);

/**
 * Opens the filter panel overlay
 */
function openFilters() {
  const panel = document.getElementById("filter-panel");
  const overlay = document.getElementById("filter-overlay");

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
  document.getElementById("filter-panel").classList.add("hidden");
  document.getElementById("filter-overlay").classList.add("hidden");
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
 * Filters by the exact tags that the use chooses and re-renders the
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
  const filterTags = document.querySelectorAll(".filter-tag");
  for (let i = 0; i < filterTags.length; i++) {
    filterTags[i].classList.remove("active");
  }
  renderCards(initialSavedLocations);
  closeFilters();
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

/**
 * Sorts locations by the current sort setting.
 * sortLocations code from See_All_Locations.js
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
