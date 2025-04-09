import React from "react";
import MetricChartTemplate from "./MetricChartTemplate";

const AccessibilityChart = ({ data, allData, theme }) => (
  <MetricChartTemplate
    data={data}
    allData={allData}
    theme={theme}
    title="Accessibility for Last 3 Runs"
    metricKey="accessibility"
    valueLabel="Filter by Accessibility:"
  />
);

export default AccessibilityChart;
