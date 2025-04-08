import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <img
          src="/logo.png"
          alt="Unforgettable"
          className="w-full h-auto"
        />
      </div>
    </div>
  );
};