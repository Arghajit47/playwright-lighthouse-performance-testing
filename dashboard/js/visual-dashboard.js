// js/visual-dashboard.js

// --- GLOBAL STATE ---
let testData = [];
let filteredData = [];
let screenshotPaths = [];
let filters = { status: null, device: null, brand: null, searchTerm: "" };
let uiState = {
  showScreenshots: false,
  loadingScreenshots: false,
  modalImage: null,
};

// --- DATA FETCHING ---
async function fetchData() {
  try {
    const response = await fetch(
      "https://test-dashboard-66zd.onrender.com/api/proxy/merged-results"
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    testData = await response.json();
    applyFiltersAndRender();
    hideLoading();
  } catch (error) {
    console.error("Failed to fetch data:", error);
    hideLoading();
    document.getElementById(
      "main-content"
    ).innerHTML = `<p style="color: red; text-align: center;">Failed to load data.</p>`;
  }
}

async function fetchScreenshotList() {
  if (screenshotPaths.length > 0 || uiState.loadingScreenshots) return;
  uiState.loadingScreenshots = true;
  renderScreenshotList();
  try {
    const response = await fetch(
      "https://test-dashboard-66zd.onrender.com/api/proxy/baselineList"
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const textData = await response.text();
    screenshotPaths = textData.split("\n").filter((path) => path.trim() !== "");
  } catch (error) {
    console.error("Failed to fetch screenshot paths:", error);
    screenshotPaths = [];
  } finally {
    uiState.loadingScreenshots = false;
    renderScreenshotList();
  }
}

// --- FILTERING & RENDERING ---
// Make this globally accessible for theme changes
window.applyFiltersAndRender = function () {
  filteredData = testData.filter((t) => {
    if (
      filters.searchTerm &&
      !t.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
    )
      return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.device && t.device !== filters.device) return false;
    if (filters.brand && t.brand !== filters.brand) return false;
    return true;
  });
  renderAllComponents();
};

function clearFilters() {
  filters = { status: null, device: null, brand: null, searchTerm: "" };
  applyFiltersAndRender();
}

function renderAllComponents() {
  renderVisualCards();
  renderPieChart();
  renderBrandCharts();
  renderFilters();
  renderTestResults();
  renderScreenshotList();
}

// --- RENDER FUNCTIONS ---
function renderVisualCards() {
  const container = document.getElementById("visual-cards-container");
  if (!container) return;

  const passed = testData.filter((t) => t.status === "passed").length;
  const failed = testData.filter((t) => t.status === "failed").length;
  const total = passed + failed;

  const cards = [
    {
      title: "Total Tests",
      value: total,
      color: "var(--primary-color)",
      icon: "https://img.icons8.com/?size=100&id=aDxFydZTXC0Y&format=png&color=000000",
    },
    {
      title: "Passed Tests",
      value: passed,
      color: "var(--success-color)",
      icon: "https://img.icons8.com/?size=100&id=AgSsCpE2BsM1&format=png&color=000000",
    },
    {
      title: "Failed Tests",
      value: failed,
      color: "var(--error-color)",
      icon: "assets/failed_icon.png",
    },
  ];

  container.innerHTML = `
        <div class="cards-grid">
            ${cards
              .map(
                (card) => `
                <div class="info-card">
                     <div class="info-card-icon"><img src="${card.icon}" alt="${card.title} icon" loading="lazy" width="28" height="28"/></div>
                     <div>
                        <h3 class="info-card-title">${card.title}</h3>
                        <p class="info-card-value" style="color: ${card.color};">${card.value}</p>
                     </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

function renderPieChart() {
  const container = document.getElementById("pie-chart-container");
  if (!container || !testData.length) return;

  const passed = testData.filter((t) => t.status === "passed").length;
  const failed = testData.filter((t) => t.status === "failed").length;

  const options = {
    chart: { type: "pie", backgroundColor: "transparent" },
    title: {
      text: "Visual Test Result Breakdown",
      style: { color: "var(--text-primary)", fontWeight: "600" },
    },
    tooltip: {
      valueSuffix: " test(s)",
      backgroundColor: "var(--card-bg)",
      borderColor: "var(--border-color)",
      style: { color: "var(--text-primary)" },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.percentage:.1f} %",
          style: { color: "var(--text-primary)", textOutline: "none" },
        },
        point: {
          events: {
            click: (e) => {
              filters.status = e.point.name.toLowerCase();
              applyFiltersAndRender();
            },
          },
        },
      },
    },
    series: [
      {
        name: "Tests",
        colorByPoint: true,
        data: [
          { name: "Passed", y: passed, color: "var(--success-color)" },
          { name: "Failed", y: failed, color: "var(--error-color)" },
        ],
      },
    ],
    credits: { enabled: false },
  };
  Highcharts.chart(container, options);
}

function renderBrandCharts() {
  const container = document.getElementById("brand-charts-section");
  if (!container || !testData.length) return;

  const brandData = testData.reduce((acc, item) => {
    if (!item.brand) return acc;
    if (!acc[item.brand]) acc[item.brand] = { pass: 0, fail: 0 };
    if (item.status === "passed") acc[item.brand].pass++;
    else acc[item.brand].fail++;
    return acc;
  }, {});

  container.innerHTML = `
        <h2 style="text-align: center; color: var(--text-primary);">Brand Test Analysis</h2>
        <div class="brand-charts-container">
            ${Object.keys(brandData)
              .map(
                (brand) =>
                  `<div id="brand-chart-${brand.replace(
                    /\s+/g,
                    ""
                  )}" class="brand-chart"></div>`
              )
              .join("")}
        </div>
    `;

  Object.entries(brandData).forEach(([brand, data]) => {
    Highcharts.chart(`brand-chart-${brand.replace(/\s+/g, "")}`, {
      chart: { type: "column", height: 300 },
      title: { text: `${brand} Test Results` },
      xAxis: { categories: ["Pass", "Fail"], title: { text: null } },
      yAxis: {
        min: 0,
        title: { text: "Number of Tests" },
        allowDecimals: false,
      },
      legend: { enabled: false },
      plotOptions: { column: { dataLabels: { enabled: true } } },
      series: [
        {
          name: "Tests",
          data: [
            { y: data.pass, color: "var(--success-color)" },
            { y: data.fail, color: "var(--error-color)" },
          ],
        },
      ],
      credits: { enabled: false },
    });
  });
}

function renderFilters() {
  const container = document.getElementById("filters-container");
  if (!container) return;

  const devices = [...new Set(testData.map((t) => t.device))];
  const brands = [...new Set(testData.map((t) => t.brand).filter(Boolean))];
  const hasActiveFilter =
    filters.status || filters.device || filters.brand || filters.searchTerm;

  container.innerHTML = `
        <div class="filter-group">
            <label for="test-search">Search:</label>
            <input type="text" id="test-search" value="${
              filters.searchTerm
            }" placeholder="Search by test name">
        </div>
        <div class="filter-group">
            <label for="device-select">Device:</label>
            <select id="device-select">
                <option value="">All</option>
                ${devices
                  .map(
                    (d) =>
                      `<option value="${d}" ${
                        filters.device === d ? "selected" : ""
                      }>${d}</option>`
                  )
                  .join("")}
            </select>
        </div>
        <div class="filter-group">
            <label for="brand-select">Brand:</label>
            <select id="brand-select">
                <option value="">All</option>
                ${brands
                  .map(
                    (b) =>
                      `<option value="${b}" ${
                        filters.brand === b ? "selected" : ""
                      }>${b}</option>`
                  )
                  .join("")}
            </select>
        </div>
        <div class="filter-group">
            <label for="status-select">Status:</label>
            <select id="status-select">
                <option value="">All</option>
                <option value="passed" ${
                  filters.status === "passed" ? "selected" : ""
                }>Passed</option>
                <option value="failed" ${
                  filters.status === "failed" ? "selected" : ""
                }>Failed</option>
            </select>
        </div>
        <button id="screenshot-toggle-btn" class="screenshot-toggle-button">${
          uiState.showScreenshots ? "Hide" : "Show"
        } Screenshot Paths</button>
        ${
          hasActiveFilter
            ? `<div class="clear-filters-button"><button id="clear-filters-btn">Clear All Filters</button></div>`
            : ""
        }
    `;

  document.getElementById("test-search").addEventListener("input", (e) => {
    filters.searchTerm = e.target.value;
    applyFiltersAndRender();
  });
  document.getElementById("device-select").addEventListener("change", (e) => {
    filters.device = e.target.value || null;
    applyFiltersAndRender();
  });
  document.getElementById("brand-select").addEventListener("change", (e) => {
    filters.brand = e.target.value || null;
    applyFiltersAndRender();
  });
  document.getElementById("status-select").addEventListener("change", (e) => {
    filters.status = e.target.value || null;
    applyFiltersAndRender();
  });
  document
    .getElementById("screenshot-toggle-btn")
    .addEventListener("click", toggleScreenshotList);
  if (hasActiveFilter) {
    document
      .getElementById("clear-filters-btn")
      .addEventListener("click", clearFilters);
  }
}

function renderTestResults() {
  const container = document.getElementById("test-results-container");
  if (!container) return;

  if (filteredData.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 2rem;">No test results match the current filters.</p>`;
    return;
  }

  container.innerHTML = `
        <div class="column-labels">
            <span>Test Name</span> <span>Brand</span> <span>Device</span> 
            <span>Difference Image</span> <span>Test Status</span>
        </div>
        ${filteredData
          .map(
            (test, idx) => `
            <div class="test-card-row" data-idx="${idx}">
                <div>${test.name}</div>
                <div>${test.brand || "N/A"}</div>
                <div>${test.device}</div>
                <div>
                    ${
                      test.status === "failed"
                        ? `<button class="view-image-btn" data-url="${test.imageUrl}">View Image</button>`
                        : ""
                    }
                </div>
                <div style="color: ${
                  test.status === "passed"
                    ? "var(--success-color)"
                    : "var(--error-color)"
                }; font-weight: bold; text-transform: capitalize;">${
              test.status
            }</div>
            </div>
        `
          )
          .join("")}
    `;

  document.querySelectorAll(".view-image-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      uiState.modalImage = e.target.dataset.url;
      renderModal();
    });
  });
}

function toggleScreenshotList() {
  uiState.showScreenshots = !uiState.showScreenshots;
  if (uiState.showScreenshots) {
    fetchScreenshotList();
  }
  renderFilters();
  renderScreenshotList();
}

function renderScreenshotList() {
  const container = document.getElementById("screenshot-list-container");
  if (!container) return;

  if (!uiState.showScreenshots) {
    container.innerHTML = "";
    return;
  }

  if (uiState.loadingScreenshots) {
    container.innerHTML = `<div style="text-align: center; padding: 2rem;">Loading screenshot paths...</div>`;
    return;
  }

  if (screenshotPaths.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 2rem;">No screenshot paths available! Seems like the baseline screenshots have already been uploaded.</div>`;
    return;
  }

  const groupedPaths = screenshotPaths.reduce((acc, path) => {
    const device = path.split("/")[2] || "unknown";
    if (!acc[device]) acc[device] = [];
    acc[device].push(path);
    return acc;
  }, {});

  container.innerHTML = `
        <div class="screenshot-wrapper">
            <h2 class="screenshot-title">📸 Baseline Screenshot Collection</h2>
            ${Object.entries(groupedPaths)
              .map(
                ([device, paths]) => `
                <div class="screenshot-section">
                    <h3 class="device-title">${device} Screenshots</h3>
                    <div class="screenshot-grid">
                        ${paths
                          .map((path) => {
                            const fileName = path.split("/").pop();
                            const fullUrl = `https://fusion-networks-qa-dev.s3.eu-west-2.amazonaws.com/Visual-test-images/${path}`;
                            return `
                                <div class="screenshot-card">
                                    <div class="card-header">
                                        <div class="file-name">${fileName}</div>
                                        <div class="file-path">${path}</div>
                                    </div>
                                    <a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="screenshot-button">🔗 Open Screenshot</a>
                                </div>
                            `;
                          })
                          .join("")}
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

function renderModal() {
  const container = document.getElementById("image-modal-container");
  if (!container) return;

  if (!uiState.modalImage) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
        <div class="modal" onclick="closeModal()">
            <div class="modal__window" onclick="event.stopPropagation()">
                <h2 class="modal__title">
                    <span>Screenshot</span>
                    <span class="modal__close" onclick="closeModal()" style="cursor:pointer;">✖</span>
                </h2>
                <div class="modal__content">
                    <img class="attachment__media" src="${uiState.modalImage}" alt="Screenshot" loading="lazy">
                </div>
                <div class="modal__actions">
                    <button onclick="window.open('${uiState.modalImage}', '_blank')">Open in New Tab</button>
                </div>
            </div>
        </div>
    `;
}

window.closeModal = function () {
  uiState.modalImage = null;
  renderModal();
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", fetchData);
