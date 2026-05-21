/**
 * CREDITS: Sofia
 */
const loginTab = document.getElementById("loginSlider");
const signupTab = document.getElementById("signupSlider");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

let loginIsCurrentlyShown = true;

function changeUI() {
  if (loginIsCurrentlyShown) {
    loginForm.style.display = "flex";
    signupForm.style.display = "none";

    loginTab.textContent = "Login";
    signupTab.textContent = "Signup";

    loginTab.classList.add("active");
    signupTab.classList.add("inactive");

    loginTab.classList.remove("inactive");
    signupTab.classList.remove("active");
  } else {
    loginForm.style.display = "none";
    signupForm.style.display = "flex";

    loginTab.textContent = "Login";
    signupTab.textContent = "Signup";

    signupTab.classList.add("active");
    loginTab.classList.add("inactive");

    signupTab.classList.remove("inactive");
    loginTab.classList.remove("active");
  }
}

signupTab.addEventListener("click", () => {
  if (!loginIsCurrentlyShown) {
    return;
  }

  loginIsCurrentlyShown = false;
  changeUI();
});

loginTab.addEventListener("click", () => {
  if (loginIsCurrentlyShown) {
    return;
  }

  loginIsCurrentlyShown = true;
  changeUI();
});

loginForm.classList.add("fade");
signupForm.classList.add("fade");

changeUI();
