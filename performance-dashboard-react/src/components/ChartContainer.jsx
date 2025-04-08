// src/components/ChartContainer.jsx
import React from "react";
import PropTypes from "prop-types";

const ChartContainer = ({ title, children, filters }) => {
  return (
    <div className="chart-container">
      <h2>{title}</h2>
      {filters && <div className="filter-container">{filters}</div>}
      {children}
    </div>
  );
};

ChartContainer.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  filters: PropTypes.node,
};

export default ChartContainer;
