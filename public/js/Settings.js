 // Popup box for preferred distance
      const preferredDistanceButton = document.getElementById(
        "preferredDistanceButton",
      );

      const distanceSlider = document.getElementById("distanceSlider");
      const distanceKm = document.getElementById("distanceKm");
      const distancePopup = document.getElementById("distancePopup");
      const closePopupButton = document.getElementById("closePopupButton");
      const saveButton = document.getElementById("saveButton");
      const yesButton = document.getElementById("yesButton");
      const clearButton = document.querySelector(".pinkRose");
      const noButton = document.getElementById("noButton");
      const clearPopup = document.getElementById("clearPopup");

      // Opens the popup box
      preferredDistanceButton.addEventListener("click", () => {
        distancePopup.style.display = "flex";
      });

      // Closes the popup
      closePopupButton.addEventListener("click", () => {
        distancePopup.style.display = "none";
      });

      // Updates distance text above slider
      distanceSlider.addEventListener("input", () => {
        distanceKm.textContent = distanceSlider.value;
      });

      /**
       * Loads in the user's selected radius (chosen on the Map) from the database.
       */
      async function loadUserRadius() {
        try {
          const response = await fetch("/api/authentication", {
            credentials: "include",
          });

          const auth = await response.json();

          // Defaults to a 5km radius if one is not selected
          const savedRadius = auth.selectedradius ?? 5;

          distanceSlider.value = savedRadius;

          distanceKm.textContent = savedRadius;
        } catch (error) {
          console.error("There was a problem loading the radius:", error);
        }
      }
      loadUserRadius();

      /**
       * Saves the user's newly selected radius.
       */
      saveButton.addEventListener("click", async () => {
        // Converts string to number
        const newRadius = Number(distanceSlider.value);

        try {
          const res = await fetch("/api/updateradius", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ radius: newRadius }),
          });

          if (res.ok) {
            alert("Preferred distance saved.");
            distancePopup.style.display = "none";
          } else {
            alert("There was a problem saving your distance.");
          }
        } catch (error) {
          console.error("Problem saving the radius:", error);
          alert("There was a problem saving your radius.");
        }
      });

      /**
       * Clears all saved locations belonging to a user.
       */
      yesButton.addEventListener("click", async () => {
        try {
          const res = await fetch("/api/clearSavedList", {
            method: "POST",
            credentials: "include",
          });

          if (res.ok) {
            alert("Saved locations cleared.");
          } else {
            alert("There was a problem clearing saved locations.");
          }
        } catch (error) {
          console.error("Problem clearing saved locations:", error);
          alert("There was a problem clearing saved locations.");
        }

        clearPopup.style.display = "none";
      });

      // Opens the Are you sure? popup
      clearButton.addEventListener("click", () => {
        clearPopup.style.display = "flex";
      });

      // Closes popup
      noButton.addEventListener("click", () => {
        clearPopup.style.display = "none";
      });

      // Redirects to Map page
      document
        .getElementById("setLocationButton")
        .addEventListener("click", () => {
          window.location.href = "/html/SofiasMap.html";
        });

      document.getElementById("logoutBtn").addEventListener("click", () => {
        window.location.href = "/logout";
      });

      document.querySelector(".backIcon").addEventListener("click", () => {
        window.history.back();
      });

      //toggle code
      document.addEventListener("DOMContentLoaded", () => {
        const toggle = document.getElementById("tutorialToggle");

        toggle.addEventListener("change", async (e) => {
          const enabled = e.target.checked;

          try {
            const res = await fetch("/api/settings/tutorial", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                Instructions_Upon_login: enabled
              })
            });

            if (!res.ok) {
              console.error("Failed to update setting");
            }
          } catch (err) {
            console.error("Error updating setting:", err);
          }
        });
      });