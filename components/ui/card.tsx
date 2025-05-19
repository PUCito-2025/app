import React from "react";

export const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl bg-white p-4 shadow-md ${className}`}>{children}</div>
);

export const CardContent = ({ children }) => <div className="pt-2">{children}</div>;
