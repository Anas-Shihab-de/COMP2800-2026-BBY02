/**
 * TODO:
 * See all Location
 * Clipboard
 * distance
 */

//global variables
const urlParams = new URLSearchParams(window.location.search);
const locationId = urlParams.get("locationId");
let userEmail = "";
let updatedSavedList = [];
let isSaved = false;

// Check if authenticated
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  } else {
    userEmail = auth.email;
    await loadLocation();
  }
}
checkAuth();

/**
 * Source - https://stackoverflow.com/a/901144
 * Posted by Artem Barger, modified by community. See post 'Timeline' for change history
 * Retrieved 2026-05-13, License - CC BY-SA 4.0
 */

/**
 * Loads in locations from the database.
 */
async function loadLocation() {
  const res = await fetch("/api/locations");
  const locations = await res.json();
  const location = await locations.filter((loc) => loc._id === locationId);

  if (!location) {
    window.location.href = "../html/404.html";
    return;
  }

  // draw the page first
  await renderPage(location[0]);

  // upate the bookmark status whether it is saved or not
  await updateBookmark();
}

/**
 * Loads saved_list in users from the database (helper method)
 * @param userEmail the email to find the logged in user's saved location
 */
async function loadUserSavedList() {
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
 * Check if this location is saved using user's saved_list
 * @param {*} userEmail to get user's saved_list
 */
async function updateBookmark() {
  const userSavedList = await loadUserSavedList(userEmail);
  isSaved = userSavedList.includes(locationId);

  // copy the user save list
  updatedSavedList = userSavedList;

  const saveBtn = document.querySelector(".card__save-btn");
  const bookmarkIcon = saveBtn.querySelector(".bookmark");

  // change UI based on status
  if (isSaved) {
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark-unsave");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark");
  } else {
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark-unsave");
  }
}

/**
 *
 * @param {*} locations
 */
function renderPage(location) {
  const page = document.getElementById("mainPage");
  page.insertAdjacentHTML(
    "beforeend",
    `
        <section class="header">
            <img src="${location.images[0]}" />

            <div class="headerButtons">
            <button class="backIcon"><img src="../img/BackIcon.png" /></button>

            <button type="button" class="card__save-btn">
            <span
                class="bookmark material-symbols-outlined material-symbols-outlined-bookmark "
            >
                bookmark
            </span>
            </button>
            </div>
        </section>

        <div class="backdrop"></div>

        <section class="detailsBox">
            <div class="headingSection">
            <div class="headingBlock">
                <h1 class="locationName">${location.name}</h1>
                <p class="location">Pitt Meadows, BC</p>
                <div class="relativePrice">$$</div>
            </div>
            </div>

            <div class="addressNumberSection">
            <div class="addressBlock">
                <span class="addressLine">${location.address}</span>
            </div>

            <div class="phoneBlock">(604) 521-4242</div>
            </div>

            <div class="scheduleDistanceSection">
            <div class="scheduleBlock">
                <div class="dateAndTimeIcon">
                <img src="../img/DateTimeIcon.png" />
                </div>

                <div class="dateAndTime">
                <span>Saturday</span>
                <span>12:30–2:00 p.m.</span>
                </div>
            </div>

            <div class="distanceBlock">
                <img src="../img/DistanceIconWhite.png" />
                <span class="distance">5 km</span>
            </div>
            </div>

            <section class="importantSection">
            <div class="importantHeading">Important Information</div>
            <ul class="importantList">
                ${location.notes
                  .map((note) => {
                    return "<li>" + note + "</li>";
                  })
                  .join("")}
            </ul>
            </section>

            <div class="redirectInfo">
            <a href="#" class="redirectLink">
                <img src="../img/RedirectIcon.png" />
                <span>See more on the website</span>
            </a>
            </div>
        </section>
     
    `,
  );

  // back button
  const backBtn = document.querySelector(".backIcon");
  backBtn.addEventListener("click", () => {
    window.history.back();
  });

  // bookmark button to save/unsave location
  const saveBtn = document.querySelector(".card__save-btn");
  saveBtn.addEventListener("click", () => {
    toggleSaveBtn(locationId);
    console.log("bookmark button clicked");
  });
}

/**
 * Changes bookmark icon as the user clicked and updates user's saved_list.
 * @pararm savedLocationsId the id of each card that needs to be updated.
 */
async function toggleSaveBtn(locationId) {
  const saveBtn = document.querySelector(".card__save-btn");
  const bookmarkIcon = saveBtn.querySelector(".bookmark");
  let savedIcon = bookmarkIcon.classList.contains(
    "material-symbols-outlined-bookmark",
  );

  if (savedIcon) {
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark-unsave");
    unsavePlace(locationId);
    isSaved = false;
  } else {
    // to save the place again before leaving the page
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark-unsave");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark");
    savePlace(locationId);
    isSaved = true;
  }
}

/**
 *
 * Removes a savedlocation ID to the user's saved_list in the database. (helper method)
 * @param locationId the id of each card that needs to be updated.
 */
async function unsavePlace(locationId) {
  const response = await fetch("/api/unsave-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ savedLocationId: locationId }),
  });

  if (response.ok) {
    console.log(`unsaved location: ${locationId}`);
  }
}

/**
 * Adds a savedlocation ID to the user's saved_list in the database. (helper method)
 * @param locationId the id of each card that needs to be updated.
 */
async function savePlace(locationId) {
  const response = await fetch("/api/save-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ savedLocationId: locationId }),
  });

  if (response.ok) {
    console.log(`saved location: ${locationId}`);
  }
}
