import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`rounded-2xl bg-white p-4 shadow-md ${className}`}>{children}</div>
);

interface CardContentProps {
  children: ReactNode;
}
export const CardContent: React.FC<CardContentProps> = ({ children }) => <div className="pt-2">{children}</div>;