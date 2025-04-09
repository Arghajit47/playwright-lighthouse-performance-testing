import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import FilterContainer from "../components/FilterContainer";
import ChartContainer from "../components/ChartContainer";

const MetricChartTemplate = ({
  data,
  allData,
  theme,
  title,
  metricKey,
  valueLabel,
}) => {
  const [deviceFilter, setDeviceFilter] = React.useState("All");
  const [metricFilter, setMetricFilter] = React.useState("All");

  const deviceTypes = [...new Set(allData.map((d) => d.device_type))];
  const allTestNames = [...new Set(allData.map((d) => d.test_name))];

  const applyFilters = () => {
    let filtered = [...data];
    if (deviceFilter !== "All") {
      filtered = filtered.filter((d) => d.device_type === deviceFilter);
    }
    if (metricFilter !== "All") {
      let [min, max] = metricFilter.split("-").map(Number);
      if (min > max) [min, max] = [max, min];
      filtered = filtered.filter(
        (d) => d[metricKey] >= min && d[metricKey] <= max
      );
    }
    return filtered;
  };

  const filteredData = applyFilters();

  const processChartData = () => {
    // Get last 3 runs for each test from ALL data (for tooltips)
    const allTestRuns = {};
    const sortedAllData = [...allData].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    sortedAllData.forEach((test) => {
      if (!allTestRuns[test.test_name]) allTestRuns[test.test_name] = [];
      if (allTestRuns[test.test_name].length < 3) {
        allTestRuns[test.test_name].push(test);
      }
    });

    // Get last run from FILTERED data (for bars)
    const filteredTestRuns = {};
    const sortedFilteredData = [...filteredData].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    sortedFilteredData.forEach((test) => {
      if (!filteredTestRuns[test.test_name]) {
        filteredTestRuns[test.test_name] = test;
      }
    });

    return allTestNames
      .map((testName) => {
        const filteredRun = filteredTestRuns[testName];
        const allRuns = allTestRuns[testName] || [];

        return {
          name:
            testName.length > 10 ? `${testName.substring(0, 10)}...` : testName,
          fullName: testName,
          value: filteredRun ? filteredRun[metricKey] : null,
          fill: getBarColor(filteredRun ? filteredRun[metricKey] : 0),
          runs: allRuns.map((run) => ({
            date: new Date(run.created_at).toLocaleDateString(),
            score: run[metricKey],
            device: run.device_type,
          })),
        };
      })
      .filter((item) => item.value !== null);
  };

  const getBarColor = (score) => {
    if (score >= 80) return "#00be00";
    if (score >= 60) return "#ff9f40";
    return "#be0000";
  };

  const chartData = processChartData();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const runs = payload[0].payload.runs;
      const fullName = payload[0].payload.fullName;
      return (
        <div className={`custom-tooltip ${theme}`}>
          <p className="tooltip-label">{fullName}</p>
          {runs.map((run, index) => (
            <p key={index} className="tooltip-item">
              Run {index + 1} ({run.date}): {run.score}{" "}
              {run.device && `on ${run.device}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const filters = (
    <FilterContainer
      deviceTypes={deviceTypes}
      selectedDevice={deviceFilter}
      onDeviceChange={setDeviceFilter}
      selectedValue={metricFilter}
      onValueChange={setMetricFilter}
      valueOptions={[
        { value: "All", label: "All" },
        { value: "100-80", label: "100-80" },
        { value: "79-60", label: "79-60" },
        { value: "59-0", label: "59-0" },
      ]}
      valueLabel={valueLabel}
    />
  );

  return (
    <ChartContainer title={title} filters={filters}>
      <div style={{ height: "1000px", width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: theme === "dark" ? "#fff" : "#333" }}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={150}
              tick={{ fill: theme === "dark" ? "#fff" : "#333" }}
            />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{
                backgroundColor: theme === "dark" ? "#333" : "#fff",
                borderColor: "#6a11cb",
                borderRadius: "5px",
                padding: "10px",
              }}
            />
            <Bar dataKey="value">
              <LabelList
                dataKey="value"
                position="right"
                fill={theme === "dark" ? "#fff" : "#333"}
                style={{ fontWeight: "bold" }}
              />
              {chartData.map((entry, index) => (
                <Bar
                  key={`bar-${index}`}
                  dataKey="value"
                  fill={entry.fill}
                  stackId="a"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

export default MetricChartTemplate;
