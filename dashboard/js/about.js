(function () {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
})();

document.addEventListener("DOMContentLoaded", () => {
  const currentTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);

  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "none";
  }

  renderThemeToggle();
  renderSidebar();
  checkAuth();

  initializeExpandableItems();
});

function initializeExpandableItems() {
  const fileItems = document.querySelectorAll(".file-item");

  fileItems.forEach((item, index) => {
    const fileName = item.querySelector(".file-name");
    const restContent = Array.from(item.children).filter(
      (child) => !child.classList.contains("file-name")
    );

    const header = document.createElement("div");
    header.className = "file-item-header";

    const arrow = document.createElement("span");
    arrow.className = "file-item-arrow";
    arrow.textContent = "▶";

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "file-item-content";

    header.appendChild(arrow);
    header.appendChild(fileName.cloneNode(true));

    restContent.forEach((child) => {
      contentWrapper.appendChild(child);
    });

    item.innerHTML = "";
    item.appendChild(header);
    item.appendChild(contentWrapper);

    header.addEventListener("click", () => {
      item.classList.toggle("expanded");
    });

    if (index < 2) {
      item.classList.add("expanded");
    }
  });
}
