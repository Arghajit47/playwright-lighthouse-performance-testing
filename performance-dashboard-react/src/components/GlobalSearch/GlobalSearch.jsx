import React, { useState, useEffect } from "react";
import "./GlobalSearch.css";

const GlobalSearch = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  return (
    <div className="global-search">
      <input
        type="text"
        placeholder="Search tests..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <button
          onClick={() => {
            setSearchTerm("");
            onSearch("");
          }}
          className="clear-btn"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default GlobalSearch;
