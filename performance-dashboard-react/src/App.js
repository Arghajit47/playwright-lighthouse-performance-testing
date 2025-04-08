import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import MetricBox from "./components/MetricBox";
import PerformanceChart from "./charts/PerformanceChart";
import SEOChart from "./charts/SEOChart";
import AccessibilityChart from "./charts/AccessibilityChart";
import BestPracticeChart from "./charts/BestPracticeChart";
import DeviceChart from "./charts/DeviceChart";
import DataTable from "./components/DataTable";
import Loading from "./components/Loading";
import ThemeToggle from "./components/ThemeToggle";

import "./App.css";

function App() {
  const [allData, setAllData] = useState([]);
  const [latestData, setLatestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [searchTerm, setSearchTerm] = useState(""); // Global search state

  // Apply theme class to body element
  useEffect(() => {
    document.body.className = `${theme}-mode`;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Filter data based on search term
  const filteredData = allData.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.url && item.url.toLowerCase().includes(term)) ||
      (item.test_name && item.test_name.toLowerCase().includes(term))
    );
  });

  const filteredLatestData = latestData.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.url && item.url.toLowerCase().includes(term)) ||
      (item.test_name && item.test_name.toLowerCase().includes(term))
    );
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://playwright-lighthouse-performance-testing.onrender.com/api/data"
      );
      const data = await response.json();
      setAllData(data);
      const latest = await fetchLatestData(data);
      setLatestData(latest);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestData = async (data) => {
    const latestRunResults = Object.values(
      data.reduce((acc, test) => {
        const { test_name, created_at } = test;
        if (
          !acc[test_name] ||
          new Date(created_at) > new Date(acc[test_name].created_at)
        ) {
          acc[test_name] = test;
        }
        return acc;
      }, {})
    );
    return latestRunResults;
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={`app-container ${theme}`}>
      <ThemeToggle toggleTheme={toggleTheme} theme={theme} />

      <Header>
        <div className="global-search-container">
          <input
            type="text"
            placeholder="Search by Test Name or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="global-search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="clear-search-button"
            >
              Clear
            </button>
          )}
        </div>
      </Header>

      <div className="metrics">
        <MetricBox
          title="Accessibility"
          score={filteredLatestData[0]?.accessibility || 0}
          onClick={() =>
            document
              .getElementById("accessibilityChart")
              .scrollIntoView({ behavior: "smooth" })
          }
          theme={theme}
        />
        <MetricBox
          title="SEO"
          score={filteredLatestData[0]?.seo || 0}
          onClick={() =>
            document
              .getElementById("seoChart")
              .scrollIntoView({ behavior: "smooth" })
          }
          theme={theme}
        />
        <MetricBox
          title="Best Practices"
          score={filteredLatestData[0]?.best_practice || 0}
          onClick={() =>
            document
              .getElementById("bestPracticeChart")
              .scrollIntoView({ behavior: "smooth" })
          }
          theme={theme}
        />
      </div>

      <PerformanceChart
        data={filteredLatestData}
        allData={filteredData}
        theme={theme}
      />
      <SEOChart
        data={filteredLatestData}
        allData={filteredData}
        theme={theme}
      />
      <AccessibilityChart
        data={filteredLatestData}
        allData={filteredData}
        theme={theme}
      />
      <BestPracticeChart
        data={filteredLatestData}
        allData={filteredData}
        theme={theme}
      />
      <DeviceChart data={filteredData} theme={theme} />

      <DataTable
        data={filteredData}
        latestData={filteredLatestData}
        theme={theme}
      />

      <footer>
        <div className="version-details">
          <p>Dashboard Version: 2.1.0</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
