// Check if authenticated
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  }
}
checkAuth();

const rowCategories = [
    {
        id: "pantriesRow", 
        category: "Food Pantry"
    },
    {
        id: "farmersMarketsRow", 
        category: "Farmers Market"
    },
    {
        id: "localFoodMarketsRow", 
        category: "Local Market"
    }
];

/**
 * Loads in locations from the database.
 */
async function loadLocations() {
  const res = await fetch("/api/locations");
  const locations = await res.json();
  console.log(locations); // Use _id as search params for now
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
        let locations = allLocations.filter(location => location.tags[0] === rowCategories[i].category);
        for (let i = 0; i < locations.length; i++) {
            row.insertAdjacentHTML("beforeend", `
            <article class="locationBox">
                <a href="Details.html?id=${locations[i]._id}">
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
                    <span class="locationDistanceKm">3.8 km</span>
                    </div>
                    <span class="relativePrice">$$</span>
                </div>

                <div class="tagRow">
                    ${locations[i].tags.map(tag => {
                    return '<span class="tag">' + tag + '</span>'
                    }).join('')}
                </div>
                </div>
                </a>
            </article>
            `);
        }
    }
}