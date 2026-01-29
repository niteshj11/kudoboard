import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { GiphyGif } from '../types';
import { Search, Loader2, Upload, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export default function GifPicker({ onSelect }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data, isLoading, isError } = useQuery<{ data: GiphyGif[] }>({
    queryKey: ['gifs', debouncedQuery],
    queryFn: async () => {
      const endpoint = debouncedQuery 
        ? `/giphy/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`
        : '/giphy/trending?limit=20';
      console.log('Fetching GIFs from:', endpoint);
      const response = await api.get(endpoint);
      console.log('GIF response:', response.data);
      return response.data;
    },
    retry: 1,
    staleTime: 0,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent form submission when pressing Enter in search
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleGifUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate it's a GIF
    if (!file.type.includes('gif')) {
      toast.error('Please select a GIF file');
      return;
    }

    // Validate file size (max 10MB for GIFs)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('GIF must be less than 10MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSelect(response.data.url);
      toast.success('GIF uploaded!');
    } catch {
      toast.error('Failed to upload GIF');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const showUploadFallback = isError || (data?.data && data.data.length === 0 && !isLoading);

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
            onKeyDown={handleKeyDown}
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
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-3">
            <p>GIF search unavailable</p>
            <label className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload your own GIF</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/gif"
                onChange={handleGifUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
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
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-3">
            <p>No GIFs found</p>
            <label className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload your own GIF</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/gif"
                onChange={handleGifUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Footer with upload option */}
      <div className="p-2 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-400">Powered by GIPHY</span>
        <label className="flex items-center gap-1 text-xs text-primary-500 cursor-pointer hover:text-primary-600">
          {isUploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-3 h-3" />
              <span>Upload GIF</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/gif"
            onChange={handleGifUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
}
