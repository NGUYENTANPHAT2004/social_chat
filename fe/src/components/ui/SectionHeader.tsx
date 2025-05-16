import React from 'react';

interface SectionHeaderProps {
  title: string;
  action?: () => void;
  actionText?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, actionText }) => (
  <div className="flex justify-between items-center mb-4">
    <h3 className="font-medium text-sm text-gray-600 uppercase tracking-wider">{title}</h3>
    {action && actionText && (
      <button 
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        onClick={action}
      >
        {actionText}
      </button>
    )}
  </div>
);

export default SectionHeader;