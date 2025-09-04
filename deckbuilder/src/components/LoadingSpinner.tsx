import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'lg', 
  className = '' 
}) => {
  const sizeClass = size === 'sm' ? 'loading-sm' : size === 'md' ? 'loading-md' : 'loading-lg';
  
  return (
    <div className={`flex justify-center items-center h-64 ${className}`}>
      <div className={`loading loading-spinner ${sizeClass}`}></div>
    </div>
  );
};

export default LoadingSpinner;
