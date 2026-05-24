import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
    </div>
  );
};

export default LoadingSpinner;
