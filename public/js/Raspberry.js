/**
 * CREDITS
 *
 * Damon: Added audio to the game.
 * Sofia: Implemented game functionality.
 */
const fruitLogo = document.querySelector(".fruitsLogo img");
const raspberryMask = document.getElementById("raspberryMask");
const raspberryMsg = document.getElementById("raspberryMsg");
const raspberryExit = document.getElementById("raspberryExit");
const bewareOfRaspberry = document.getElementById("bewareOfRaspberry");
const bewareOfRaspberryText = document.getElementById("bewareOfRaspberryText");

// Audio objects
let bgm = document.createElement("audio");
let noo = document.createElement("audio");
let victory = document.createElement("audio");
bgm.src = "../audio/BgMusic.mp3";
noo.src = "../audio/NOO.mp3";
victory.src = "../audio/VictoryJingle.mp3";

const RASPBERRY_IMGS = [
  "../img/Raspberry1.png",
  "../img/Raspberry2.png",
  "../img/Raspberry3.png",
];

const MAX_RASPBERRIES_ON_SCREEN = 35;
const TOTAL_SURVIVAL_TIME = 31000;

// Minimum threshold for raspberries to appear on the screen before warning message appears
const MIN_WARNING_VALUE = 0.2;

let raspberrySpawnSpeed = 300;
let running = false;
let raspberrySpeed = 2.0;
let raspberryCount = 0;
let startingTime = null;
let raspberryPile = 0;

// Hides the warning screen prior to starting the game
bewareOfRaspberry.classList.add("hidden");
bewareOfRaspberryText.classList.add("hidden");

/**
 * Updates the warning effects based on how full the screen is.
 *
 * @returns {void}
 */
function updateImminentWarning() {
  if (!running) {
    return;
  }

  // Filled screen represented as a percentage
  const raspberriesFillingScreen = raspberryCount / MAX_RASPBERRIES_ON_SCREEN;

  if (raspberriesFillingScreen >= MIN_WARNING_VALUE) {
    bewareOfRaspberry.classList.remove("hidden");
    bewareOfRaspberry.classList.add("warningMask");

    bewareOfRaspberryText.textContent = "FRUIT OVERLOAD IMMINENT";
    bewareOfRaspberryText.classList.remove("hidden");
    bewareOfRaspberryText.classList.add("imminentRaspberryText");
  } else {
    bewareOfRaspberry.classList.add("hidden");
    bewareOfRaspberry.classList.remove("warningMask");

    bewareOfRaspberryText.classList.add("hidden");
    bewareOfRaspberryText.classList.remove("imminentRaspberryText");
  }

  // Adjusts raspberry wiggle speed during warning
  if (raspberriesFillingScreen >= MIN_WARNING_VALUE) {
    document.documentElement.style.setProperty("--wiggleSpeed", "0.35s");
  } else {
    document.documentElement.style.setProperty("--wiggleSpeed", "0.6s");
  }
}

/**
 * Starts a new round of the raspberry game.
 *
 * @returns {void}
 */
function startGame() {
  if (running) {
    return;
  }

  running = true;

  // Start bgm
  bgm.play();

  // Starting values
  raspberryCount = 0;
  startingTime = Date.now();
  raspberrySpeed = 1.5;
  raspberrySpawnSpeed = 600;

  // Removes ability to click on the page
  document.querySelector(".page").classList.add("disableClicks");

  raspberryMask.classList.add("hidden");
  bewareOfRaspberry.classList.add("hidden");
  bewareOfRaspberryText.classList.add("hidden");

  // Starts spawning the raspberries
  spawnRaspberry();
  scheduleNextSpawn();

  // Reduces the time between spawns every 4 seconds
  const spawnTimer = setInterval(() => {
    // Stop timer if game is not running
    if (!running) {
      clearInterval(spawnTimer);
      return;
    }

    // Reduces spawn time by 15%
    const newSpawnRate = raspberrySpawnSpeed * 0.85;

    // Makes sure the spawn rate never goes below 80ms so the game does not become too intense
    raspberrySpawnSpeed = Math.max(80, newSpawnRate);
  }, 4000);

  // Increases falling speed every 3 seconds
  const raspberrySpeedBuff = setInterval(() => {
    if (!running) {
      clearInterval(raspberrySpeedBuff);
      return;
    }

    // Increases speed by 25%
    raspberrySpeed = raspberrySpeed * 1.03;

    // Adds the screen shaking animation
    document.body.classList.add("screenShake");
    setTimeout(() => {
      document.body.classList.remove("screenShake");
    }, 250);
  }, 3000);

  // Checks once every second to see if the user survived long enough to win
  const checkForWin = setInterval(() => {
    if (!running) {
      clearInterval(checkForWin);
      return;
    }

    const timePlayed = Date.now() - startingTime;

    // User wins once the time played >= total survival time
    if (timePlayed >= TOTAL_SURVIVAL_TIME) {
      endRaspberryGame(true);
      clearInterval(checkForWin);
    }
  }, 1000);
}

/**
 * Schedules the next raspberry that should appear on the screen.
 *
 * @returns {void}
 */
function scheduleNextSpawn() {
  if (!running) {
    return;
  }
  setTimeout(() => {
    // Creates one raspberry
    spawnRaspberry();
    scheduleNextSpawn();

    // Repeatedly calls itself to form a spawning cycle
  }, raspberrySpawnSpeed);
}

/**
 * Runs the same function again on the next animation frame
 *
 * @param {Function} callback the function to run on the next frame
 * @returns {void}
 */
function keepFalling(callback) {
  requestAnimationFrame(callback);
}

/**
 * Creates a single raspberry on the screen.
 *
 * @returns {void}
 */
function spawnRaspberry() {
  if (!running) {
    return;
  }

  // If the screen is already full, the user loses
  if (raspberryCount >= MAX_RASPBERRIES_ON_SCREEN) {
    endRaspberryGame(false);
    return;
  }

  // Creates and adds the raspberry image to the screen using a random index
  const raspberry = document.createElement("img");
  const index = Math.floor(Math.random() * RASPBERRY_IMGS.length);
  raspberry.src = RASPBERRY_IMGS[index];

  // Adds audio element per raspberry so that multiple sfx can play at the same time
  const raspberrySfx = document.createElement("audio");
  raspberrySfx.src = "../audio/RaspberrySquish.mp3";

  raspberry.classList.add("raspberry");

  // Chooses a random horizontal starting position
  const xPosition = Math.random() * (window.innerWidth - 60);
  raspberry.style.left = xPosition + "px";

  // Raspberries start before the top of the screen
  raspberry.style.top = "-80px";

  document.body.appendChild(raspberry);

  raspberryCount = raspberryCount + 1;
  updateImminentWarning();

  // Listens for clicks, removes raspberries
  raspberry.addEventListener("click", () => {
    raspberrySfx.play();
    raspberry.remove();
    raspberryCount = Math.max(0, raspberryCount - 1);
    updateImminentWarning();
  });

  // Remove sfx when play() is done
  raspberrySfx.addEventListener("ended", () => {
    raspberrySfx.remove();
  });

  let yPosition = -80;

  /**
   * Controls the falling animation for one raspberry.
   *
   * @returns {void}
   */
  function dropRaspberry() {
    // Removes the raspberries when the game ends
    if (!running) {
      raspberry.remove();
      return;
    }

    // Moves the raspberry downwards based on the current fall speed
    yPosition = yPosition + raspberrySpeed;
    raspberry.style.top = yPosition + "px";

    // If raspberry reaches bottom, let it sit there
    const pageBottom = window.innerHeight - raspberry.height;
    if (yPosition >= pageBottom) {
      raspberry.style.top = pageBottom + "px";
      return;
    }

    // Runs the function again so raspberry keeps falling in increments
    keepFalling(dropRaspberry);
  }

  keepFalling(dropRaspberry);
}

/**
 * Ends the raspberry game, shows the user the end result.
 *
 * @param {boolean} userWon
 *
 * @returns {void}
 */
function endRaspberryGame(userWon) {
  running = false;
  bgm.pause();

  if (userWon) victory.play();
  else noo.play();

  // Re-enables page clicking
  document.querySelector(".page").classList.remove("disableClicks");

  raspberryMask.classList.remove("hidden");

  // Used a template literal to insert the <br>
  raspberryMsg.innerHTML = userWon
    ? `YOU WON<br>Great work!`
    : `GAME OVER<br>The raspberries took over...`;

  bewareOfRaspberry.classList.add("hidden");
  bewareOfRaspberryText.classList.add("hidden");
}

if (raspberryExit) {
  raspberryExit.addEventListener("click", () => {
    window.location.href = "/html/Home.html";
  });
}

if (fruitLogo) {
  fruitLogo.addEventListener("click", startGame);
}
