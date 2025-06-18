'use client';
import React from 'react';
import { X } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: 'left' | 'right';
  width?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  title,
  position = 'left',
  width = 'w-80',
  children,
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} bottom-0 
          ${width} bg-white shadow-xl z-50 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'}
          md:relative md:transform-none md:transition-none
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <Button variant="ghost" size="sm" onClick={onClose} className="md:hidden">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
};

export default Sidebar;