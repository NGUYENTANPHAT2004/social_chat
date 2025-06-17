// src/components/layout/FeatureSidebar.tsx
import React, { useState } from 'react';
import { Heart, Video, Users, Gift, Play } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import FeatureCard from '../ui/FeatureCard';
import GiftItem from '../gift/GiftItem';
import { games, giftCategories, gifts } from '@/data/mockData';

const FeatureSidebar: React.FC = () => {
  const [activeGiftTab, setActiveGiftTab] = useState<string>('Popular');
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
        <h2 className="text-xl font-semibold">Discover</h2>
      </div>
      
      <div className="overflow-y-auto flex-grow p-4 space-y-6">
        {/* Quick Actions */}
        <div>
          <SectionHeader title="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            <FeatureCard 
              title="Match Now" 
              icon={Heart} 
              gradient="from-pink-500 to-purple-500" 
              onClick={() => {}}
            />
            <FeatureCard 
              title="Go Live" 
              icon={Video} 
              gradient="from-red-500 to-pink-500" 
              onClick={() => {}}
            />
            <FeatureCard 
              title="Find Rooms" 
              icon={Users} 
              gradient="from-indigo-500 to-blue-500" 
              onClick={() => {}}
            />
            <FeatureCard 
              title="Daily Rewards" 
              icon={Gift} 
              gradient="from-yellow-400 to-orange-500" 
              onClick={() => {}}
            />
          </div>
        </div>
        
        {/* Matchmaking section */}
        <div>
          <SectionHeader title="Find Matches" action={() => {}} actionText="See All" />
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100 shadow-sm">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center mb-3 shadow-md">
                <Heart size={36} className="text-white" />
              </div>
            </div>
            <h3 className="text-center font-semibold mb-1">Find new friends</h3>
            <p className="text-xs text-center text-gray-600 mb-3">Connect with people who share your interests</p>
            <button className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm rounded-xl shadow-md hover:shadow-lg transition-all">
              Start Matching
            </button>
          </div>
        </div>
        
        {/* Popular games section */}
        <div>
          <SectionHeader title="Popular Games" action={() => {}} actionText="More" />
          <div className="space-y-2">
            {games.slice(0, 2).map(game => (
              <div key={game.id} className="bg-white p-3 rounded-xl shadow-sm flex items-center hover:shadow-md transition-all cursor-pointer">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${game.color} flex items-center justify-center text-white font-bold text-xs`}>
                  {game.icon}
                </div>
                <div className="ml-3 flex-grow">
                  <p className="font-medium">{game.name}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Users size={12} className="mr-1" />
                    <span>{game.players} playing</span>
                  </div>
                </div>
                <div className="bg-indigo-100 text-indigo-600 p-1 rounded-lg">
                  <Play size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Gift shop section */}
        <div>
          <SectionHeader title="Gift Shop" action={() => {}} actionText="View All" />
          
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-3">
            <div className="flex space-x-2 overflow-x-auto py-1">
              {giftCategories.map(category => (
                <button 
                  key={category.id}
                  className={`py-1 px-2.5 rounded-full text-xs whitespace-nowrap flex items-center ${
                    activeGiftTab === category.name
                      ? 'bg-indigo-100 text-indigo-600 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setActiveGiftTab(category.name)}
                >
                  <span className="mr-1">{category.emoji}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {gifts
              .filter(gift => activeGiftTab === 'Popular' || gift.category === activeGiftTab)
              .slice(0, 6)
              .map(gift => (
                <GiftItem key={gift.id} gift={gift} />
              ))}
          </div>
          
          <button className="mt-3 w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm shadow-md hover:shadow-lg transition-all">
            Open Gift Shop
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureSidebar;