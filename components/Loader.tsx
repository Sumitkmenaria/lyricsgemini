
import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 md:p-8 glass rounded-xl animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-t-cyan-400 border-r-cyan-400 border-b-purple-500 border-l-purple-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-t-transparent border-r-transparent border-b-cyan-400 border-l-cyan-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <p className="text-base md:text-lg text-gray-300 text-center animate-pulse">{message}</p>
    </div>
  );
};

export default Loader;
