import React from "react";

const FilterContainer = ({
  device_typeTypes,
  selecteddevice_type,
  ondevice_typeChange,
  selectedValue,
  onValueChange,
  valueOptions,
  valueLabel,
}) => {
  return (
    <div className="filter-container">
      <div>
        <label htmlFor="device_typeFilter">Filter by Device:</label>
        <select
          id="device_typeFilter"
          value={selecteddevice_type}
          onChange={(e) => ondevice_typeChange(e.target.value)}
        >
          <option value="All">All</option>
          {device_typeTypes.map((device_type) => (
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
