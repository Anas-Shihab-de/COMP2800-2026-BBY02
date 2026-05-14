/*
 * YOUCHHH gonna remove this comment later but whoever is reading this
 * So far the functions work as intended...or how I intend anyways LOL JSDoc commenting hell ahahah.
 * Might need to refactor code again, at least just for the calculating distance part since the card only shows
 * "X km" as a placeholder :( otherwise I think that's about it. Anyways please let me know if I need to change anything !!
 */

/**
 * Check if authenticated
 *
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
 * The catagories that we currently have :thumbsup:
 * If there are any other catagories to add here lemme know otherwise
 * we can add/remove/change catagories :p
 */
const CATEGORIES = {
  pantries: { title: "Community Food Pantries" },
  farmers: { title: "BC Farmers Markets" },
  markets: { title: "Local Food Markets" },
};

const params = new URLSearchParams(window.location.search);
const category = params.get("category");

// Global variables
let allLocations = [];
let userSavedList = [];
let selectedTags = [];

/*
 * Display catagory title.
 * If there isn't a catagory title, then set it to the default name.
 */
if (CATEGORIES[category]) {
  document.getElementById("page-title").textContent =
    CATEGORIES[category].title;
} else {
  document.getElementById("page-title").textContent = "Food Locations";
}

// Event listeners when a certain button is clicked
document
  .getElementById("back-btn")
  .addEventListener("click", () => history.back());
document.getElementById("filter-btn").addEventListener("click", openFilters);
document.getElementById("saved-btn").addEventListener("click", openSaved);
document
  .getElementById("filter-overlay")
  .addEventListener("click", closeFilters);

/**
 * Loads in locations from the database and renders the cards afterwards.
 */
async function loadLocations() {
  const locRes = await fetch("/api/locations");
  allLocations = await locRes.json();

  const authRes = await fetch("/api/authentication");
  const auth = await authRes.json();
  const usersRes = await fetch("/api/users");
  const users = await usersRes.json();
  const loggedInUser = users.find((user) => user.email === auth.email);
  userSavedList = loggedInUser?.saved_list || [];

  renderCards(allLocations);
  loadFilterTags();
}
loadLocations();

/**
 * Renders each location card with its image, name, distance, price, and tags
 *
 * @param {*} locations the list of locations
 */
function renderCards(locations) {
  const grid = document.getElementById("cards-grid");
  grid.innerHTML = "";

  for (let i = 0; i < locations.length; i++) {
    const isSaved = userSavedList.includes(locations[i]._id);
    let fillValue = "'FILL' 0";
    if (isSaved) {
      fillValue = "'FILL' 1";
    }

    grid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card">
        <div class="card-image-wrapper">
          <img src="${locations[i].images?.[0] || ""}" alt="Location name" class="card-image">
          <button class="bookmark-btn" onclick="toggleSave(event, '${locations[i]._id}')">
            <span class="material-symbols-outlined" style="font-variation-settings: ${fillValue}">bookmark_heart</span>
          </button>
        </div>
        <div class="card-body">
          <p class="card-name">${locations[i].name}</p>
          <div class="card-meta">
            <span class="meta-distance">X km</span>
            <span class="meta-price">$$</span>
          </div>
          <div class="card-tags">
            ${locations[i].tags
              .map((tag) => {
                return '<span class="tag">' + tag + "</span>";
              })
              .join("")}
          </div>
        </div>
      </div>
    `,
    );
  }
}

/**
 * Saves or unsaves a location
 *
 * @param {*} event the click event
 * @param {*} locationId the id of the location
 */
async function toggleSave(event, locationId) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const icon = btn.querySelector(".material-symbols-outlined");

  if (userSavedList.includes(locationId)) {
    // Unsaved state
    userSavedList = userSavedList.filter((id) => id !== locationId);
    icon.style.fontVariationSettings = "'FILL' 0";
    await fetch("/api/unsave-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedLocationId: locationId }),
    });
  } else {
    // Saved state
    userSavedList.push(locationId);
    icon.style.fontVariationSettings = "'FILL' 1";
    await fetch("/api/save-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedLocationId: locationId }),
    });
  }
}

/**
 * Redirects user to the details page
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
  const panel = document.getElementById("filter-panel");
  const overlay = document.getElementById("filter-overlay");
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
  document.getElementById("filter-panel").classList.add("hidden");
  document.getElementById("filter-overlay").classList.add("hidden");
}

/**
 * Load all the tags from the database.
 */
function loadFilterTags() {
  const allTags = [];
  for (let i = 0; i < allLocations.length; i++) {
    for (let j = 0; j < allLocations[i].tags.length; j++) {
      if (!allTags.includes(allLocations[i].tags[j])) {
        allTags.push(allLocations[i].tags[j]);
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
  for (let i = 0; i < allLocations.length; i++) {
    let matchesAll = true;
    for (let j = 0; j < selectedTags.length; j++) {
      if (!allLocations[i].tags.includes(selectedTags[j])) {
        matchesAll = false;
        break;
      }
    }
    if (matchesAll) {
      filtered.push(allLocations[i]);
    }
  }
  renderCards(filtered);
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
  renderCards(allLocations);
  closeFilters();
}

/**
 * Redirects to saved page (this is just showing ALL locations atm lol)
 */
function openSaved() {
  // to send url with the current category
  // this logic can be updated after seeall button from Home.html is done
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const category = urlParams.get("category");
  window.location.href = `/html/saved_page.html?category=${category}`;
}
