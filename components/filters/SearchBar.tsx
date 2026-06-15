'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useBoardStore } from '@/store/board';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useBoardStore();

  return (
    <div className="relative">
      <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search tasks..."
        className="pl-10 pr-8"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}