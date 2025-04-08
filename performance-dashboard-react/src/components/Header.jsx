import React from "react";

const Header = ({ children }) => {
  return (
    <div>
      <div className="header">Performance Audit Dashboard</div>
      {children}
    </div>
  );
};

export default Header;
