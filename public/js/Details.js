/**
 * TODO:
 * calculate distance for details and saved_page
 * Update clipboard alert as Modal UI
 * telephone number from DB and $$
 */

//global variables
const urlParams = new URLSearchParams(window.location.search);
const locationId = urlParams.get("locationId");
let userEmail = "";
let updatedSavedList = [];
let isSaved = false;
const areas = [
  "Downtown",
  "Burnaby",
  "Coquitlam",
  "New Westminster",
  "Richimond",
];

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

  // update the bookmark status whether it is saved or not
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
 * https://www.w3schools.com/Jsref/tryit.asp?filename=tryjsref_getday
 * https://www.w3schools.com/howto/howto_js_copy_clipboard.asp
 */
async function renderPage(location) {
  const page = document.getElementById("mainPage");
  const areaName = areas.filter((area) => location.address.includes(area));
  const dayOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // get today's working hours of the location
  const date = new Date();
  const today = dayOfWeek[date.getDay()];
  const workingHour = await findWorkingHours(location.hours, today);
  let workingHourText = "";

  if (workingHour.open != "Closed") {
    workingHourText = `${workingHour.open} – ${workingHour.close}`;
  } else {
    workingHourText = `Closed`;
  }

  // get full working hours of the location
  let fullSchdule = "";
  let timeText = "";

  for (const day in location.hours) {
    let formattedDay = day.charAt(0).toUpperCase() + day.slice(1);
    const hours = location.hours[day];
    if (hours && hours.length > 0) {
      timeText = `${hours[0].open} – ${hours[0].close}`;
    } else {
      timeText = `Closed`;
    }

    fullSchdule += `
    <li>
        <span>${formattedDay}: </span>
        <span>${timeText}</span>
    </li>
    `;
  }

  // calcualte distance based on the location's coordinate

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
                <p class="location">${areaName}, BC</p>
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
                <div class= "dayAndDropdown">
                     <span>${today}</span>
                    <span class="material-symbols-outlined material-symbols-outlined-dropdown">arrow_drop_down</span>
                
                </div>
                <span>${workingHourText}</span>
                </div>
            </div>

            <div class="distanceBlock">
                <img src="../img/DistanceIconWhite.png" />
                <span class="distance">5 km</span>
            </div>
            </div>

            <div class="fullScheduleSection" style="display: none;">
                <ul>
                   ${fullSchdule}
                </ul>
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
            <a href="${location.links[0]}" class="redirectLink">
                <img src="../img/RedirectIcon.png" />
                <span>See more on the website</span>
            </a>
            </div>
        </section>
     
    `,
  );

  addAllButtonListeners(location, locationId);
}

/**
 * Add event listeners for each icons/buttons
 * @param {*} location the object that contains the info
 * @param {*} locationId the location object's db id
 */
function addAllButtonListeners(location, locationId) {
  // 1. back button
  const backBtn = document.querySelector(".backIcon");
  backBtn.addEventListener("click", () => {
    window.history.back();
  });

  // 2. bookmark button to save/unsave location
  const saveBtn = document.querySelector(".card__save-btn");
  saveBtn.addEventListener("click", () => {
    toggleSaveBtn(locationId);
    console.log("bookmark button clicked");
  });

  // 3. clipboard button for address so that user can easily lookk for the place
  const clipboardBtn = document.querySelector(".addressBlock");
  clipboardBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(location.address);
    alert(`Address copied: ${location.address}`);
  });

  // 4. schedule button to see the whole working schedule
  const scheduleBtn = document.querySelector(".scheduleBlock");
  const fullSchedule = document.querySelector(".fullScheduleSection");
  const dropdownIcon = document.querySelector(
    ".material-symbols-outlined-dropdown",
  );

  scheduleBtn.addEventListener("click", (event) => {
    if (event.target.closest(".redirectLink")) {
      return;
    }

    if (fullSchedule.style.display === "none") {
      fullSchedule.style.display = "block";
      dropdownIcon.innerText = "arrow_drop_up";
    } else {
      fullSchedule.style.display = "none";
      dropdownIcon.innerText = "arrow_drop_down";
    }
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

/**
 * Find today's working hours from the database
 * @param {*} locationHours Object that contains days of the week and open/close time
 * @param {*} today day of the week
 * @returns open, close hours when the location is open today.
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values
 */
async function findWorkingHours(locationHours, today) {
  if (!locationHours) {
    return;
  }
  // format as how day of week is stored in Location databse
  const formattedDay = today.slice(0, 3).toLowerCase();
  const workingHours = locationHours[formattedDay];

  if (workingHours && workingHours.length > 0) {
    const workingHoursValue = Object.values(workingHours[0]);
    const openTime = workingHoursValue[0];
    const closeTime = workingHoursValue[1];

    return {
      open: openTime,
      close: closeTime,
    };
  } else {
    // when there is no data in woringHours since it is closed
    return {
      open: "Closed",
      close: "",
    };
  }
}
