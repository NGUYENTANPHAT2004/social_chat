'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchPopularGames } from '@/store/slices/gameSlice';
import { Users, Play, Gift, TrendingUp, Star, Crown, Heart } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import GameCard from '@/components/molecules/GameCard/GameCard';
import GiftShop from '@/features/gifts/components/GiftShop/GiftShop';

const FeatureSidebar: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { popularGames, loading } = useAppSelector((state) => state.game);
  
  const [activeGiftTab, setActiveGiftTab] = useState('Popular');
  const [showGiftShop, setShowGiftShop] = useState(false);

  // Mock data for features
  const quickActions = [
    { 
      id: 1, 
      title: 'Daily Bonus', 
      icon: Gift, 
      gradient: 'from-pink-500 to-rose-500',
      action: () => console.log('Daily bonus'),
      available: true
    },
    { 
      id: 2, 
      title: 'Lucky Wheel', 
      icon: Star, 
      gradient: 'from-yellow-500 to-orange-500',
      action: () => console.log('Lucky wheel'),
      available: true
    },
    { 
      id: 3, 
      title: 'Tournament', 
      icon: Crown, 
      gradient: 'from-purple-500 to-indigo-500',
      action: () => console.log('Tournament'),
      available: false
    },
    { 
      id: 4, 
      title: 'Leaderboard', 
      icon: TrendingUp, 
      gradient: 'from-green-500 to-teal-500',
      action: () => console.log('Leaderboard'),
      available: true
    },
  ];

  const giftCategories = [
    { id: 1, name: 'Popular', emoji: '🔥' },
    { id: 2, name: 'Hearts', emoji: '💝' },
    { id: 3, name: 'Flowers', emoji: '🌸' },
    { id: 4, name: 'Animals', emoji: '🐾' },
    { id: 5, name: 'Luxury', emoji: '💎' },
  ];

  const gifts = [
    { id: 1, name: 'Heart', emoji: '❤️', price: 10, category: 'Hearts' },
    { id: 2, name: 'Rose', emoji: '🌹', price: 25, category: 'Flowers' },
    { id: 3, name: 'Diamond', emoji: '💎', price: 100, category: 'Luxury' },
    { id: 4, name: 'Teddy', emoji: '🧸', price: 50, category: 'Animals' },
    { id: 5, name: 'Crown', emoji: '👑', price: 200, category: 'Luxury' },
    { id: 6, name: 'Fire', emoji: '🔥', price: 75, category: 'Popular' },
  ];

  const topStreamers = [
    { id: 1, name: 'StreamerOne', avatar: '/api/placeholder/32/32', viewers: 1234, isLive: true },
    { id: 2, name: 'GamerPro', avatar: '/api/placeholder/32/32', viewers: 856, isLive: true },
    { id: 3, name: 'ChatMaster', avatar: '/api/placeholder/32/32', viewers: 642, isLive: false },
  ];

  useEffect(() => {
    dispatch(fetchPopularGames());
  }, [dispatch]);

  const QuickActionCard = ({ action }: { action: any }) => (
    <button
      onClick={action.action}
      disabled={!action.available}
      className={`bg-gradient-to-r ${action.gradient} p-4 rounded-xl text-white shadow-md hover:shadow-lg cursor-pointer transition-all text-center group relative overflow-hidden ${
        !action.available ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <action.icon size={28} className="mx-auto mb-2 relative z-10" />
      <p className="font-medium text-sm relative z-10">{action.title}</p>
      {!action.available && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      )}
    </button>
  );

  const GiftItem = ({ gift }: { gift: any }) => (
    <button
      onClick={() => console.log('Send gift:', gift.name)}
      className="aspect-square bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center p-2 hover:shadow-md transition-all group"
    >
      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
        {gift.emoji}
      </span>
      <span className="text-xs font-medium text-gray-700 text-center">
        {gift.name}
      </span>
      <span className="text-xs text-purple-600 font-bold">
        {gift.price} KC
      </span>
    </button>
  );

  return (
    <div className="h-full bg-gray-50 overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-6">
        {/* User Profile Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar
              src={user?.avatar}
              name={user?.username}
              size="lg"
              online={true}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{user?.username}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Balance:</span>
                <span className="font-bold text-purple-600">{user?.balance} KC</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-bold text-gray-900">24</div>
              <div className="text-xs text-gray-500">Games Played</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-bold text-green-600">12</div>
              <div className="text-xs text-gray-500">Wins Today</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-sm text-gray-600 uppercase tracking-wider">
              Quick Actions
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => (
              <QuickActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>

        {/* Popular Games */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-sm text-gray-600 uppercase tracking-wider">
              Popular Games
            </h3>
            <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-3 rounded-xl shadow-sm animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              popularGames.slice(0, 3).map(game => (
                <div key={game.id} className="bg-white p-3 rounded-xl shadow-sm flex items-center hover:shadow-md transition-all cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs`}>
                    {game.name.charAt(0)}
                  </div>
                  <div className="ml-3 flex-grow">
                    <p className="font-medium">{game.name}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users size={12} className="mr-1" />
                      <span>{game.playCount} playing</span>
                    </div>
                  </div>
                  <div className="bg-indigo-100 text-indigo-600 p-1 rounded-lg">
                    <Play size={16} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Streamers */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-sm text-gray-600 uppercase tracking-wider">
              Top Streamers
            </h3>
            <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              View All
            </button>
          </div>
          
          <div className="space-y-2">
            {topStreamers.map((streamer, index) => (
              <div key={streamer.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center space-x-2 text-sm font-bold text-gray-400 w-6">
                  #{index + 1}
                </div>
                <Avatar
                  src={streamer.avatar}
                  name={streamer.name}
                  size="sm"
                  online={streamer.isLive}
                />
                <div className="ml-2 flex-1">
                  <p className="font-medium text-sm">{streamer.name}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Users size={10} className="mr-1" />
                    <span>{streamer.viewers}</span>
                    {streamer.isLive && (
                      <Badge variant="danger" size="sm" className="ml-2">
                        LIVE
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Gift shop section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-sm text-gray-600 uppercase tracking-wider">
              Gift Shop
            </h3>
            <button 
              onClick={() => setShowGiftShop(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              View All
            </button>
          </div>
          
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
          
          <Button 
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<Gift className="w-4 h-4" />}
            onClick={() => setShowGiftShop(true)}
            className="mt-3"
          >
            Open Gift Shop
          </Button>
        </div>
      </div>

      {/* Gift Shop Modal */}
      <GiftShop
        isOpen={showGiftShop}
        onClose={() => setShowGiftShop(false)}
        onSendGift={(giftId, recipientId) => {
          console.log('Send gift:', giftId, 'to:', recipientId);
          setShowGiftShop(false);
        }}
      />
    </div>
  );
};

export default FeatureSidebar;