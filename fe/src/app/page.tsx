"use client";
import React, { useState } from 'react';
import { MessageCircle, Video, Phone, Gift, Image, Heart, Star, Music, Users, Settings, Search, Send, Mic, Paperclip, Camera, Play, User, Zap, DollarSign, Coffee, Moon } from 'lucide-react';

// ====== TYPE DEFINITIONS ======
interface ChatItem {
  id: number;
  name: string;
  avatar: string;
  message: string;
  time: string;
  unread: number;
  online: boolean;
}

interface RoomItem {
  id: number;
  name: string;
  members: number;
  active: boolean;
  image: string;
}

interface MessageItem {
  id: number;
  sender: string;
  text: string;
  time: string;
  isMine: boolean;
}

interface ReelItem {
  id: number;
  user: string;
  avatar: string;
  viewed: boolean;
}

interface GameItem {
  id: number;
  name: string;
  icon: string;
  players: number;
  color: string;
}

interface GiftCategory {
  id: number;
  name: string;
  emoji: string;
}

interface GiftItem {
  id: number;
  name: string;
  emoji: string;
  price: number;
  category: string;
}

interface LiveEvent {
  id: number;
  title: string;
  host: string;
  viewers: number;
  thumbnail: string;
}

// ====== MOCK DATA ======
const chatList: ChatItem[] = [
  { id: 1, name: 'Mai Linh', avatar: '/api/placeholder/32/32', message: 'Bạn có đang online không?', time: '12:30', unread: 3, online: true },
  { id: 2, name: 'Tuấn Anh', avatar: '/api/placeholder/32/32', message: 'Hẹn gặp lại nhé!', time: '11:45', unread: 0, online: true },
  { id: 3, name: 'Hương Giang', avatar: '/api/placeholder/32/32', message: 'Cảm ơn bạn đã gửi quà', time: '09:20', unread: 1, online: false },
  { id: 4, name: 'Minh Quân', avatar: '/api/placeholder/32/32', message: 'Chơi game không?', time: '08:15', unread: 0, online: true },
  { id: 5, name: 'Kim Ngân', avatar: '/api/placeholder/32/32', message: 'Mình sẽ livestream lúc 8h tối', time: 'Hôm qua', unread: 0, online: false },
];

const rooms: RoomItem[] = [
  { id: 1, name: 'Game Party', members: 1234, active: true, image: '/api/placeholder/50/50' },
  { id: 2, name: 'Voice Chat', members: 567, active: true, image: '/api/placeholder/50/50' },
  { id: 3, name: 'Show Time', members: 890, active: false, image: '/api/placeholder/50/50' },
  { id: 4, name: 'Chill Music', members: 432, active: true, image: '/api/placeholder/50/50' },
];

const messages: MessageItem[] = [
  { id: 1, sender: 'Tuấn Anh', text: 'Chào bạn, hôm nay bạn có rảnh không?', time: '11:30', isMine: false },
  { id: 2, sender: 'You', text: 'Chào, mình rảnh đấy. Bạn muốn làm gì?', time: '11:32', isMine: true },
  { id: 3, sender: 'Tuấn Anh', text: 'Mình đang tổ chức một buổi livestream nhỏ, bạn có muốn tham gia không?', time: '11:35', isMine: false },
  { id: 4, sender: 'You', text: 'Có chứ, mình thích lắm. Mấy giờ vậy?', time: '11:40', isMine: true },
  { id: 5, sender: 'Tuấn Anh', text: 'Khoảng 7h tối nay. Mình sẽ gửi link sau.', time: '11:42', isMine: false },
];

const reels: ReelItem[] = [
  { id: 1, user: 'Linh', avatar: '/api/placeholder/32/32', viewed: false },
  { id: 2, user: 'Hùng', avatar: '/api/placeholder/32/32', viewed: false },
  { id: 3, user: 'Trang', avatar: '/api/placeholder/32/32', viewed: true },
  { id: 4, user: 'Duy', avatar: '/api/placeholder/32/32', viewed: false },
  { id: 5, user: 'Hà', avatar: '/api/placeholder/32/32', viewed: true },
  { id: 6, user: 'Nam', avatar: '/api/placeholder/32/32', viewed: false },
];

const games: GameItem[] = [
  { id: 1, name: 'Lucky Wheel', icon: 'LW', players: 243, color: 'from-yellow-400 to-yellow-600' },
  { id: 2, name: 'Long Hổ', icon: 'LH', players: 156, color: 'from-blue-400 to-blue-600' },
  { id: 3, name: 'Treasure Hunt', icon: 'TH', players: 89, color: 'from-green-400 to-green-600' },
  { id: 4, name: 'Card Game', icon: 'CG', players: 75, color: 'from-red-400 to-red-600' },
];

const giftCategories: GiftCategory[] = [
  { id: 1, name: 'Popular', emoji: '🔥' },
  { id: 2, name: 'Events', emoji: '🎉' },
  { id: 3, name: 'Luxury', emoji: '💎' },
  { id: 4, name: 'Lucky', emoji: '🍀' },
];

const gifts: GiftItem[] = [
  { id: 1, name: 'Gift Box', emoji: '🎁', price: 50, category: 'Popular' },
  { id: 2, name: 'Hearts', emoji: '💖', price: 100, category: 'Popular' },
  { id: 3, name: 'Star', emoji: '🌟', price: 200, category: 'Luxury' },
  { id: 4, name: 'Magic', emoji: '🔮', price: 300, category: 'Lucky' },
  { id: 5, name: 'Music', emoji: '🎵', price: 150, category: 'Events' },
  { id: 6, name: 'Diamond', emoji: '💎', price: 500, category: 'Luxury' },
];

const liveEvents: LiveEvent[] = [
  { id: 1, title: 'Gaming Stream', host: 'Minh Quân', viewers: 243, thumbnail: '/api/placeholder/120/80' },
  { id: 2, title: 'Music Session', host: 'Hương Giang', viewers: 128, thumbnail: '/api/placeholder/120/80' },
];

// ====== COMPONENTS ======

// NavigationIcon component
interface NavigationIconProps {
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}

const NavigationIcon: React.FC<NavigationIconProps> = ({ icon: Icon, isActive, onClick }) => (
  <button 
    className={`p-3 rounded-xl transition-all duration-200 ${
      isActive 
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg text-white' 
        : 'text-gray-300 hover:bg-indigo-800/30'
    }`}
    onClick={onClick}
  >
    <Icon size={20} />
  </button>
);

// Logo component
const Logo: React.FC = () => (
  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
    <span className="font-bold text-white text-lg">LM</span>
  </div>
);

// Navigation component
interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showGames: boolean;
  setShowGames: (show: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  showGames, 
  setShowGames 
}) => (
  <div className="w-20 bg-indigo-900 flex flex-col items-center py-6 text-white">
    <Logo />
    
    <div className="flex flex-col items-center space-y-4 mt-8">
      <NavigationIcon 
        icon={MessageCircle} 
        isActive={activeTab === 'chat'} 
        onClick={() => setActiveTab('chat')}
      />
      <NavigationIcon 
        icon={Video} 
        isActive={activeTab === 'video'} 
        onClick={() => setActiveTab('video')}
      />
      <NavigationIcon 
        icon={Users} 
        isActive={activeTab === 'groups'} 
        onClick={() => setActiveTab('groups')}
      />
      <NavigationIcon 
        icon={Play} 
        isActive={activeTab === 'reels'} 
        onClick={() => setActiveTab('reels')}
      />
      <NavigationIcon 
        icon={Star} 
        isActive={showGames} 
        onClick={() => setShowGames(!showGames)}
      />
    </div>
    
    <div className="mt-auto">
      <NavigationIcon 
        icon={Settings} 
        isActive={false} 
        onClick={() => {}}
      />
      <div className="mt-4 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center cursor-pointer mb-2">
        <img src="/api/placeholder/32/32" alt="Profile" className="w-10 h-10 rounded-full border-2 border-white" />
      </div>
    </div>
  </div>
);

// SearchInput component
interface SearchInputProps {
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ placeholder = "Search..." }) => (
  <div className="relative">
    <input
      type="text"
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
    />
    <Search size={18} className="absolute left-3 top-3 text-gray-400" />
  </div>
);

// ChatItem component
interface ChatItemProps {
  chat: ChatItem;
  isActive: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onClick }) => (
  <div 
    className={`p-3 border-b border-gray-100 flex items-center hover:bg-indigo-50/50 cursor-pointer transition-all duration-200 ${isActive ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
    onClick={onClick}
  >
    <div className="relative">
      <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full shadow" />
      {chat.online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
      )}
      {chat.unread > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
          {chat.unread}
        </span>
      )}
    </div>
    <div className="ml-3 flex-grow">
      <div className="flex justify-between">
        <span className="font-medium">{chat.name}</span>
        <span className="text-xs text-gray-500">{chat.time}</span>
      </div>
      <p className="text-sm text-gray-600 truncate">{chat.message}</p>
    </div>
  </div>
);

// RoomItem component
interface RoomItemProps {
  room: RoomItem;
}

const RoomItem: React.FC<RoomItemProps> = ({ room }) => (
  <div className="p-3 border-b border-gray-100 hover:bg-indigo-50/50 transition-all cursor-pointer">
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm">
          <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
        </div>
        <div className="ml-3">
          <span className="font-medium">{room.name}</span>
          <p className="text-xs text-gray-600">{room.members} members</p>
        </div>
      </div>
      <span className={`w-2.5 h-2.5 rounded-full ${room.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
    </div>
  </div>
);

// ReelItem component
interface ReelItemProps {
  reel: ReelItem;
}

const ReelItem: React.FC<ReelItemProps> = ({ reel }) => (
  <div className="relative cursor-pointer group">
    <div className={`aspect-[9/16] rounded-xl overflow-hidden ${
      reel.viewed ? 'bg-gradient-to-tr from-gray-200 to-gray-300' : 'bg-gradient-to-tr from-pink-500 to-purple-600'
    }`}>
      <div className="absolute inset-0 flex items-center justify-center opacity-80">
        <img src={reel.avatar} alt={reel.user} className="w-14 h-14 rounded-full border-2 border-white shadow-lg" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white">
        <p className="text-sm font-medium">{reel.user}</p>
      </div>
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Play size={30} className="text-white" />
      </div>
    </div>
  </div>
);

// LiveStreamItem component
interface LiveStreamItemProps {
  stream: LiveEvent;
}

const LiveStreamItem: React.FC<LiveStreamItemProps> = ({ stream }) => (
  <div className="mb-4 cursor-pointer group">
    <div className="relative h-40 rounded-xl overflow-hidden shadow-md">
      <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg shadow">
        LIVE
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent text-white">
        <h3 className="font-medium">{stream.title}</h3>
        <div className="flex justify-between items-center">
          <p className="text-xs opacity-80">{stream.host}</p>
          <p className="text-xs bg-black/40 px-2 py-1 rounded">{stream.viewers} viewers</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="bg-white/90 text-indigo-600 rounded-full p-2 shadow-lg">
          <Play size={36} className="ml-1" />
        </div>
      </div>
    </div>
  </div>
);

// GameItem component
interface GameItemProps {
  game: GameItem;
}

const GameItem: React.FC<GameItemProps> = ({ game }) => (
  <div className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group">
    <div className="flex items-center">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${game.color} flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all`}>
        {game.icon}
      </div>
      <div className="ml-3">
        <p className="font-medium group-hover:text-indigo-600 transition-colors">{game.name}</p>
        <div className="flex items-center text-xs text-gray-500">
          <Users size={12} className="mr-1" />
          <span>{game.players} playing now</span>
        </div>
      </div>
    </div>
  </div>
);

// Message component
interface MessageProps {
  message: MessageItem;
}

const Message: React.FC<MessageProps> = ({ message }) => (
  <div 
    className={`flex mb-4 ${message.isMine ? 'justify-end' : 'justify-start'}`}
  >
    {!message.isMine && (
      <img src="/api/placeholder/32/32" alt={message.sender} className="w-8 h-8 rounded-full mr-2 self-end shadow" />
    )}
    <div 
      className={`max-w-xs p-3 rounded-xl shadow-sm ${
        message.isMine 
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none' 
          : 'bg-white border border-gray-100 rounded-bl-none'
      }`}
    >
      <p>{message.text}</p>
      <p className={`text-xs mt-1 ${message.isMine ? 'text-indigo-200' : 'text-gray-500'} flex justify-end`}>
        {message.time}
      </p>
    </div>
  </div>
);

// StoryReel component
interface StoryReelProps {
  reels: ReelItem[];
}

const StoryReel: React.FC<StoryReelProps> = ({ reels }) => (
  <div className="flex space-x-3 pb-4 overflow-x-auto scrollbar-hide">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center p-0.5 cursor-pointer hover:shadow-lg transition-all">
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <Plus size={24} className="text-indigo-500" />
        </div>
      </div>
      <span className="text-xs mt-2">Your Story</span>
    </div>
    
    {reels.slice(0, 6).map(reel => (
      <div key={reel.id} className="flex flex-col items-center">
        <div className={`w-16 h-16 rounded-full p-0.5 cursor-pointer transition-transform hover:scale-105 ${
          reel.viewed 
            ? 'bg-gray-300' 
            : 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500'
        }`}>
          <img 
            src={reel.avatar} 
            alt={reel.user} 
            className="w-full h-full rounded-full border-2 border-white object-cover" 
          />
        </div>
        <span className="text-xs mt-2">{reel.user}</span>
      </div>
    ))}
  </div>
);

// ChatHeader component
const ChatHeader: React.FC = () => (
  <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between bg-white shadow-sm">
    <div className="flex items-center">
      <div className="relative">
        <img src="/api/placeholder/40/40" alt="Profile" className="w-10 h-10 rounded-full" />
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
      </div>
      <div className="ml-3">
        <h3 className="font-semibold">Tuấn Anh</h3>
        <p className="text-xs text-gray-500">Online now</p>
      </div>
    </div>
    
    <div className="flex items-center space-x-2">
      <button className="p-2 text-gray-600 hover:bg-indigo-50 rounded-full transition-colors">
        <Phone size={20} />
      </button>
      <button className="p-2 text-gray-600 hover:bg-indigo-50 rounded-full transition-colors">
        <Video size={20} />
      </button>
      <button className="p-2 text-gray-600 hover:bg-indigo-50 rounded-full transition-colors">
        <Gift size={20} />
      </button>
      <button className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-md hover:shadow-lg transition-all">
        <Zap size={18} />
      </button>
    </div>
  </div>
);

// ChatInput component
interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend }) => (
  <div className="p-3 border-t border-gray-200 flex items-center bg-white">
    <div className="flex space-x-1 mr-2">
      <button className="p-2 text-gray-500 hover:bg-indigo-50 rounded-full transition-colors">
        <Paperclip size={20} />
      </button>
      <button className="p-2 text-gray-500 hover:bg-indigo-50 rounded-full transition-colors">
        <Image size={20} />
      </button>
      <button className="p-2 text-gray-500 hover:bg-indigo-50 rounded-full transition-colors">
        <Gift size={20} />
      </button>
    </div>
    
    <div className="flex-grow relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message..."
        className="w-full py-2.5 px-4 rounded-full border border-gray-200 focus:outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white pr-24"
      />
      <div className="absolute right-1 top-1 flex space-x-1">
        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
          <Mic size={18} />
        </button>
        <button 
          className={`p-1.5 rounded-full ${value.trim() ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' : 'text-gray-300 bg-gray-100'} transition-all`}
          onClick={onSend}
          disabled={!value.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  </div>
);

// SectionHeader component
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

// FeatureCard component
interface FeatureCardProps {
  title: string;
  icon: React.ElementType;
  gradient: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, icon: Icon, gradient, onClick }) => (
  <div 
    className={`bg-gradient-to-r ${gradient} p-4 rounded-xl text-white shadow-md hover:shadow-lg cursor-pointer transition-all text-center`}
    onClick={onClick}
  >
    <Icon size={28} className="mx-auto mb-2" />
    <p className="font-medium text-sm">{title}</p>
  </div>
);

// GiftItem component
interface GiftItemProps {
  gift: GiftItem;
}

const GiftItem: React.FC<GiftItemProps> = ({ gift }) => (
  <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-indigo-200 group">
    <div className="flex flex-col items-center">
      <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{gift.emoji}</span>
      <p className="text-xs font-medium">{gift.name}</p>
      <div className="mt-1 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 text-xs">
        <DollarSign size={10} className="mr-0.5" />
        <span>{gift.price}</span>
      </div>
    </div>
  </div>
);

// TabButton component
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

// ChatListColumn component
interface ChatListColumnProps {
  activeTab: string;
  currentChat: number;
  setCurrentChat: (id: number) => void;
}

const ChatListColumn: React.FC<ChatListColumnProps> = ({ activeTab, currentChat, setCurrentChat }) => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold mb-3">Messages</h2>
      <SearchInput placeholder="Search conversations..." />
    </div>
    
    <div className="overflow-y-auto flex-grow">
      {chatList.map(chat => (
        <ChatItem 
          key={chat.id} 
          chat={chat} 
          isActive={chat.id === currentChat}
          onClick={() => setCurrentChat(chat.id)}
        />
      ))}
    </div>
  </div>
);

// RoomsColumn component
const RoomsColumn: React.FC = () => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold mb-3">Rooms</h2>
      <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all">
        <Plus size={18} className="mr-2" />
        Create Room
      </button>
    </div>
    
    <div className="overflow-y-auto flex-grow">
      {rooms.map(room => (
        <RoomItem key={room.id} room={room} />
      ))}
    </div>
  </div>
);

// ReelsColumn component
const ReelsColumn: React.FC = () => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold mb-3">Reels</h2>
      <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all">
        <Plus size={18} className="mr-2" />
        New Reel
      </button>
    </div>
    
    <div className="p-3 grid grid-cols-2 gap-3">
      {reels.map(reel => (
        <ReelItem key={reel.id} reel={reel} />
      ))}
    </div>
  </div>
);

// LiveColumn component
const LiveColumn: React.FC = () => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold mb-3">Live Now</h2>
      <button className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all">
        <Video size={18} className="mr-2" />
        Go Live
      </button>
    </div>
    
    <div className="overflow-y-auto flex-grow p-3">
      {liveEvents.map(stream => (
        <LiveStreamItem key={stream.id} stream={stream} />
      ))}
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 mb-3">Discover more streams</p>
        <button className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors">
          Explore Live
        </button>
      </div>
    </div>
  </div>
);

// GamesColumn component
const GamesColumn: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Games</h2>
        <div className="flex space-x-2">
          <TabButton 
            text="All Games" 
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <TabButton 
            text="Favorites" 
            isActive={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
          />
          <TabButton 
            text="New" 
            isActive={activeTab === 'new'}
            onClick={() => setActiveTab('new')}
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {games.map(game => (
          <GameItem key={game.id} game={game} />
        ))}
        
        <div className="p-4">
          <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all">
            Browse All Games
          </button>
        </div>
      </div>
    </div>
  );
};

// FeatureSidebar component
const FeatureSidebar: React.FC = () => {
  const [activeGiftTab, setActiveGiftTab] = useState<string>('Popular');
  
  return (
    <div className="w-72 bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden">
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
              ))
            }
          </div>
          
          <button className="mt-3 w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm shadow-md hover:shadow-lg transition-all">
            Open Gift Shop
          </button>
        </div>
      </div>
    </div>
  );
};

// Plus component
interface PlusProps {
  size: number;
  className?: string;
}

const Plus: React.FC<PlusProps> = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// Main app component
const ChatApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [showGames, setShowGames] = useState<boolean>(false);
  const [currentChat, setCurrentChat] = useState<number>(2);
  const [inputText, setInputText] = useState<string>('');

  const handleSend = (): void => {
    if (inputText.trim()) {
      // Handle sending message (in a real app this would update state or call an API)
      setInputText('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 overflow-hidden">
      {/* Left sidebar - Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        showGames={showGames} 
        setShowGames={setShowGames} 
      />

      {/* Second column - Chat list, Rooms, or Games */}
      <div className="w-72 bg-white border-r border-gray-200 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatListColumn 
            activeTab={activeTab} 
            currentChat={currentChat} 
            setCurrentChat={setCurrentChat} 
          />
        )}
        
        {activeTab === 'groups' && <RoomsColumn />}
        {activeTab === 'reels' && <ReelsColumn />}
        {activeTab === 'video' && <LiveColumn />}
        {showGames && <GamesColumn />}
      </div>

      {/* Main content area */}
      <div className="flex-grow flex flex-col bg-white">
        <ChatHeader />
        
        <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
          <StoryReel reels={reels} />
          
          {messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
        </div>
        
        <ChatInput 
          value={inputText}
          onChange={setInputText}
          onSend={handleSend}
        />
      </div>

      {/* Right sidebar - For features like matchmaking, gifts, etc. */}
      <FeatureSidebar />
    </div>
  );
};

export default ChatApp;