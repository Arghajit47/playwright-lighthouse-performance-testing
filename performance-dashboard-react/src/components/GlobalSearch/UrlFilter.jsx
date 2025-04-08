import React from "react";
import "./UrlFilter.css";

const UrlFilter = ({ allData, currentUrlFilter, onUrlSelect }) => {
  // Extract unique URLs from allData
  const uniqueUrls = React.useMemo(() => {
    if (!allData || allData.length === 0) return [];
    const urls = allData.map((item) => item.url).filter(Boolean);
    return [...new Set(urls)].sort();
  }, [allData]);

  return (
    <div className="url-filter">
      <label htmlFor="url-filter">Filter by URL:</label>
      <select
        id="url-filter"
        value={currentUrlFilter}
        onChange={(e) => onUrlSelect(e.target.value)}
        disabled={uniqueUrls.length === 0}
      >
        <option value="">All URLs</option>
        {uniqueUrls.map((url) => (
          <option key={url} value={url}>
            {url}
          </option>
        ))}
      </select>
    </div>
  );
};

export default UrlFilter;
