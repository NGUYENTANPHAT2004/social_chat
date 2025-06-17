'use client';
import React, { useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import Navigation from '@/components/organisms/Navigation/Navigation';
import Sidebar from '@/components/organisms/Sidebar/Sidebar';
import MobileNavbar from '@/components/molecules/MobileNavbar/MobileNavbar';
import { Menu, X } from 'lucide-react';

interface DashboardTemplateProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  children,
  sidebar,
  rightSidebar
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <h1 className="font-semibold text-lg">Dashboard</h1>
          
          {rightSidebar && (
            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation - Desktop */}
        {!isMobile && (
          <div className="w-20 bg-indigo-900 flex-shrink-0">
            <Navigation />
          </div>
        )}

        {/* Left Sidebar */}
        {sidebar && (
          <div className={`
            ${isMobile 
              ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform ${
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'relative w-80 flex-shrink-0'
            }
            bg-white border-r border-gray-200 overflow-hidden
          `}>
            {sidebar}
            
            {/* Mobile overlay */}
            {isMobile && sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </div>

        {/* Right Sidebar */}
        {rightSidebar && (
          <div className={`
            ${isMobile 
              ? `fixed inset-y-0 right-0 z-50 w-80 transform transition-transform ${
                  rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`
              : isTablet 
                ? 'hidden'
                : 'relative w-80 flex-shrink-0'
            }
            bg-gray-50 border-l border-gray-200 overflow-hidden
          `}>
            {rightSidebar}
            
            {/* Mobile overlay */}
            {isMobile && rightSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setRightSidebarOpen(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileNavbar />
      )}
    </div>
  );
};

export default DashboardTemplate;