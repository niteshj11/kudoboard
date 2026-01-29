import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { CreateMessageDto, CARD_COLORS, CardStyle } from '../types';
import { X, Image, Smile, Loader2, Check } from 'lucide-react';
import GifPicker from './GifPicker';
import toast from 'react-hot-toast';

// Helper to resolve image URLs - handles both relative paths and full URLs
const resolveImageUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  
  // If it's already a full URL (http/https), return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  // For relative paths like /uploads/..., prepend the API base URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  // Remove /api suffix if present since uploads are served from root
  const baseUrl = apiUrl.replace(/\/api$/, '');
  return `${baseUrl}${url}`;
};

interface AddMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  isPublicView?: boolean;
}

export default function AddMessageModal({ isOpen, onClose, boardId }: AddMessageModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<CreateMessageDto>>({
    authorName: user?.name || '',
    content: '',
    cardColor: '#ffffff',
    cardStyle: 'default',
  });
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.authorName || !formData.content) {
      toast.error('Please fill in your name and message');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/messages', {
        ...formData,
        boardId,
      });
      
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ queryKey: ['messages', boardId] });
      queryClient.invalidateQueries({ queryKey: ['messages-public', boardId] });
      
      toast.success('Message added!');
      onClose();
      
      // Reset form
      setFormData({
        authorName: user?.name || '',
        content: '',
        cardColor: '#ffffff',
        cardStyle: 'default',
      });
      setImagePreview(null);
    } catch (error) {
      toast.error('Failed to add message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const response = await api.post('/upload/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, imageUrl: response.data.url });
      toast.success('Image uploaded!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload image';
      toast.error(message);
      setImagePreview(null);
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    setFormData({ ...formData, gifUrl });
    setShowGifPicker(false);
  };

  const cardStyles: { value: CardStyle; label: string }[] = [
    { value: 'default', label: 'Classic' },
    { value: 'sticky-note', label: 'Sticky Note' },
    { value: 'polaroid', label: 'Polaroid' },
  ];

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <Dialog.Title className="font-semibold text-lg text-slate-800">
                    Add a Message
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Author name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Your name"
                      maxLength={50}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                      placeholder="Write your message..."
                      rows={4}
                      maxLength={1000}
                    />
                    <p className="text-xs text-slate-400 mt-1 text-right">
                      {formData.content?.length || 0}/1000
                    </p>
                  </div>

                  {/* Media buttons */}
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <Image className="w-5 h-5 text-slate-500" />
                      <span className="text-sm text-slate-600">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGifPicker(!showGifPicker)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Smile className="w-5 h-5 text-slate-500" />
                      <span className="text-sm text-slate-600">Add GIF</span>
                    </button>
                  </div>

                  {/* Image preview */}
                  {imagePreview && (
                    <div className="relative">
                      <img src={imagePreview} alt="" className="w-full h-40 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, imageUrl: undefined });
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* GIF preview */}
                  {formData.gifUrl && (
                    <div className="relative">
                      <img src={resolveImageUrl(formData.gifUrl)} alt="" className="w-full h-40 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gifUrl: undefined })}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* GIF picker */}
                  {showGifPicker && (
                    <GifPicker onSelect={handleGifSelect} />
                  )}

                  {/* Card color */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Card Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CARD_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, cardColor: color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                            formData.cardColor === color
                              ? 'border-primary-500 scale-110'
                              : 'border-slate-200'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {formData.cardColor === color && (
                            <Check className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card style */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Card Style
                    </label>
                    <div className="flex gap-2">
                      {cardStyles.map((style) => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, cardStyle: style.value })}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                            formData.cardStyle === style.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-500 text-white py-4 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Message'
                    )}
                  </button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
