import React from 'react';

const MetricBox = ({ title, score, onClick }) => {
  const getScoreColor = (score) => {
    if (score > 80) return '#4CAF50';
    if (score >= 50 && score <= 80) return '#FFA500';
    return '#FF5252';
  };

  return (
    <div className="metric-box" id={`${title}Chart`} onClick={onClick}>
      <h3>{title}</h3>
      <p style={{ color: getScoreColor(score) }}>{score}</p>
    </div>
  );
};

export default MetricBox;