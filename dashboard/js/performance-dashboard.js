// js/performance-dashboard.js

// --- GLOBAL STATE ---
let allData = [];
let latestData = [];
let filteredData = []; // Data after global filters are applied
let filters = {
  searchQuery: "",
  uriFilter: "",
  productFilter: "",
  deviceFilter: "",
  startDate: null,
  endDate: null,
};
let availableFilters = {
  uris: [],
  products: [],
  devices: [],
};
let activeMetricsTab = "performance";
let metricChartSortConfig = { key: "score", order: "asc" };

// --- DATA FETCHING ---
async function fetchData() {
  try {
    const response = await fetch(
      "https://moonlit-pastelito.netlify.app/api/lighthouse/data"
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    allData = data;

    const latestByScenario = Object.values(
      data.reduce((acc, curr) => {
        if (
          !acc[curr.test_name] ||
          new Date(curr.created_at) > new Date(acc[curr.test_name].created_at)
        ) {
          acc[curr.test_name] = curr;
        }
        return acc;
      }, {})
    );
    latestData = latestByScenario;

    availableFilters.uris = [
      ...new Set(allData.map((d) => d.url || d.uri || "").filter(Boolean)),
    ].sort();
    availableFilters.products = [
      ...new Set(
        allData.map((d) => d.brand || d.product || "").filter(Boolean)
      ),
    ].sort();
    availableFilters.devices = [
      ...new Set(
        allData
          .flatMap((d) =>
            Array.isArray(d.tags)
              ? d.tags
              : d.device_type
              ? [d.device_type]
              : []
          )
          .filter(Boolean)
      ),
    ].sort();

    applyFiltersAndRender();
    hideLoading();
  } catch (error) {
    console.error("Error fetching data:", error);
    hideLoading();
    document.getElementById(
      "main-content"
    ).innerHTML = `<p style="color: red; text-align: center;">Failed to load data.</p>`;
  }
}

// --- FILTERING & RENDERING ---
// Make this function globally accessible for theme changes
window.applyFiltersAndRender = function () {
  filteredData = allData.filter((item) => {
    const searchLower = filters.searchQuery.toLowerCase();
    const matchesSearch =
      !filters.searchQuery ||
      Object.values(item).some(
        (value) => value && String(value).toLowerCase().includes(searchLower)
      );
    const itemURI = item.url || item.uri || "";
    const matchesURI = !filters.uriFilter || itemURI === filters.uriFilter;
    const itemProduct = item.brand || item.product || "";
    const matchesProduct =
      !filters.productFilter || itemProduct === filters.productFilter;
    const itemDevices = Array.isArray(item.tags)
      ? item.tags
      : item.device_type
      ? [item.device_type]
      : [];
    const matchesDevice =
      !filters.deviceFilter || itemDevices.includes(filters.deviceFilter);
    const itemDate = new Date(item.created_at);
    const matchesStartDate =
      !filters.startDate || itemDate >= new Date(filters.startDate);
    const matchesEndDate =
      !filters.endDate ||
      itemDate <= new Date(endDateWithTime(filters.endDate));

    return (
      matchesSearch &&
      matchesURI &&
      matchesProduct &&
      matchesDevice &&
      matchesStartDate &&
      matchesEndDate
    );
  });
  renderAllComponents();
};

function renderAllComponents() {
  renderKPICards();
  renderGlobalFilters();
  renderDateFilter();
  renderMetricsContainer();
  renderDataTable();
}

function endDateWithTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date;
}

// --- HELPER FUNCTIONS ---
function getScoreColor(score) {
  score = parseFloat(score);
  if (score >= 90) return currentTheme === "light" ? "#16a34a" : "#22c55e";
  if (score >= 70) return currentTheme === "light" ? "#2563eb" : "#3b82f6";
  if (score >= 50) return currentTheme === "light" ? "#f97316" : "#fb923c";
  return currentTheme === "light" ? "#dc2626" : "#ef4444";
}

function generateS3PerformanceReportUrl(testName = "") {
  if (!testName || typeof testName !== "string") return "#";
  let basePath;
  if (testName.startsWith("Authorized")) {
    basePath = "performance-report/Authorized-performance-reports";
  } else {
    basePath = "performance-report/Unauthorized-performance-reports";
  }
  const deviceType = testName.includes("Mobile")
    ? "Mobile"
    : testName.includes("Tablet")
    ? "Tablet"
    : "Desktop";
  const sanitizedTestName = testName.replace(/[^a-zA-Z0-9+_-]/g, (match) =>
    match === " " ? "%20" : ""
  );
  return `https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/${basePath}/${deviceType}/${sanitizedTestName}.html`;
  
}

// --- COMPONENT RENDERERS ---

function renderKPICards() {
  const container = document.getElementById("kpi-cards-container");
  if (!container) return;
  if (!filteredData || filteredData.length === 0) {
    container.innerHTML = "";
    return;
  }
  const scenarioGroups = filteredData.reduce((acc, item) => {
    (acc[item.test_name] = acc[item.test_name] || []).push(item);
    return acc;
  }, {});
  const latestEntries = Object.values(scenarioGroups).map((group) =>
    group.reduce((latest, current) =>
      !latest || new Date(current.created_at) > new Date(latest.created_at)
        ? current
        : latest
    )
  );
  const totals = latestEntries.reduce(
    (acc, item) => ({
      performance: acc.performance + parseFloat(item.performance || 0),
      seo: acc.seo + parseFloat(item.seo || 0),
      accessibility: acc.accessibility + parseFloat(item.accessibility || 0),
      bestPractices: acc.bestPractices + parseFloat(item.best_practice || 0),
      count: acc.count + 1,
    }),
    { performance: 0, seo: 0, accessibility: 0, bestPractices: 0, count: 0 }
  );
  const count = totals.count || 1;
  const averages = {
    performance: (totals.performance / count).toFixed(1),
    seo: (totals.seo / count).toFixed(1),
    accessibility: (totals.accessibility / count).toFixed(1),
    bestPractices: (totals.bestPractices / count).toFixed(1),
  };
  const cards = [
    { title: "Performance", score: averages.performance, icon: "⚡" },
    { title: "SEO", score: averages.seo, icon: "🔍" },
    { title: "Accessibility", score: averages.accessibility, icon: "♿" },
    { title: "Best Practices", score: averages.bestPractices, icon: "✨" },
  ];
  container.innerHTML = `<div class="cards-grid">${cards
    .map(
      (card) => `
        <div class="info-card">
            <div class="info-card-icon">${card.icon}</div>
            <div>
                <h3 class="info-card-title">${card.title}</h3>
                <p class="info-card-value" style="color: ${getScoreColor(
                  card.score
                )}">${card.score}%</p>
            </div>
        </div>`
    )
    .join("")}</div>`;
}

function renderGlobalFilters() {
  const container = document.getElementById("global-filters");
  if (!container) return;
  const renderOptions = (options, placeholder) => {
    if (options.length === 0)
      return `<option value="" disabled>No data</option>`;
    return (
      `<option value="">${placeholder}</option>` +
      options.map((o) => `<option value="${o}">${o}</option>`).join("")
    );
  };
  container.innerHTML = `
        <div style="background-color: var(--bg-secondary); border-radius: 8px; box-shadow: var(--shadow); padding: 16px; display: flex; flex-direction: column; gap: 16px;">
             <div style="display: flex; justify-content: flex-end;">
                <button id="clear-all-filters-btn" style="padding: 8px 20px; border-radius: 6px; border: none; background-color: var(--error-color); color: white; cursor: pointer; transition: background-color 0.2s ease;">
                    Clear All Filters
                </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                <input type="text" id="search-input" value="${
                  filters.searchQuery
                }" placeholder="Search..." style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary); color: var(--text-primary);">
                <select id="uri-filter" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary); color: var(--text-primary);">${renderOptions(
                  availableFilters.uris,
                  "All URIs"
                )}</select>
                <select id="product-filter" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary); color: var(--text-primary);">${renderOptions(
                  availableFilters.products,
                  "All Products"
                )}</select>
                <select id="device-filter" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary); color: var(--text-primary);">${renderOptions(
                  availableFilters.devices,
                  "All Devices"
                )}</select>
            </div>
        </div>
    `;
  document.getElementById("uri-filter").value = filters.uriFilter;
  document.getElementById("product-filter").value = filters.productFilter;
  document.getElementById("device-filter").value = filters.deviceFilter;
  document.getElementById("search-input").addEventListener("input", (e) => {
    filters.searchQuery = e.target.value;
    applyFiltersAndRender();
  });
  document.getElementById("uri-filter").addEventListener("change", (e) => {
    filters.uriFilter = e.target.value;
    applyFiltersAndRender();
  });
  document.getElementById("product-filter").addEventListener("change", (e) => {
    filters.productFilter = e.target.value;
    applyFiltersAndRender();
  });
  document.getElementById("device-filter").addEventListener("change", (e) => {
    filters.deviceFilter = e.target.value;
    applyFiltersAndRender();
  });
  document
    .getElementById("clear-all-filters-btn")
    .addEventListener("click", () => {
      filters.searchQuery = "";
      filters.uriFilter = "";
      filters.productFilter = "";
      filters.deviceFilter = "";
      applyFiltersAndRender();
    });
}

function renderDateFilter() {
  const container = document.getElementById("date-filter-container");
  if (!container) return;
  container.innerHTML = `
        <div style="display: flex; gap: 12px; align-items: flex-end; justify-content: flex-end; padding: 0 20px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label for="start-date" style="font-size: 12px; color: var(--text-secondary);">Start Date</label>
                <input id="start-date" type="date" value="${
                  filters.startDate || ""
                }" style="padding: 6px 8px; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--bg-secondary); color: var(--text-primary);">
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label for="end-date" style="font-size: 12px; color: var(--text-secondary);">End Date</label>
                <input id="end-date" type="date" value="${
                  filters.endDate || ""
                }" style="padding: 6px 8px; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--bg-secondary); color: var(--text-primary);">
            </div>
            <button id="clear-date-btn" style="padding: 6px 12px; border-radius: 4px; border: none; background-color: var(--bg-tertiary); color: var(--text-primary); cursor: pointer;">Clear</button>
        </div>
    `;
  document.getElementById("start-date").addEventListener("change", (e) => {
    filters.startDate = e.target.value;
    applyFiltersAndRender();
  });
  document.getElementById("end-date").addEventListener("change", (e) => {
    filters.endDate = e.target.value;
    applyFiltersAndRender();
  });
  document.getElementById("clear-date-btn").addEventListener("click", () => {
    filters.startDate = null;
    filters.endDate = null;
    applyFiltersAndRender();
  });
}

function renderMetricsContainer() {
  const container = document.getElementById("metrics-container");
  if (!container) return;
  const tabs = [
    { id: "performance", label: "Performance" },
    { id: "seo", label: "SEO" },
    { id: "accessibility", label: "Accessibility" },
    { id: "bestPractices", label: "Best Practices" },
  ];
  container.innerHTML = `<div class="tabs-container">${tabs
    .map(
      (tab) =>
        `<button class="tab-btn ${
          activeMetricsTab === tab.id ? "active" : ""
        }" data-tab="${tab.id}">${tab.label}</button>`
    )
    .join("")}</div><div id="chart-content"></div>`;
  document.querySelectorAll(".tab-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      activeMetricsTab = btn.dataset.tab;
      metricChartSortConfig = { key: "score", order: "asc" };
      renderMetricsContainer();
    })
  );
  renderMetricChart();
}

function renderMetricChart() {
  const container = document.getElementById("chart-content");
  if (!container) return;

  const metricKeyMap = {
    performance: "performance",
    seo: "seo",
    accessibility: "accessibility",
    bestPractices: "best_practice",
  };
  const metricKey = metricKeyMap[activeMetricsTab];

  if (!filteredData || filteredData.length === 0) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center;">No data to display for this metric.</div>`;
    return;
  }

  const grouped = filteredData.reduce((acc, item) => {
    (acc[item.test_name] = acc[item.test_name] || []).push(item);
    return acc;
  }, {});

  let processedScenarios = Object.entries(grouped).map(
    ([test_name, entries]) => {
      const sorted = entries
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(-3);
      const scores = sorted.map((item) => parseFloat(item[metricKey]) || 0);
      const currentScore = scores.length > 0 ? scores[scores.length - 1] : 0;
      const previousScore =
        scores.length > 1 ? scores[scores.length - 2] : currentScore;
      const trend = currentScore - previousScore;
      return { test_name, entries: sorted, currentScore, trend };
    }
  );

  const sortScenarios = () => {
    const { key, order } = metricChartSortConfig;
    const multiplier = order === "asc" ? 1 : -1;
    processedScenarios.sort((a, b) => {
      const valA = key === "score" ? a.currentScore : a.trend;
      const valB = key === "score" ? b.currentScore : b.trend;
      return (valA - valB) * multiplier;
    });
  };
  sortScenarios();

  const sparklineOptions = (scenarioData) => ({
    chart: {
      type: "line",
      height: 30,
      width: 80,
      backgroundColor: "transparent",
      margin: [2, 0, 2, 0],
    },
    title: null,
    credits: { enabled: false },
    xAxis: { visible: false },
    yAxis: { visible: false },
    legend: { enabled: false },
    plotOptions: {
      series: {
        animation: false,
        lineWidth: 2,
        marker: { enabled: true, radius: 3 },
      },
    },
    tooltip: {
      outside: true, // IMPORTANT: Allows tooltip to render outside the chart's container
      useHTML: true,
      backgroundColor: "rgba(0,0,0,0)",
      borderWidth: 0,
      shadow: false,
      formatter: function () {
        const pointIndex = this.point.index;
        const entry = scenarioData.entries[pointIndex];
        // This self-contained div is the new tooltip with a defined width
        return `
                  <div style="
                    padding: 10px; 
                    width: 280px; 
                    background-color: var(--bg-secondary); 
                    border-radius: 6px; 
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-lg);
                  ">
                    <div style="font-weight: 600; margin-bottom: 8px; white-space: normal; color: var(--text-primary); font-size: 0.9rem;">
                      ${scenarioData.test_name}
                    </div>
                    <div style="color: var(--text-primary); font-size: 0.9rem;">
                      <span style="color:${
                        this.color
                      }; font-size: 1.2em; vertical-align: middle;">●</span>
                      Run ${pointIndex + 1}: <b>${this.y.toFixed(1)}%</b>
                    </div>
                    <div style="font-size: 0.8em; color: var(--text-secondary); margin-top: 5px;">
                      ${new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                `;
      },
    },
    series: [
      {
        data: scenarioData.entries.map((e) => parseFloat(e[metricKey] || 0)),
        color: getScoreColor(scenarioData.currentScore),
      },
    ],
  });

  const renderCards = () => {
    const getColumnCount = () => {
      if (window.innerWidth < 768) return 1;
      if (window.innerWidth < 1200) return 2;
      return processedScenarios.length <= 4
        ? 1
        : processedScenarios.length <= 9
        ? 2
        : 3;
    };
    const columns = getColumnCount();
    const isSmallScreen = window.innerWidth < 768;

    const scenariosPerColumn = Math.ceil(processedScenarios.length / columns);

    let columnsHtml = "";
    for (let i = 0; i < columns; i++) {
      const columnScenarios = processedScenarios.slice(
        i * scenariosPerColumn,
        (i + 1) * scenariosPerColumn
      );
      columnsHtml += `
            <div class="chart-column">
                <div class="chart-column-header" style="grid-template-columns: ${
                  isSmallScreen ? "minmax(0, 1fr) auto" : "3fr 80px 120px"
                };">
                    <div>Page</div>
                    <div style="text-align: right;">${
                      isSmallScreen ? "Score/Trend" : "Latest Score"
                    }</div>
                    ${
                      !isSmallScreen
                        ? `<div style="text-align: right;">Trend</div>`
                        : ""
                    }
                </div>
                ${columnScenarios
                  .map(
                    (d) => `
                <div class="chart-card-row" style="grid-template-columns: ${
                  isSmallScreen ? "minmax(0, 1fr) auto" : "3fr 80px 120px"
                }; background-color: ${
                      d.currentScore < 70
                        ? currentTheme === "light"
                          ? "rgba(239, 68, 68, 0.05)"
                          : "rgba(239, 68, 68, 0.1)"
                        : "transparent"
                    }">
                    <div class="scenario-name">${d.test_name}</div>
                    <div class="score" style="color: ${getScoreColor(
                      d.currentScore
                    )};">${d.currentScore.toFixed(0)}%</div>
                    <div class="trend" id="sparkline-${d.test_name.replace(
                      /[^a-zA-Z0-9]/g,
                      ""
                    )}"></div>
                </div>`
                  )
                  .join("")}
            </div>`;
    }
    document.getElementById(
      "metric-cards-container"
    ).innerHTML = `<div class="chart-columns-container" style="grid-template-columns: repeat(${columns}, 1fr);">${columnsHtml}</div>`;

    processedScenarios.forEach((d) => {
      const sparklineId = `sparkline-${d.test_name.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}`;
      const el = document.getElementById(sparklineId);
      if (el) {
        const trendValue = document.createElement("div");
        trendValue.className = "trend-value";
        trendValue.style.color =
          d.trend >= 0 ? getScoreColor(95) : getScoreColor(40);
        trendValue.innerHTML = `${
          d.trend > 0 ? "↑" : d.trend < 0 ? "↓" : "→"
        } ${Math.abs(d.trend).toFixed(1)}%`;

        if (isSmallScreen) {
          const scoreEl = el.previousElementSibling;
          scoreEl.innerHTML += ` / <span style="color: ${trendValue.style.color};">${trendValue.innerHTML}</span>`;
          el.remove();
        } else {
          Highcharts.chart(el, sparklineOptions(d));
          el.appendChild(trendValue);
        }
      }
    });
  };

  container.innerHTML = `
        <div class="chart-sort-controls">
            <div class="sort-button-group">
                <span>Sort by:</span>
                <div class="buttons">
                    <button class="sort-button" data-key="score" data-order="asc">Lowest Score</button>
                    <button class="sort-button" data-key="score" data-order="desc">Highest Score</button>
                    <button class="sort-button" data-key="trend" data-order="asc">Most Declining</button>
                    <button class="sort-button" data-key="trend" data-order="desc">Most Improving</button>
                </div>
            </div>
        </div>
        <div id="metric-cards-container"></div>
    `;

  document.querySelectorAll(".sort-button").forEach((button) => {
    if (
      button.dataset.key === metricChartSortConfig.key &&
      button.dataset.order === metricChartSortConfig.order
    ) {
      button.classList.add("active");
    }
    button.addEventListener("click", (e) => {
      metricChartSortConfig = {
        key: e.currentTarget.dataset.key,
        order: e.currentTarget.dataset.order,
      };
      document
        .querySelectorAll(".sort-button")
        .forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      sortScenarios();
      renderCards();
    });
  });

  renderCards();
  window.addEventListener("resize", renderCards);
}

function renderDataTable() {
  const container = document.getElementById("data-table-container");
  if (!container) return;

  let tableState = {
    showLatest: false,
    deviceFilter: "All",
    brandFilter: "All",
    currentPage: 1,
    rowsPerPage: 10,
  };

  const deviceTypes = [...new Set(allData.map((d) => d.device_type))];
  const brandTypes = [...new Set(allData.map((d) => d.brand))];

  const renderTable = () => {
    let dataForTable = tableState.showLatest ? latestData : filteredData;
    if (tableState.deviceFilter !== "All")
      dataForTable = dataForTable.filter(
        (d) => d.device_type === tableState.deviceFilter
      );
    if (tableState.brandFilter !== "All")
      dataForTable = dataForTable.filter(
        (d) => d.brand === tableState.brandFilter
      );

    const totalPages = Math.ceil(dataForTable.length / tableState.rowsPerPage);
    tableState.currentPage = Math.min(tableState.currentPage, totalPages || 1);
    const start = (tableState.currentPage - 1) * tableState.rowsPerPage;
    const end = start + tableState.rowsPerPage;
    const paginatedData = dataForTable.slice(start, end);
    const formatDate = (ds) => new Date(ds).toLocaleString();

    container.innerHTML = `
            <div class="card data-table-container">
                <div style="padding: 20px;">
                    <h2 style="color: var(--text-primary); margin: 0 0 20px 0;">All Performance Test Results</h2>
                    <div class="data-table-filters">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="latest-run-check" ${
                              tableState.showLatest ? "checked" : ""
                            } style="width: 16px; height: 16px;">
                            Latest Run Result
                        </label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label for="table-device-filter">Device:</label>
                            <select id="table-device-filter" style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-secondary); color: var(--text-primary); cursor: pointer;">
                                <option value="All">All Devices</option>
                                ${deviceTypes
                                  .map(
                                    (d) =>
                                      `<option value="${d}" ${
                                        tableState.deviceFilter === d
                                          ? "selected"
                                          : ""
                                      }>${d}</option>`
                                  )
                                  .join("")}
                            </select>
                        </div>
                         <div style="display: flex; align-items: center; gap: 8px;">
                            <label for="table-brand-filter">Brand:</label>
                            <select id="table-brand-filter" style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-secondary); color: var(--text-primary); cursor: pointer;">
                                <option value="All">All Brands</option>
                                ${brandTypes
                                  .map(
                                    (b) =>
                                      `<option value="${b}" ${
                                        tableState.brandFilter === b
                                          ? "selected"
                                          : ""
                                      }>${b}</option>`
                                  )
                                  .join("")}
                            </select>
                        </div>
                    </div>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Test Name</th> <th>Device Type</th> <th>Performance</th> <th>Accessibility</th>
                                    <th>SEO</th> <th>Best Practice</th> <th>Date</th> <th>URL</th> <th>Brand</th>
                                    ${
                                      tableState.showLatest
                                        ? "<th>Report Link</th>"
                                        : ""
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                ${paginatedData
                                  .map(
                                    (d) => `
                                    <tr>
                                        <td>${d.test_name}</td>
                                        <td>${d.device_type}</td>
                                        <td>${d.performance.toFixed(1)}</td>
                                        <td>${d.accessibility.toFixed(1)}</td>
                                        <td>${d.seo.toFixed(1)}</td>
                                        <td>${d.best_practice.toFixed(1)}</td>
                                        <td>${formatDate(d.created_at)}</td>
                                        <td>${d.url}</td>
                                        <td>${d.brand}</td>
                                        ${
                                          tableState.showLatest
                                            ? `<td><a href="${generateS3PerformanceReportUrl(
                                                d.test_name
                                              )}" target="_blank" rel="noopener noreferrer" style="color: var(--link-color);">View Report</a></td>`
                                            : ""
                                        }
                                    </tr>
                                `
                                  )
                                  .join("")}
                                ${
                                  paginatedData.length === 0
                                    ? `<tr><td colspan="${
                                        tableState.showLatest ? 10 : 9
                                      }" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No results found.</td></tr>`
                                    : ""
                                }
                            </tbody>
                        </table>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; color: var(--text-secondary); font-size: 14px; flex-wrap: wrap; gap: 1rem;">
                        <div>Showing ${
                          dataForTable.length > 0 ? start + 1 : 0
                        } - ${Math.min(end, dataForTable.length)} of ${
      dataForTable.length
    } results</div>
                        <div class="pagination-controls" id="pagination"></div>
                    </div>
                </div>
            </div>`;

    renderPagination(totalPages, tableState.currentPage, (newPage) => {
      tableState.currentPage = newPage;
      renderTable();
    });

    document
      .getElementById("latest-run-check")
      .addEventListener("change", (e) => {
        tableState.showLatest = e.target.checked;
        tableState.currentPage = 1;
        renderTable();
      });
    document
      .getElementById("table-device-filter")
      .addEventListener("change", (e) => {
        tableState.deviceFilter = e.target.value;
        tableState.currentPage = 1;
        renderTable();
      });
    document
      .getElementById("table-brand-filter")
      .addEventListener("change", (e) => {
        tableState.brandFilter = e.target.value;
        tableState.currentPage = 1;
        renderTable();
      });
  };
  renderTable();
}

function renderPagination(totalPages, currentPage, onPageChange) {
  const container = document.getElementById("pagination");
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = "";
    return;
  }
  const maxVisiblePages = 4;
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let end = start + maxVisiblePages - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxVisiblePages + 1, 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  const visiblePages = getVisiblePages();
  const showFirstLast = totalPages > maxVisiblePages;
  container.innerHTML = `
        ${
          showFirstLast
            ? `<button class="page-btn-first" ${
                currentPage === 1 ? "disabled" : ""
              }>⟪</button>`
            : ""
        }
        <button class="page-btn-prev" ${
          currentPage === 1 ? "disabled" : ""
        }>⟨</button>
        ${visiblePages
          .map(
            (num) =>
              `<button class="page-btn ${
                num === currentPage ? "active" : ""
              }" data-page="${num}">${num}</button>`
          )
          .join("")}
        <button class="page-btn-next" ${
          currentPage === totalPages ? "disabled" : ""
        }>⟩</button>
        ${
          showFirstLast
            ? `<button class="page-btn-last" ${
                currentPage === totalPages ? "disabled" : ""
              }>⟫</button>`
            : ""
        }
    `;
  container
    .querySelectorAll(".page-btn[data-page]")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        onPageChange(parseInt(e.target.dataset.page))
      )
    );
  if (showFirstLast) {
    container
      .querySelector(".page-btn-first")
      .addEventListener("click", () => onPageChange(1));
    container
      .querySelector(".page-btn-last")
      .addEventListener("click", () => onPageChange(totalPages));
  }
  container
    .querySelector(".page-btn-prev")
    .addEventListener("click", () => onPageChange(currentPage - 1));
  container
    .querySelector(".page-btn-next")
    .addEventListener("click", () => onPageChange(currentPage + 1));
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", fetchData);
