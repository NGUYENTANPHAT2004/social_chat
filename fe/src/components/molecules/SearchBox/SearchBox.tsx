import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import Input from '@/components/atoms/Input/Input';
import Button from '@/components/atoms/Button/Button';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  initialValue?: string;
  debounceMs?: number;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = 'Search...',
  onSearch,
  onClear,
  initialValue = '',
  debounceMs = 300,
}) => {
  const [query, setQuery] = useState(initialValue);
  const debouncedQuery = useDebounce(query, debounceMs);

  React.useEffect(() => {
    if (debouncedQuery !== initialValue) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch, initialValue]);

  const handleClear = () => {
    setQuery('');
    onClear?.();
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
        rightIcon={
          query && (
            <button
              onClick={handleClear}
              className="hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )
        }
        className="pr-10"
      />
    </div>
  );
};

export default SearchBox;