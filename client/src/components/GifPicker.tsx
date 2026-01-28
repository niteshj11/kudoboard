import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { GiphyGif } from '../types';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export default function GifPicker({ onSelect }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data, isLoading } = useQuery<{ data: GiphyGif[] }>({
    queryKey: ['gifs', debouncedQuery],
    queryFn: async () => {
      const endpoint = debouncedQuery 
        ? `/giphy/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`
        : '/giphy/trending?limit=20';
      const response = await api.get(endpoint);
      return response.data;
    },
  });

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* GIF Grid */}
      <div className="h-60 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {data.data.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
              >
                <img
                  src={gif.images.fixed_width.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No GIFs found
          </div>
        )}
      </div>

      {/* Powered by Giphy */}
      <div className="p-2 border-t border-slate-200 text-center">
        <span className="text-xs text-slate-400">Powered by GIPHY</span>
      </div>
    </div>
  );
}
