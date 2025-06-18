// src/components/gift/GiftItem.tsx
import React from 'react';
import { DollarSign } from 'lucide-react';
import type  { GiftItem } from '@/types';

interface GiftItemProps {
  gift: GiftItem;
}

const GiftItem: React.FC<GiftItemProps> = ({ gift }) => (
  <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-indigo-200 group">
    <div className="flex flex-col items-center">
      <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{gift.icon}</span>
      <p className="text-xs font-medium">{gift.name}</p>
      <div className="mt-1 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 text-xs">
        <DollarSign size={10} className="mr-0.5" />
        <span>{gift.price}</span>
      </div>
    </div>
  </div>
);

export default GiftItem;