'use client';
import React, { useState } from 'react';
import DashboardTemplate from '@/components/templates/DashboardTemplate/DashboardTemplate';
import ChatPanel from '@/components/organisms/ChatPanel/ChatPanel';
import FeatureSidebar from '@/components/organisms/FeatureSidebar/FeatureSidebar';
import GameGrid from '@/components/organisms/GameGrid/GameGrid';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  useSocket(); // Initialize socket connection
  const [activeTab, setActiveTab] = useState('chat');
  return (
    <DashboardTemplate
    leftSidebar={<ChatPanel activeTab={activeTab} />}
      rightSidebar={<FeatureSidebar />}
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600">
            Ready to play some games and connect with friends?
          </p>
        </div>
        
        <GameGrid />
      </div>
    </DashboardTemplate>
  );
};

export default DashboardPage;