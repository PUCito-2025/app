
import React from 'react';

export const Card = ({ children, className = '' }) => (
    <div className={`rounded-2xl shadow-md bg-white p-4 ${className}`}>
        {children}
    </div>
);

export const CardContent = ({ children }) => (
    <div className="pt-2">
        {children}
    </div>
);

