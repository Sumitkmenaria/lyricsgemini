
import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-gray-900/50 rounded-lg">
      <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-purple-500 border-l-purple-500 rounded-full animate-spin"></div>
      <p className="text-lg text-gray-300">{message}</p>
    </div>
  );
};

export default Loader;
