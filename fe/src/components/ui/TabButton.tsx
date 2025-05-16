import React from 'react';

interface TabButtonProps {
  text: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ text, isActive, onClick }) => (
  <button
    className={`py-1.5 px-3 rounded-full text-xs font-medium transition-all ${
      isActive 
        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
    onClick={onClick}
  >
    {text}
  </button>
);

export default TabButton;