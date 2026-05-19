fetch("/api/users")
  .then(res => {
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }
    return res.json();
  })
  .then(data => {
    const session = data.find(s => s.first_login === true);

    document.querySelector(".next").addEventListener("click", (e) => {
      e.preventDefault();

      const firstLogin = session?.first_login;

      if (firstLogin === true) {
        window.location.href = "Map.html";
      } else {
        window.location.href = "Home.html";
      }
    });
  })
  .catch(err => {
    console.error("Failed to load session:", err);
  });