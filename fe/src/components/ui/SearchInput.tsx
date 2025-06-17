// src/components/ui/SearchInput.tsx
import React from 'react';
import { Search } from 'lucide-react';

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

export default SearchInput;
