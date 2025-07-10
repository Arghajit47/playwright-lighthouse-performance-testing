// js/auth.js
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("isAuthenticated") === "true") {
    window.location.replace("index.html");
    return;
  }

  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("auth-error");
  const loginButton = document.getElementById("login-button");
  const authContainer = document.getElementById("auth-container");

  authContainer.style.backgroundImage = `url(assets/image.jpg)`;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoading(true);

    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
      const response = await fetch(
        "https://playwright-lighthouse-performance-testing.onrender.com/api/verifycredentials",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.isAuthenticated) {
        sessionStorage.setItem("isAuthenticated", "true");
        window.location.replace("index.html");
      } else {
        showError(data.error || "Invalid username or password ❌");
      }
    } catch (error) {
      console.error("Login error:", error);
      showError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    usernameInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    loginButton.textContent = isLoading ? "Verifying..." : "Login";
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
});
