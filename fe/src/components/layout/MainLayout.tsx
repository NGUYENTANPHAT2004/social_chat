// components/layout/MainLayout.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import ChatPanel from './ChatPanel';
import ContentPanel from './ContentPanel';
import FeatureSidebar from './FeatureSidebar';
import MobileNavbar from './MobileNavbar';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [showGames, setShowGames] = useState<boolean>(false);
  const [currentChat, setCurrentChat] = useState<number>(2);
  const [inputText, setInputText] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showChatPanel, setShowChatPanel] = useState<boolean>(false);
  const [showFeaturePanel, setShowFeaturePanel] = useState<boolean>(false);

  // For responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth > 1024) {
        setShowChatPanel(true); // Always show on large screens
        setShowFeaturePanel(true);
      } else if (window.innerWidth > 768) {
        setShowChatPanel(true);
        setShowFeaturePanel(false);
      } else {
        setShowChatPanel(false);
        setShowFeaturePanel(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSend = (): void => {
    if (inputText.trim()) {
      // Handle sending message (in a real app this would update state or call an API)
      setInputText('');
    }
  };

  const toggleChatPanel = () => {
    setShowChatPanel(!showChatPanel);
    if (isMobile && !showChatPanel) setShowFeaturePanel(false);
  };

  const toggleFeaturePanel = () => {
    setShowFeaturePanel(!showFeaturePanel);
    if (isMobile && !showFeaturePanel) setShowChatPanel(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800 overflow-hidden">
      {/* Mobile Navbar (only on small screens) */}
      {isMobile && (
        <MobileNavbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleChatPanel={toggleChatPanel}
          toggleFeaturePanel={toggleFeaturePanel}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Navigation (hidden on mobile) */}
        <div className={`${isMobile ? 'hidden' : 'block'}`}>
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showGames={showGames}
            setShowGames={setShowGames}
          />
        </div>

        {/* Chat/Rooms/Games list sidebar (responsive) */}
        <div
          className={`${
            showChatPanel ? 'block' : 'hidden'
          } w-72 bg-white border-r border-gray-200 overflow-hidden z-10 
          ${isMobile ? 'absolute left-0 top-16 bottom-0 shadow-lg' : 'relative'}`}
        >
          <ChatPanel
            activeTab={activeTab}
            currentChat={currentChat}
            setCurrentChat={setCurrentChat}
            showGames={showGames}
          />
        </div>

        {/* Main content area */}
        <div className="flex-grow flex flex-col bg-white relative">
          <ContentPanel
            inputText={inputText}
            setInputText={setInputText}
            onSend={handleSend}
          />
        </div>

        {/* Right sidebar - Feature Panel (responsive) */}
        <div
          className={`${
            showFeaturePanel ? 'block' : 'hidden'
          } w-72 bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden z-10
          ${isMobile ? 'absolute right-0 top-16 bottom-0 shadow-lg' : 'relative'} 
          md:hidden lg:block`}
        >
          <FeatureSidebar />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;