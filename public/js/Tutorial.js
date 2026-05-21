/**
 * Sends a request marking the video tutorial as complete; redirects user to correct page.
 */
document.querySelector(".continue").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/viewedtutorial", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      window.location.href = data.redirectTo;
    }
  } catch (error) {
    console.error("There was a problem completing the tutorial: ", error);
  }
});
