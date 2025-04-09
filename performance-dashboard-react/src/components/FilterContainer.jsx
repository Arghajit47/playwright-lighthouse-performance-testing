import React from "react";

const FilterContainer = ({
  deviceTypes,
  selectedDevice,
  onDeviceChange,
  selectedValue,
  onValueChange,
  valueOptions,
  valueLabel,
}) => {
  return (
    <div className="filter-container">
      <div>
        <label htmlFor="deviceFilter">Filter by Device:</label>
        <select
          id="deviceFilter"
          value={selectedDevice}
          onChange={(e) => onDeviceChange(e.target.value)}
        >
          <option value="All">All</option>
          {deviceTypes.map((device_type) => (
            <option key={device_type} value={device_type}>
              {device_type}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="valueFilter">{valueLabel}</label>
        <select
          id="valueFilter"
          value={selectedValue}
          onChange={(e) => onValueChange(e.target.value)}
        >
          {valueOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterContainer;
