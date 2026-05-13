/**
 * Todo list:
 * 1. filter tags
 * 2. saved page logic from each section (including tag[0]) --> needs to be tested.
 */

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
 * Reference: COMP1800_202530_BBY21 project
 * https://github.com/RuleOfSix/1800_202530_BBY21
 */

/**
 * Loads saved location only from the logged in user.
 * Load all locations and filter them to have only the same ids in the userSavedList.
 *
 * -- updated logic:
 * -- To  get filtered by category (food pantries, farmers' market, local market) as well before rendering cards.
 * -- If "saved_places button" is clicked from Home.html, this updated logic wouldn't be applied.
 * @param userEmail the email to find the logged in user's saved location
 *
 * https://medium.com/@louistrinh/get-url-parameters-in-javascript-efd99c5ddcaf
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
    savedLocations = savedLocations.filter((location) => {
      location.tags[0] === category;
    });
  }
  renderCards(savedLocations);
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

loadSavedLocations();

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
