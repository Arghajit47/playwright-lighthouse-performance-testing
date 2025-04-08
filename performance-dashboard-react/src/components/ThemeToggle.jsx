import React from "react";
import { FaMoon, FaSun } from "react-icons/fa";

const ThemeToggle = ({ toggleTheme, theme }) => {
  return (
    <div className="theme-toggle" onClick={toggleTheme}>
      {theme === "dark" ? <FaSun /> : <FaMoon />}
    </div>
  );
};

export default ThemeToggle;
