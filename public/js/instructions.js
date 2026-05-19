// just js for button, if first login then go to map, otherwise go to home

const nextButton = document.querySelector(".next");

const firstLogin = sessionStorage.getItem("first_login") === "true";

nextButton.addEventListener("click", (e) => {
    e.preventDefault();

    if (firstLogin) {
        window.location.href = "Map.html";
    } else {
        window.location.href = "Home.html";
    }
});