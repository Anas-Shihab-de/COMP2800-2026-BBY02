/**
 * CREDITS: Sofia
 */
const loginTab = document.getElementById("loginSlider");
const signupTab = document.getElementById("signupSlider");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginFormEl = loginForm.querySelector("form");
const signupFormEl = signupForm.querySelector("form");

const errorMsg = document.getElementById("errorMsg");

let loginIsCurrentlyShown = true;

function changeUI() {
  errorMsg.textContent = "";
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

// Grab form data and post to server, 
// redirect or display error depending on response.
loginFormEl.addEventListener("submit", async (e) => {
  // Prevent automatic page refresh from submit button
  e.preventDefault();
  
  // Gets data from form via matching name:value (loginName: test)
  const formData = new FormData(loginFormEl);
  // Convert into a useable object ({loginName: test, loginPassword: ...})
  const data = Object.fromEntries(formData);
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (response.ok) {
      window.location.href = result.redirect;
    } else {
      errorMsg.textContent = result.error;
    }
  } catch (error) {
    errorMsg.textContent = "An error occurred. Please try again.";
  }
});

signupFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const formData = new FormData(signupFormEl);
  const data = Object.fromEntries(formData);
  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (response.ok) {
      window.location.href = result.redirect;
    } else {
      errorMsg.textContent = result.error;
    }
  } catch (error) {
    errorMsg.textContent = "An error occurred. Please try again.";
  }
});

loginForm.classList.add("fade");
signupForm.classList.add("fade");

changeUI();
