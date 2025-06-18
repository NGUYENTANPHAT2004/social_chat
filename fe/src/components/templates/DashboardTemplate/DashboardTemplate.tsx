'use client';
import React, { useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import Navigation from '@/components/organisms/Navigation/Navigation';
import Sidebar from '@/components/organisms/Sidebar/Sidebar';
import MobileNavbar from '@/components/molecules/MobileNavbar/MobileNavbar';
import { Menu, X } from 'lucide-react';

interface DashboardTemplateProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  leftSidebarTitle?: string;
  rightSidebarTitle?: string;
}

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  children,
  leftSidebar,
  rightSidebar,
  leftSidebarTitle,
  rightSidebarTitle,
}) => {
  const { isMobile } = useResponsive();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('chat');
  const [showGames, setShowGames] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {leftSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <h1 className="font-semibold text-lg">LiveMate</h1>
          
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
        {/* Left Navigation - Desktop Only */}
        {!isMobile && (
          <div className="flex-shrink-0">
            <Navigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showGames={showGames}
              setShowGames={setShowGames}
            />
          </div>
        )}

        {/* Left Sidebar */}
        {leftSidebar && (
          <Sidebar
            isOpen={leftSidebarOpen}
            onClose={() => setLeftSidebarOpen(false)}
            title={leftSidebarTitle}
            position="left"
            width="w-80"
          >
            {leftSidebar}
          </Sidebar>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>

        {/* Right Sidebar */}
        {rightSidebar && (
          <Sidebar
            isOpen={rightSidebarOpen}
            onClose={() => setRightSidebarOpen(false)}
            title={rightSidebarTitle}
            position="right"
            width="w-80"
          >
            {rightSidebar}
          </Sidebar>
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