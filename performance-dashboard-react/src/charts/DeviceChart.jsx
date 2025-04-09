import React, { useEffect, useState } from "react";
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

const DeviceChart = ({ data, theme }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Process all runs for tooltips
    const allDeviceRuns = {};
    const sortedAllData = [...data].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    sortedAllData.forEach((test) => {
      if (!allDeviceRuns[test.device_type])
        allDeviceRuns[test.device_type] = [];
      if (allDeviceRuns[test.device_type].length < 3) {
        allDeviceRuns[test.device_type].push(test);
      }
    });

    // Calculate averages
    const deviceAverages = {};
    data.forEach((test) => {
      if (!deviceAverages[test.device_type]) {
        deviceAverages[test.device_type] = { sum: 0, count: 0 };
      }
      deviceAverages[test.device_type].sum += test.performance;
      deviceAverages[test.device_type].count++;
    });

    // Prepare chart data
    const processedData = Object.keys(deviceAverages).map((deviceType) => {
      const avg = Math.round(
        deviceAverages[deviceType].sum / deviceAverages[deviceType].count
      );
      return {
        name:
          deviceType.length > 10
            ? `${deviceType.substring(0, 10)}...`
            : deviceType,
        fullName: deviceType,
        value: avg,
        fill: getBarColor(avg),
        runs: (allDeviceRuns[deviceType] || []).map((run) => ({
          date: new Date(run.created_at).toLocaleDateString(),
          score: run.performance,
          testName: run.test_name,
        })),
      };
    });

    setChartData(processedData);
  }, [data]);

  const getBarColor = (score) => {
    if (score >= 80) return "#00be00";
    if (score >= 60) return "#ff9f40";
    return "#be0000";
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`custom-tooltip ${theme}`}>
          <p className="tooltip-label">{payload[0].payload.fullName}</p>
          <p className="tooltip-item">Average: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <h2>Average Performance by Device</h2>
      <div style={{ height: "400px", width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fill: theme === "dark" ? "#fff" : "#333" }}
            />
            <YAxis
              domain={[0, 100]}
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
            <Bar dataKey="value" fill="#8884d8">
              <LabelList
                dataKey="value"
                position="top"
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
    </div>
  );
};

export default DeviceChart;
