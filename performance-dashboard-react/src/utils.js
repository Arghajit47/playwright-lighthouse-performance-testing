export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const calculateAverageData = (data) => {
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
