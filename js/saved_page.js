/**
 * Loads in locations from the database.
 */
async function loadLocations() {
  const res = await fetch("/api/locations");
  const locations = await res.json();
  await renderCards(locations);
}
loadLocations();

/**
 * 
 * @param {*} locations 
 */
function renderCards(locations) {
  const grid = document.getElementById("section__saved-page");
  for (let i = 0; i < locations.length; i++) {
    grid.insertAdjacentHTML("beforeend", `
      <div class="card">
        <article class="card">
        <div class="card__image-container">
            <img
            src="/img/queensborough.jpg"
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
            <h3 class="card__title">${locations[i].name}</h3>
        </div>
    </article>
    `);
  }
}