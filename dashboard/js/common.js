// js/common.js

// --- AUTHENTICATION ---
function checkAuth() {
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";
  const onLoginPage =
    window.location.pathname.endsWith("login.html") ||
    window.location.pathname === "/";

  if (!isAuthenticated && !onLoginPage) {
    window.location.replace("login.html");
  } else if (isAuthenticated && onLoginPage) {
    window.location.replace("index.html");
  }
}

// --- THEME MANAGEMENT ---
let currentTheme = localStorage.getItem("theme") || "dark";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("theme", currentTheme);
  applyTheme(currentTheme);
  renderThemeToggle();
  // Highcharts charts need to be re-rendered on theme change if they have theme-dependent colors.
  // This is handled by the individual dashboard scripts.
  if (typeof window.applyFiltersAndRender === "function") {
    window.applyFiltersAndRender();
  }
}

function renderThemeToggle() {
  const container = document.getElementById("theme-toggle-container");
  if (!container) return;
  const isLight = currentTheme === "light";
  container.innerHTML = `
        <button onclick="toggleTheme()" class="theme-toggle" aria-label="Switch to ${
          isLight ? "dark" : "light"
        } mode">
            ${
              isLight
                ? `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="24" width="24"><path d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.51-256 256 0 141.309 114.51 256 256 256z"></path></svg>`
                : `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="24" width="24"><path d="M256 160c-52.9 0-96 43.1-96 96s43.1 96 96 96 96-43.1 96-96-43.1-96-96-96zm246.4 80.5l-94.7-47.3 33.5-100.4c4.5-13.6-8.4-26.5-21.9-21.9l-100.4 33.5-47.4-94.8c-6.4-12.8-24.6-12.8-31 0l-47.3 94.7L92.7 70.8c-13.6-4.5-26.5 8.4-21.9 21.9l33.5 100.4-94.7 47.4c-12.8 6.4-12.8 24.6 0 31l94.7 47.3-33.5 100.5c-4.5 13.6 8.4 26.5 21.9 21.9l100.4-33.5 47.3 94.7c6.4 12.8 24.6 12.8 31 0l47.3-94.7 100.4 33.5c13.6 4.5 26.5-8.4 21.9-21.9l-33.5-100.4 94.7-47.3c13-6.5 13-24.7.2-31.1zM256 320c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z"></path></svg>`
            }
        </button>
    `;
}
applyTheme(currentTheme);

// --- SIDEBAR MENU ---
function renderSidebar() {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  const menuItems = [
    { name: "Performance Dashboard", path: "index.html" },
    { name: "Visual Dashboard", path: "visual.html" },
    { name: "Security Dashboard", path: "security.html" }, // <-- ADDED THIS LINE
  ];
  const currentPath = window.location.pathname.split("/").pop();

  const itemsHtml = menuItems
    .map(
      (item) => `
        <li class="${
          currentPath === item.path ? "active" : ""
        }" onclick="window.location.href='${item.path}'">
            ${item.name}
        </li>
    `
    )
    .join("");

  container.innerHTML = `
        <div id="sidebar-menu" class="sidebar-menu">
            <div class="sidebar-overlay" onclick="closeSidebar()"></div>
            <div class="sidebar-content">
                <div class="brand-image">
                    <img src="assets/image.png" alt="Brand Logo" loading="lazy"/>
                </div>
                <ul class="menu-items">${itemsHtml}</ul>
            </div>
        </div>
    `;

  document
    .getElementById("hamburger-button")
    ?.addEventListener("click", openSidebar);
}

function openSidebar() {
  document.getElementById("sidebar-menu")?.classList.add("open");
}

function closeSidebar() {
  document.getElementById("sidebar-menu")?.classList.remove("open");
}

// --- LOADING SKELETON ---
function renderLoadingSkeleton() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.style.display = "block";

  overlay.innerHTML = `
        <div class="skeleton-container">
            <div class="skeleton-cards">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
            <div>
                <div class="skeleton skeleton-table-header"></div>
                <div class="skeleton skeleton-table-row"></div>
                <div class="skeleton skeleton-table-row"></div>
                <div class="skeleton skeleton-table-row"></div>
                <div class="skeleton skeleton-table-row"></div>
                <div class="skeleton skeleton-table-row"></div>
            </div>
        </div>
    `;
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.style.display = "none";
  }
  const mainContent = document.getElementById("main-content");
  if (mainContent) mainContent.style.display = "block";
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  if (!window.location.pathname.endsWith("login.html")) {
    renderThemeToggle();
    renderSidebar();
    renderLoadingSkeleton();
  }
});
