let allData = []; // Store all data for filtering
let horizontalBarChart, seoChart, accessibilityChart, bestPracticeChart; // Store chart instances
let currentPage = 1; // Current page for pagination
const rowsPerPage = 10; // Number of rows per page
Chart.register(ChartDataLabels);

// Update Pagination
function updatePagination(totalPages) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = ""; // Clear existing buttons

  const maxVisiblePages = 5; // Number of visible pages around the current page
  const ellipsisThreshold = 2; // Show ellipsis if pages are skipped

  // Function to create a pagination button
  function createPageButton(page, isActive = false) {
    const button = document.createElement("button");
    button.innerText = page;
    button.classList.add("pagination-button");
    if (isActive) {
      button.classList.add("active");
    }
    button.addEventListener("click", () => {
      currentPage = page;
      updateTable(allData);
      updatePagination(totalPages);
    });
    return button;
  }

  // Always show the first page
  pagination.appendChild(createPageButton(1, currentPage === 1));

  // Show ellipsis if current page is far from the first page
  if (currentPage > ellipsisThreshold + 1) {
    const ellipsis = document.createElement("span");
    ellipsis.innerText = "...";
    pagination.appendChild(ellipsis);
  }

  // Show pages around the current page
  const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(
    totalPages - 1,
    currentPage + Math.floor(maxVisiblePages / 2)
  );

  for (let i = startPage; i <= endPage; i++) {
    pagination.appendChild(createPageButton(i, i === currentPage));
  }

  // Show ellipsis if current page is far from the last page
  if (currentPage < totalPages - ellipsisThreshold) {
    const ellipsis = document.createElement("span");
    ellipsis.innerText = "...";
    pagination.appendChild(ellipsis);
  }

  // Always show the last page
  if (totalPages > 1) {
    pagination.appendChild(
      createPageButton(totalPages, currentPage === totalPages)
    );
  }
}

// Dark/Light Mode Toggle
function toggleTheme() {
  const body = document.body;
  body.classList.toggle("light-mode");
  const icon = document.querySelector(".theme-toggle i");
  if (body.classList.contains("light-mode")) {
    icon.classList.replace("fa-moon", "fa-sun");
    body.style.backgroundColor = "#f4f4f4";
    body.style.color = "#333";
  } else {
    icon.classList.replace("fa-sun", "fa-moon");
    body.style.backgroundColor = "#1e1e2e";
    body.style.color = "#fff";
  }
  // Update Chart Data Labels color when theme is toggled
  [horizontalBarChart, seoChart, accessibilityChart, bestPracticeChart].forEach(
    (chart) => {
      if (chart) {
        chart.options.plugins.datalabels.color =
          document.body.classList.contains("light-mode") ? "#333" : "#fff";
        chart.update();
      }
    }
  );
}

// Fetch Data and Update Dashboard
async function fetchData() {
  try {
    const response = await fetch(
      "https://playwright-lighthouse-performance-testing.onrender.com/api/data"
    );
    allData = await response.json();
    updateDashboard(allData);
    populateDeviceFilter(allData);
    populateSeoDeviceFilter(allData);
    populateAccessibilityDeviceFilter(allData);
    populateBestPracticeDeviceFilter(allData);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    document.getElementById("loading").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
  }
}

// Populate Device Filter Options for Performance Chart
function populateDeviceFilter(data) {
  const deviceTypes = [...new Set(data.map((d) => d.device_type))];
  const filter = document.getElementById("deviceFilter");
  deviceTypes.forEach((device) => {
    const option = document.createElement("option");
    option.value = device;
    option.textContent = device;
    filter.appendChild(option);
  });
}

// Populate Device Filter Options for SEO Chart
function populateSeoDeviceFilter(data) {
  const deviceTypes = [...new Set(data.map((d) => d.device_type))];
  const filter = document.getElementById("seoDeviceFilter");
  deviceTypes.forEach((device) => {
    const option = document.createElement("option");
    option.value = device;
    option.textContent = device;
    filter.appendChild(option);
  });
}

// Populate Device Filter Options for Accessibility Chart
function populateAccessibilityDeviceFilter(data) {
  const deviceTypes = [...new Set(data.map((d) => d.device_type))];
  const filter = document.getElementById("accessibilityDeviceFilter");
  deviceTypes.forEach((device) => {
    const option = document.createElement("option");
    option.value = device;
    option.textContent = device;
    filter.appendChild(option);
  });
}

// Populate Device Filter Options for Best Practices Chart
function populateBestPracticeDeviceFilter(data) {
  const deviceTypes = [...new Set(data.map((d) => d.device_type))];
  const filter = document.getElementById("bestPracticeDeviceFilter");
  deviceTypes.forEach((device) => {
    const option = document.createElement("option");
    option.value = device;
    option.textContent = device;
    filter.appendChild(option);
  });
}

// Apply Filters for Performance Chart
function applyFilters() {
  const selectedDevice = document.getElementById("deviceFilter").value;
  const selectedPerformance =
    document.getElementById("performanceFilter").value;

  console.log("Selected Device:", selectedDevice);
  console.log("Selected Performance Range:", selectedPerformance);

  let filteredData = allData;

  // Filter by Device
  if (selectedDevice !== "All") {
    filteredData = filteredData.filter((d) => d.device_type === selectedDevice);
    console.log("Data after device filter:", filteredData);
  }

  // Filter by Performance
  if (selectedPerformance !== "All") {
    let [min, max] = selectedPerformance.split("-").map(Number);

    // Swap min and max if the range is descending (e.g., 100-80)
    if (min > max) {
      [min, max] = [max, min]; // Swap values
    }

    console.log(`Filtering by performance: ${min} - ${max}`);
    filteredData = filteredData.filter((d) => {
      console.log(`Checking performance: ${d.performance}`);
      return d.performance >= min && d.performance <= max;
    });
    console.log("Data after performance filter:", filteredData);
  }

  console.log("Final Filtered Data:", filteredData);
  updatePerformanceChart(filteredData);
}

// Apply Filters for SEO Chart
function applySeoFilters() {
  const selectedDevice = document.getElementById("seoDeviceFilter").value;
  const selectedSeo = document.getElementById("seoFilter").value;

  let filteredData = allData;

  // Filter by Device
  if (selectedDevice !== "All") {
    filteredData = filteredData.filter((d) => d.device_type === selectedDevice);
  }

  // Filter by SEO
  if (selectedSeo !== "All") {
    let [min, max] = selectedSeo.split("-").map(Number);

    // Swap min and max if the range is descending (e.g., 100-80)
    if (min > max) {
      [min, max] = [max, min]; // Swap values
    }

    console.log(`Filtering by SEO: ${min} - ${max}`);
    filteredData = filteredData.filter((d) => {
      console.log(`Checking SEO: ${d.seo}`);
      return d.seo >= min && d.seo <= max;
    });
  }

  console.log("Filtered Data:", filteredData);
  updateSeoChart(filteredData);
}

// Apply Filters for Accessibility Chart
function applyAccessibilityFilters() {
  const selectedDevice = document.getElementById(
    "accessibilityDeviceFilter"
  ).value;
  const selectedAccessibility = document.getElementById(
    "accessibilityFilter"
  ).value;

  let filteredData = allData;

  // Filter by Device
  if (selectedDevice !== "All") {
    filteredData = filteredData.filter((d) => d.device_type === selectedDevice);
  }

  // Filter by Accessibility
  if (selectedAccessibility !== "All") {
    let [min, max] = selectedAccessibility.split("-").map(Number);

    // Swap min and max if the range is descending (e.g., 100-80)
    if (min > max) {
      [min, max] = [max, min]; // Swap values
    }

    console.log(`Filtering by Accessibility: ${min} - ${max}`);
    filteredData = filteredData.filter((d) => {
      console.log(`Checking Accessibility: ${d.accessibility}`);
      return d.accessibility >= min && d.accessibility <= max;
    });
  }

  console.log("Filtered Data:", filteredData);
  updateAccessibilityChart(filteredData);
}

// Apply Filters for Best Practices Chart
function applyBestPracticeFilters() {
  const selectedDevice = document.getElementById(
    "bestPracticeDeviceFilter"
  ).value;
  const selectedBestPractice =
    document.getElementById("bestPracticeFilter").value;

  let filteredData = allData;

  // Filter by Device
  if (selectedDevice !== "All") {
    filteredData = filteredData.filter((d) => d.device_type === selectedDevice);
  }

  // Filter by Best Practice
  if (selectedBestPractice !== "All") {
    let [min, max] = selectedBestPractice.split("-").map(Number);

    // Swap min and max if the range is descending (e.g., 100-80)
    if (min > max) {
      [min, max] = [max, min]; // Swap values
    }

    console.log(`Filtering by Best Practice: ${min} - ${max}`);
    filteredData = filteredData.filter((d) => {
      console.log(`Checking Best Practice: ${d.best_practice}`);
      return d.best_practice >= min && d.best_practice <= max;
    });
  }

  console.log("Filtered Data:", filteredData);
  updateBestPracticeChart(filteredData);
}

// Update Horizontal Bar Chart for Performance
function updatePerformanceChart(data) {
  // Sort data by created_at in descending order (latest first)
  data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const latestTests = {};
  data.forEach((d) => {
    if (!latestTests[d.test_name]) latestTests[d.test_name] = [];
    latestTests[d.test_name].push(d); // Push all runs for the test
  });

  // For each test, keep only the latest 3 runs
  for (const testName in latestTests) {
    if (latestTests[testName].length > 3) {
      latestTests[testName] = latestTests[testName].slice(0, 3).reverse(); // Keep only the latest 3 runs
    }
  }

  const testNames = Object.keys(latestTests);
  const barData = testNames.map(
    (test) => latestTests[test][latestTests[test].length - 1].performance
  );
  const tooltipData = testNames.map((test) =>
    latestTests[test].map((run) => run.performance)
  );

  // Dynamic Bar Colors
  const barColors = barData.map((score) => {
    if (score > 80) return "rgb(0, 190, 0)"; // Green
    if (score >= 50 && score <= 80) return "rgba(255, 159, 64, 0.8)"; // Orange
    return "rgb(190, 0, 0)"; // Red
  });

  if (horizontalBarChart) {
    horizontalBarChart.destroy(); // Destroy existing chart
  }

  horizontalBarChart = new Chart(
    document.getElementById("horizontalBarChart"),
    {
      type: "bar",
      data: {
        labels: testNames,
        datasets: [
          {
            label: "Latest Performance",
            data: barData,
            backgroundColor: barColors,
            borderColor: barColors.map((color) => color.replace("0.8", "1")),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const testName = testNames[context.dataIndex];
                const runs = tooltipData[context.dataIndex];
                return runs
                  .map((run, index) => `Run ${index + 1}: ${run}`)
                  .join(", ");
              },
            },
          },
          legend: { display: false },
          title: { display: true, text: "Performance for Last 3 Runs" },
          datalabels: {
            anchor: "end",
            align: (context) =>
              context.dataset.data[context.dataIndex] >= 95 ? "start" : "end",
            color: (context) =>
              context.raw >= 90
                ? "#000"
                : document.body.classList.contains("light-mode")
                ? "#333"
                : "#fff",
            font: { weight: "bold", size: 14 },
            formatter: (value) => value,
          },
        },
      },
      plugins: [ChartDataLabels], // Enable datalabels plugin
    }
  );
}

// Update Horizontal Bar Chart for SEO
function updateSeoChart(data) {
  Chart.register(ChartDataLabels);
  // Sort data by created_at in descending order (latest first)
  data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const latestTests = {};
  data.forEach((d) => {
    if (!latestTests[d.test_name]) latestTests[d.test_name] = [];
    latestTests[d.test_name].push(d); // Push all runs for the test
  });

  // For each test, keep only the latest 3 runs
  for (const testName in latestTests) {
    if (latestTests[testName].length > 3) {
      latestTests[testName] = latestTests[testName].slice(0, 3).reverse(); // Keep only the latest 3 runs
    }
  }

  const testNames = Object.keys(latestTests);
  const barData = testNames.map(
    (test) => latestTests[test][latestTests[test].length - 1].seo
  );
  const tooltipData = testNames.map((test) =>
    latestTests[test].map((run) => run.seo)
  );

  // Dynamic Bar Colors
  const barColors = barData.map((score) => {
    if (score > 80) return "rgb(0, 190, 0)"; // Green
    if (score >= 50 && score <= 80) return "rgba(255, 159, 64, 0.8)"; // Orange
    return "rgb(190, 0, 0)"; // Red
  });

  if (seoChart) {
    seoChart.destroy(); // Destroy existing chart
  }

  seoChart = new Chart(document.getElementById("seoChart"), {
    type: "bar",
    data: {
      labels: testNames,
      datasets: [
        {
          label: "Latest SEO",
          data: barData,
          backgroundColor: barColors,
          borderColor: barColors.map((color) => color.replace("0.8", "1")),
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const testName = testNames[context.dataIndex];
              const runs = tooltipData[context.dataIndex];
              return runs
                .map((run, index) => `Run ${index + 1}: ${run}`)
                .join(", ");
            },
          },
        },
        legend: { display: false },
        title: { display: true, text: "SEO for Last 3 Runs" },
        datalabels: {
          anchor: "end",
          align: (context) =>
            context.dataset.data[context.dataIndex] >= 95 ? "start" : "end",
          color: (context) =>
            context.raw >= 90
              ? "#000"
              : document.body.classList.contains("light-mode")
              ? "#333"
              : "#fff",
          font: { weight: "bold", size: 14 },
          formatter: (value) => value,
        },
      },
    },
    plugins: [ChartDataLabels], // Enable datalabels plugin
  });
}

// Update Horizontal Bar Chart for Accessibility
function updateAccessibilityChart(data) {
  // Sort data by created_at in descending order (latest first)
  data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const latestTests = {};
  data.forEach((d) => {
    if (!latestTests[d.test_name]) latestTests[d.test_name] = [];
    latestTests[d.test_name].push(d); // Push all runs for the test
  });

  // For each test, keep only the latest 3 runs
  for (const testName in latestTests) {
    if (latestTests[testName].length > 3) {
      latestTests[testName] = latestTests[testName].slice(0, 3).reverse(); // Keep only the latest 3 runs
    }
  }

  const testNames = Object.keys(latestTests);
  const barData = testNames.map(
    (test) => latestTests[test][latestTests[test].length - 1].accessibility
  );
  const tooltipData = testNames.map((test) =>
    latestTests[test].map((run) => run.accessibility)
  );

  // Dynamic Bar Colors
  const barColors = barData.map((score) => {
    if (score > 80) return "rgb(0, 190, 0)"; // Green
    if (score >= 50 && score <= 80) return "rgba(255, 159, 64, 0.8)"; // Orange
    return "rgb(190, 0, 0)"; // Red
  });

  if (accessibilityChart) {
    accessibilityChart.destroy(); // Destroy existing chart
  }

  accessibilityChart = new Chart(
    document.getElementById("accessibilityChart"),
    {
      type: "bar",
      data: {
        labels: testNames,
        datasets: [
          {
            label: "Latest Accessibility",
            data: barData,
            backgroundColor: barColors,
            borderColor: barColors.map((color) => color.replace("0.8", "1")),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const testName = testNames[context.dataIndex];
                const runs = tooltipData[context.dataIndex];
                return runs
                  .map((run, index) => `Run ${index + 1}: ${run}`)
                  .join(", ");
              },
            },
          },
          legend: { display: false },
          title: { display: true, text: "Accessibility for Last 3 Runs" },
          datalabels: {
            anchor: "end",
            align: (context) =>
              context.dataset.data[context.dataIndex] >= 95 ? "start" : "end",
            color: (context) =>
              context.raw >= 90
                ? "#000"
                : document.body.classList.contains("light-mode")
                ? "#333"
                : "#fff",
            font: { weight: "bold", size: 14 },
            formatter: (value) => value,
          },
        },
      },
      plugins: [ChartDataLabels], // Enable datalabels plugin
    }
  );
}

// Update Horizontal Bar Chart for Best Practices
function updateBestPracticeChart(data) {
  // Sort data by created_at in descending order (latest first)
  data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const latestTests = {};
  data.forEach((d) => {
    if (!latestTests[d.test_name]) latestTests[d.test_name] = [];
    latestTests[d.test_name].push(d); // Push all runs for the test
  });

  // For each test, keep only the latest 3 runs
  for (const testName in latestTests) {
    if (latestTests[testName].length > 3) {
      latestTests[testName] = latestTests[testName].slice(0, 3).reverse(); // Keep only the latest 3 runs
    }
  }

  const testNames = Object.keys(latestTests);
  const barData = testNames.map(
    (test) => latestTests[test][latestTests[test].length - 1].best_practice
  );
  const tooltipData = testNames.map((test) =>
    latestTests[test].map((run) => run.best_practice)
  );

  // Dynamic Bar Colors
  const barColors = barData.map((score) => {
    if (score > 80) return "rgb(0, 190, 0)"; // Green
    if (score >= 50 && score <= 80) return "rgba(255, 159, 64, 0.8)"; // Orange
    return "rgb(190, 0, 0)"; // Red
  });

  if (bestPracticeChart) {
    bestPracticeChart.destroy(); // Destroy existing chart
  }

  bestPracticeChart = new Chart(document.getElementById("bestPracticeChart"), {
    type: "bar",
    data: {
      labels: testNames,
      datasets: [
        {
          label: "Latest Best Practices",
          data: barData,
          backgroundColor: barColors,
          borderColor: barColors.map((color) => color.replace("0.8", "1")),
          borderWidth: 5,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const testName = testNames[context.dataIndex];
              const runs = tooltipData[context.dataIndex];
              return runs
                .map((run, index) => `Run ${index + 1}: ${run}`)
                .join(", ");
            },
          },
        },
        legend: { display: false },
        title: { display: true, text: "Best Practices for Last 3 Runs" },
        datalabels: {
          anchor: "end",
          align: (context) =>
            context.dataset.data[context.dataIndex] >= 95 ? "start" : "end",
          color: (context) =>
            context.raw >= 95
              ? "#000"
              : document.body.classList.contains("light-mode")
              ? "#333"
              : "#fff",
          font: { weight: "bold", size: 14 },
          formatter: (value) => value,
        },
      },
    },
    plugins: [ChartDataLabels], // Enable datalabels plugin
  });
}

// Update Dashboard
function updateDashboard(data) {
  const latestTests = {};
  data.forEach((d) => {
    if (!latestTests[d.test_name]) latestTests[d.test_name] = [];
    if (latestTests[d.test_name].length < 3) latestTests[d.test_name].push(d);
  });

  // Function to set the color based on the score
  function setScoreColor(element, score) {
    if (score > 80) {
      element.style.color = "#4CAF50"; // Green
    } else if (score >= 50 && score <= 80) {
      element.style.color = "#FFA500"; // Orange/Deep Yellow
    } else {
      element.style.color = "#FF5252"; // Red
    }
  }

  // Update the scores and set their colors
  const accessibilityScoreElement = document.getElementById(
    "accessibility-score"
  );
  const seoScoreElement = document.getElementById("seo-score");
  const bestPracticeScoreElement = document.getElementById(
    "best-practice-score"
  );

  const accessibilityScore = data[data.length - 1].accessibility;
  const seoScore = data[data.length - 1].seo;
  const bestPracticeScore = data[data.length - 1].best_practice;

  accessibilityScoreElement.innerText = accessibilityScore;
  seoScoreElement.innerText = seoScore;
  bestPracticeScoreElement.innerText = bestPracticeScore;

  // Set colors based on scores
  setScoreColor(accessibilityScoreElement, accessibilityScore);
  setScoreColor(seoScoreElement, seoScore);
  setScoreColor(bestPracticeScoreElement, bestPracticeScore);

  updatePerformanceChart(data);
  updateSeoChart(data);
  updateAccessibilityChart(data);
  updateBestPracticeChart(data);

  // Bar Chart for Device Comparison
  const devices = {};
  data.forEach((d) => {
    if (!devices[d.device_type])
      devices[d.device_type] = { count: 0, performance: 0 };
    devices[d.device_type].count++;
    devices[d.device_type].performance += d.performance;
  });
  const deviceLabels = Object.keys(devices);
  const deviceData = deviceLabels.map((d) =>
    Math.round(devices[d].performance / devices[d].count)
  );
  new Chart(document.getElementById("deviceChart"), {
    type: "bar",
    data: {
      labels: deviceLabels,
      datasets: [
        {
          label: "Avg Performance",
          data: deviceData,
          backgroundColor: "rgb(88, 62, 37)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: "Device Performance Comparison" },
        datalabels: {
          color: "#fff",
          font: { weight: "bold", size: 14 },
        },
      },
    },
  });

  // Table for Latest Test Results
  const tableBody = document.getElementById("data-table");
  tableBody.innerHTML = ""; // Clear existing rows
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = ""; // Clear existing pagination buttons

  // Calculate average data for all tests
  const avgData = calculateAverageData(data);

  // Display average data in the table
  const avgRow = `<tr><td>Average</td><td>-</td><td>${avgData.performance.toFixed(
    2
  )}</td><td>${avgData.accessibility.toFixed(2)}</td><td>${avgData.seo.toFixed(
    2
  )}</td><td>${avgData.best_practice.toFixed(2)}</td><td>-</td></tr>`;
  tableBody.innerHTML += avgRow;

  // Pagination Logic
  const totalPages = Math.ceil(data.length / rowsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.innerText = i;
    button.addEventListener("click", () => {
      currentPage = i;
      updateTable(data);
    });
    pagination.appendChild(button);
  }

  // Update table with paginated data
  updateTable(data);
}

// Calculate average data for all tests
function calculateAverageData(data) {
  const totalTests = data.length;
  const avgData = {
    performance: data.reduce((sum, d) => sum + d.performance, 0) / totalTests,
    accessibility:
      data.reduce((sum, d) => sum + d.accessibility, 0) / totalTests,
    seo: data.reduce((sum, d) => sum + d.seo, 0) / totalTests,
    best_practice:
      data.reduce((sum, d) => sum + d.best_practice, 0) / totalTests,
  };
  return avgData;
}

// Update table with paginated data
function updateTable(data) {
  const tableBody = document.getElementById("data-table");
  tableBody.innerHTML = ""; // Clear existing rows

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = data.slice(start, end);

  paginatedData.forEach((d) => {
    const row = `<tr>
                    <td>${d.test_name}</td>
                    <td>${d.device_type}</td>
                    <td>${d.performance}</td>
                    <td>${d.accessibility}</td>
                    <td>${d.seo}</td>
                    <td>${d.best_practice}</td>
                    <td>${d.created_at}</td>
                  </tr>`;
    tableBody.innerHTML += row;
  });

  // Update pagination
  const totalPages = Math.ceil(data.length / rowsPerPage);
  updatePagination(totalPages);
}

// Fetch data on page load
fetchData();
