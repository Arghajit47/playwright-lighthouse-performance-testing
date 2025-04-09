/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import Pagination from "./Pagination";

const DataTable = ({ data, latestData }) => {
  const [showLatestRunOnly, setShowLatestRunOnly] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const device_typeTypes = [...new Set(data.map((d) => d.device_type))];

  let filteredData = showLatestRunOnly ? latestData : data;

  if (deviceFilter !== "All") {
    filteredData = filteredData.filter((d) => d.device_type === deviceFilter);
  }

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = filteredData.slice(start, end);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateAverageData = (data) => {
    const totalTests = data.length;
    return {
      performance: data.reduce((sum, d) => sum + d.performance, 0) / totalTests,
      accessibility:
        data.reduce((sum, d) => sum + d.accessibility, 0) / totalTests,
      seo: data.reduce((sum, d) => sum + d.seo, 0) / totalTests,
      best_practice:
        data.reduce((sum, d) => sum + d.best_practice, 0) / totalTests,
    };
  };

  const avgData = calculateAverageData(data);

  return (
    <div className="chart-container">
      <h2>All Performance Test Results</h2>
      <label style={{ marginLeft: "10px" }}>
        <input
          type="checkbox"
          checked={showLatestRunOnly}
          onChange={() => {
            setShowLatestRunOnly(!showLatestRunOnly);
            setCurrentPage(1); // Reset to first page when toggling latest run
          }}
        />
        Latest Run Result
      </label>

      <div className="filter-container">
        <div>
          <label htmlFor="tabledeviceFilter">Filter by Device:</label>
          <select
            id="tabledeviceFilter"
            value={deviceFilter}
            onChange={(e) => {
              setDeviceFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when changing device_type filter
            }}
          >
            <option value="All">All</option>
            {device_typeTypes.map((device_type) => (
              <option key={device_type} value={device_type}>
                {device_type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Device Type</th>
              <th>Performance</th>
              <th>Accessibility</th>
              <th>SEO</th>
              <th>Best Practice</th>
              <th>Date</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((d) => (
              <tr key={`${d.test_name}-${d.created_at}`}>
                <td>{d.test_name}</td>
                <td>{d.device_type}</td>
                <td>{d.performance}</td>
                <td>{d.accessibility}</td>
                <td>{d.seo}</td>
                <td>{d.best_practice}</td>
                <td>{formatDate(d.created_at)}</td>
                <td>{d.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length > rowsPerPage && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}

      <div className="pagination-info">
        Showing {start + 1}-{Math.min(end, filteredData.length)} of{" "}
        {filteredData.length} results
      </div>
    </div>
  );
};

export default DataTable;
