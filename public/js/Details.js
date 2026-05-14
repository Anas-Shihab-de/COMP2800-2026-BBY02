// Check if authenticated
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  }
}
checkAuth();

// Source - https://stackoverflow.com/a/901144
// Posted by Artem Barger, modified by community. See post 'Timeline' for change history
// Retrieved 2026-05-13, License - CC BY-SA 4.0
const urlParams = new URLSearchParams(window.location.search);
const locationId = urlParams.get('locationId');


/**
 * Loads in locations from the database.
 */
async function loadLocation() {
  const res = await fetch("/api/locations");
  const locations = await res.json();
  console.log(locations);
  const location = await locations.filter(loc => loc._id === locationId);
  // TODO redirect to 404 page if no matching id
  console.log(location[0]);
  await renderPage(location[0]);
}
loadLocation();

async function checkAvailability() {
    const btn = document.getElementById("availabilityBtn");
    const text = document.getElementById("availabilityOutput");
    btn.disabled = true;
    const res = await fetch("/api/locations");
    const locations = await res.json();
    const location = locations.filter(loc => loc._id === locationId);
    const res2 = await fetch(`/api/ai/schedule/${location[0].name}`);
    const response = await res2.json();
    console.log(response.candidates[0].content.parts[0].text);
    text.value = response.candidates[0].content.parts[0].text;
    btn.disabled = false;
}

/**
 * 
 * @param {*} locations 
 */
function renderPage(location) {
    const page = document.getElementById("mainPage");
    page.insertAdjacentHTML("beforeend", `
        <section class="header">
            <img src="${location.images[0]}" />

            <div class="headerButtons">
            <button class="backIcon"><img src="../img/BackIcon.png" /></button>

            <button class="bookmarkIcon">
                <img src="../img/BookmarkIcon.png" />
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
                ${location.notes.map(note => {
                return '<li>' + note + '</li>'
                }).join('')}
            </ul>
            </section>

            <div class="redirectInfo">
            <a href="${location.links[0]}" class="redirectLink">
                <img src="../img/RedirectIcon.png" />
                <span>See more on the website</span>
            </a>
            </div>

            <button onclick="checkAvailability()" id="availabilityBtn">Check Availability</button>
            <textarea id="availabilityOutput" rows="6"></textarea>
        </section>
    `);
}