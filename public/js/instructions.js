fetch("/api/user", {
  method: "POST",
  credentials: "include",
  headers: {
    "Accept": "application/json"
  }
})
  .then(async (res) => {
    const contentType = res.headers.get("content-type");

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Network response was not ok");
    }

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error("Expected JSON but got: " + text);
    }

    return res.json();
  })
  .then(data => {
    const button = document.querySelector(".next");
    if (!button) return;

    const session = data;

    button.addEventListener("click", (e) => {
      e.preventDefault();

      if (session?.first_login === true) {
        window.location.href = "Map.html";
      } else {
        window.location.href = "Home.html";
      }
    });
  })
  .catch(err => {
    console.error("Failed to load session:", err);
  });