'use client';
import React, { useState, useEffect } from 'react';
import { X, Heart, Star, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Badge from '@/components/atoms/Badge/Badge';
import { useAuth } from '@/features/auth/context/AuthContext';
import { apiService } from '@/services/api';

interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animation?: string;
}

interface GiftShopProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (giftId: string, recipientId: string) => void;
  recipientId?: string;
  recipientName?: string;
}

const GiftShop: React.FC<GiftShopProps> = ({
  isOpen,
  onClose,
  onSendGift,
  recipientId,
  recipientName,
}) => {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: '🎁' },
    { id: 'hearts', name: 'Hearts', icon: '💝' },
    { id: 'flowers', name: 'Flowers', icon: '🌸' },
    { id: 'animals', name: 'Animals', icon: '🐾' },
    { id: 'luxury', name: 'Luxury', icon: '💎' },
  ];

  const mockGifts: Gift[] = [
    { id: '1', name: 'Heart', icon: '❤️', price: 10, category: 'hearts', rarity: 'common' },
    { id: '2', name: 'Rose', icon: '🌹', price: 25, category: 'flowers', rarity: 'common' },
    { id: '3', name: 'Teddy Bear', icon: '🧸', price: 50, category: 'animals', rarity: 'rare' },
    { id: '4', name: 'Diamond Ring', icon: '💍', price: 500, category: 'luxury', rarity: 'legendary' },
    { id: '5', name: 'Golden Heart', icon: '💛', price: 100, category: 'hearts', rarity: 'epic' },
    { id: '6', name: 'Unicorn', icon: '🦄', price: 200, category: 'animals', rarity: 'epic' },
  ];

  useEffect(() => {
    if (isOpen) {
      loadGifts();
    }
  }, [isOpen]);

  const loadGifts = async () => {
    try {
      setLoading(true);
      // const response = await apiService.get('/gifts');
      // setGifts(response.data);
      setGifts(mockGifts); // Using mock data for now
    } catch (error) {
      console.error('Failed to load gifts:', error);
      setGifts(mockGifts);
    } finally {
      setLoading(false);
    }
  };

  const filteredGifts = selectedCategory === 'all' 
    ? gifts 
    : gifts.filter(gift => gift.category === selectedCategory);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common': return { variant: 'default' as const, label: 'Common' };
      case 'rare': return { variant: 'secondary' as const, label: 'Rare' };
      case 'epic': return { variant: 'primary' as const, label: 'Epic' };
      case 'legendary': return { variant: 'warning' as const, label: 'Legendary' };
      default: return { variant: 'default' as const, label: 'Common' };
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift || !recipientId || !user) return;

    if (user.balance < selectedGift.price) {
      alert('Insufficient balance!');
      return;
    }

    try {
      await apiService.post('/gifts/send', {
        giftId: selectedGift.id,
        recipientId,
      });
      
      onSendGift(selectedGift.id, recipientId);
      onClose();
    } catch (error) {
      console.error('Failed to send gift:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gift Shop</h2>
            {recipientName && (
              <p className="text-sm text-gray-600">Send a gift to {recipientName}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Your Balance</p>
              <p className="text-lg font-bold text-purple-600">{user?.balance} KC</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="flex h-[60vh]">
          {/* Categories Sidebar */}
          <div className="w-48 bg-gray-50 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Gifts Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredGifts.map((gift) => {
                  const rarityBadge = getRarityBadge(gift.rarity);
                  const isSelected = selectedGift?.id === gift.id;
                  
                  return (
                    <div
                      key={gift.id}
                      onClick={() => setSelectedGift(gift)}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 shadow-lg' 
                          : getRarityColor(gift.rarity)
                      }`}
                    >
                      {/* Rarity Badge */}
                      <div className="absolute -top-2 -right-2">
                        <Badge variant={rarityBadge.variant} size="sm">
                          {rarityBadge.label}
                        </Badge>
                      </div>

                      {/* Gift Icon */}
                      <div className="text-4xl text-center mb-2">
                        {gift.icon}
                      </div>

                      {/* Gift Info */}
                      <div className="text-center">
                        <h4 className="font-medium text-sm text-gray-900 mb-1">
                          {gift.name}
                        </h4>
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-bold text-purple-600">
                            {gift.price} KC
                          </span>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {selectedGift ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{selectedGift.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedGift.name}</h3>
                  <p className="text-sm text-gray-600">
                    Cost: {selectedGift.price} KC
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedGift(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendGift}
                  disabled={!user || user.balance < selectedGift.price}
                  leftIcon={<Heart className="w-4 h-4" />}
                >
                  Send Gift ({selectedGift.price} KC)
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600">Select a gift to send</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default GiftShop;
