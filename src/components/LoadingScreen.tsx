import React from 'react';
import { useAuthStore } from '../store';

export const LoadingScreen: React.FC = () => {
  const { isDarkMode } = useAuthStore();
  
  return (
    <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <img
          src={isDarkMode ? "/logo_2.png" : "/logo_1.png"}
          alt="Logo"
          className="h-24 w-auto animate-pulse mb-8"
        />
        <div className="relative">
          <div className="h-24 w-24">
            <div className="absolute border-8 border-gray-200 dark:border-gray-800 rounded-full h-24 w-24"></div>
            <div className="absolute border-8 border-gray-900 dark:border-white rounded-full h-24 w-24 border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
};