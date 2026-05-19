/**
 * CREDITS
 *
 * Min: Wrote all logic for the details page.
 * Damon: AI-feature logic.
 * Danielle: Wrote helper function for distance between coordinates
 * Sofia: Refactored Min's comments, fixed geolocation logic to pull from db,
 *        made minor changes to pull $$, phone #, and backdrop image from db
 */

// Extracts the location id from the query string
const urlParams = new URLSearchParams(window.location.search);
const locationId = urlParams.get("locationId");

// Used to represent the state of user's current email, saved list, etc
let userEmail = "";
let updatedSavedList = [];
let isSaved = false;

// Represents the user's geolocation
let userLocation = null;

// List of regions - part of Copilot's refactor
let currentLocation = null;
const areas = [
  "Vancouver",
  "Burnaby",
  "New Westminster",
  "Richmond",
  "Coquitlam",
  "Port Moody",
  "Port Coquitlam",
];

/**
 * Checks the user is authenticated prior to accessing
 * the details page.
 *
 * Redirects to login page if not authenticated.
 */
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
 * Loads in locations from the database.
 */
async function loadLocation() {
  const res = await fetch("/api/locations");
  const locations = await res.json();
  currentLocation = locations.find((loc) => loc._id === locationId);

  // Redirects to 404 page if geolocation doesn't exist
  if (!currentLocation) {
    window.location.href = "../html/404.html";
    return;
  }

  // Loads the user's saved location from the database
  const response = await fetch("/api/authentication", {
    credentials: "include",
  });
  const auth = await response.json();
  userLocation = auth.selectedlocation;

  // Renders the page first
  await renderPage(currentLocation);

  // Updates the bookmark icon depending on whether it is saved or not
  await updateBookmark();
}

/**
 * Loads saved_list from users in the database (helper method).
 *
 * @param userEmail the email used to find the logged in user's saved location
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
 * Updates the bookmark icon based on whether or not
 * a location is in a user's saved_list.
 */
async function updateBookmark() {
  const userSavedList = await loadUserSavedList(userEmail);
  isSaved = userSavedList.includes(locationId);

  // Keeps a copy of the user's saved_list
  updatedSavedList = userSavedList;

  const saveBtn = document.querySelector(".card__save-btn");
  const bookmarkIcon = saveBtn.querySelector(".bookmark");

  // Changes UI based on status
  if (isSaved) {
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark-unsave");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark");
  } else {
    bookmarkIcon.classList.remove("material-symbols-outlined-bookmark");
    bookmarkIcon.classList.add("material-symbols-outlined-bookmark-unsave");
  }
}

/**
 * Renders the entire details page for a single location.
 *
 * @param {*} locations
 *
 * References:
 * https://www.w3schools.com/Jsref/tryit.asp?filename=tryjsref_getday
 * https://www.w3schools.com/howto/howto_js_copy_clipboard.asp
 */
async function renderPage(location) {
  const page = document.getElementById("mainPage");

  // Gets the area name from the address
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

  // Calculates today's working hours for a location
  const date = new Date();
  const today = dayOfWeek[date.getDay()];
  const workingHour = await findWorkingHours(location.hours, today);
  let workingHourText = "";

  if (workingHour.open != "Closed") {
    workingHourText = `${workingHour.open} – ${workingHour.close}`;
  } else {
    workingHourText = `Closed`;
  }

  // Gets the full working hours of a location
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

  // Default text if distance cannot be calculated
  let distance = "0";

  if (userLocation && location.geo?.coordinates) {
    // Uses Danielle's helper function
    distance = getDistanceKm(userLocation, location.geo.coordinates) + " km";
  }

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

        <div class="backdrop" style="background-image: url('${location.images[0]}');"></div>

        <section class="detailsBox">
            <div class="headingSection">
            <div class="headingBlock">
                <h1 class="locationName">${location.name}</h1>
                <p class="location">${areaName}, BC</p>
                <div class="relativePrice">${location.relativePrice}</div>
            </div>
            </div>

            <div class="addressNumberSection">
            <div class="addressBlock">
                <span class="addressLine">${location.address}</span>
                 <button class = "saveButton">Copy Address</button>

            </div>

            <div class="phoneBlock">${location.phone}</div>
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
                <span class="distance">${distance} </span>
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
            <a id="chatBtn" class="redirectLink"><span>Ask Questions (AI)</span></a>
            <a onclick="checkAvailability()" id="availabilityBtn" class="redirectLink"><span>Check Availability (AI)</span></a>
            </div>
            <textarea id="AIOutput" rows="10" readonly></textarea>
        </section>

        <!-- Chat Overlay - Popup challenge - Code made by Copilot -->
        <div id="chatOverlay" class="chat-overlay">
            <div class="chat-container">
                <div class="chat-header">
                    <h3>Ask about this location</h3>
                    <button id="closeChatBtn" class="close-btn">&times;</button>
                </div>
                <div id="chatMessages" class="chat-messages"></div>
                <div class="chat-input-container">
                    <input type="text" id="chatInput" placeholder="Ask about vegan food, pricing, etc..." maxlength="200">
                    <button id="sendChatBtn">Send</button>
                </div>
            </div>
        </div>
        </div>
    `,
  );
  setupChatEventListeners();
  addAllButtonListeners(location, locationId);
}

/**
 * Pop-up challenge: initially written by Damon, then asked Copilot
 * to improve/refactor the code.
 *
 * Copilot improved it by adding error checks, using safer practices
 * like encodeURIComponent(), and removing redundant code like
 * a duplicate fetch for location info.
 *
 * It also added extra stuff it was not asked to do like checking hours.
 *
 * This was removed since it was inaccurate and not needed.
 */
async function checkAvailability() {
  const btn = document.getElementById("availabilityBtn");
  const text = document.getElementById("AIOutput");
  const originalLabel = btn.textContent;

  btn.disabled = true;
  btn.textContent = "Checking...";
  text.value = "";

  try {
    if (!currentLocation) {
      throw new Error("Location not loaded");
    }

    const res = await fetch(
      `/api/ai/schedule/${encodeURIComponent(currentLocation.name)}/${encodeURIComponent(currentLocation.address)}`,
    );

    if (!res.ok) {
      throw new Error(`AI request failed with status ${res.status}`);
    }

    const aiResponse = await res.json();
    text.value =
      aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No availability information was returned.";
  } catch (error) {
    console.error(error);
    text.value =
      "Unable to check availability right now. Please try again later.";
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

/**
 * Pop-up challenge: Chat functionality setup - Made entirely by Copilot.
 *
 * Only a few stylistic changes were made, or an extra comment here and there.
 */
function setupChatEventListeners() {
  const chatBtn = document.getElementById("chatBtn");
  const chatOverlay = document.getElementById("chatOverlay");
  const closeChatBtn = document.getElementById("closeChatBtn");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const chatMessages = document.getElementById("chatMessages");

  if (!chatBtn || !chatOverlay) return; // Elements not yet rendered

  // Open chat overlay
  chatBtn.addEventListener("click", function () {
    chatOverlay.style.display = "block";
    chatInput.focus();
  });

  // Close chat overlay
  closeChatBtn.addEventListener("click", function () {
    chatOverlay.style.display = "none";
  });

  // Close overlay when clicking outside
  chatOverlay.addEventListener("click", function (e) {
    if (e.target === chatOverlay) {
      chatOverlay.style.display = "none";
    }
  });

  // Send message on button click
  sendChatBtn.addEventListener("click", sendChatMessage);

  // Send message on Enter key
  chatInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, "user");
    chatInput.value = "";
    sendChatBtn.disabled = true;
    sendChatBtn.textContent = "Sending...";

    try {
      const response = await fetch(
        `/api/ai/chat/${encodeURIComponent(currentLocation.name)}/${encodeURIComponent(currentLocation.address)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: message }),
        },
      );

      if (!response.ok) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }

      const data = await response.json();
      const aiResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a response right now.";

      addMessage(aiResponse, "ai");
    } catch (error) {
      console.error("Chat error:", error);
      addMessage(
        "Sorry, I'm having trouble responding right now. Please try again.",
        "ai",
      );
    } finally {
      sendChatBtn.disabled = false;
      sendChatBtn.textContent = "Send";
    }
  }

  function addMessage(text, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

/**
 * Adds event listeners for every button and icon.
 *
 * @param {*} location the location being displayed
 * @param {*} locationId the database id of the location
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

  // 3. clipboard button to easily copy an address into Google Maps
  const clipboardBtn = document.querySelector(".addressBlock");
  clipboardBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(location.address);
    alert(`Address copied: ${location.address}`);
  });

  // 4. schedule button to view the whole working schedule
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
 * Updates the appearance of the bookmark icon and updates
 * the user's saved_list.
 *
 * @param {string} locationId the location id to save/unsave
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
 * Removes a location id from the user's saved_list in the database (helper method).
 *
 * @param {string} locationId the location id to be removed
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
 * Adds a location id from the user's saved_list in the database (helper method).
 *
 * @param {string} locationId the id to be added
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
 * Finds today's working hours.
 *
 * @param {*} locationHours object containing the hours for each day
 * @param {*} today day of the week
 * @returns open, close hours
 *
 * References:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values
 */
async function findWorkingHours(locationHours, today) {
  if (!locationHours) {
    return;
  }
  // Formats the weekday to match the format in the database (i.e. mon)
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
    // When no data is available for working hours, it is closed
    return {
      open: "Closed",
      close: "",
    };
  }
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
  const R = 6371; // radius of the earth in km

  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;

  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return Math.round(R * (2 * Math.asin(Math.sqrt(x))) * 10) / 10;
}
