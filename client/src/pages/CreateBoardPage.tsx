import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { CreateBoardDto, OCCASION_OPTIONS, BACKGROUND_COLORS } from '../types';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateBoardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateBoardDto>({
    title: '',
    recipientName: '',
    occasion: 'birthday',
    description: '',
    backgroundColor: '#f0f4f8',
    isPublic: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/create' } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.recipientName) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/boards', formData);
      toast.success('Board created successfully!');
      navigate(`/board/${response.data.id}`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create board';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-800">Create a Board</h1>
        <p className="text-slate-600 mt-2">Set up your appreciation board in seconds</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Board Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Happy Birthday Sarah!"
              maxLength={100}
            />
          </div>

          {/* Recipient Name */}
          <div>
            <label htmlFor="recipientName" className="block text-sm font-medium text-slate-700 mb-2">
              Recipient Name <span className="text-red-500">*</span>
            </label>
            <input
              id="recipientName"
              type="text"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Sarah"
              maxLength={50}
            />
          </div>

          {/* Occasion */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Occasion
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {OCCASION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, occasion: option.value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    formData.occasion === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs text-slate-600">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Add a message for contributors..."
              rows={3}
            />
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Background Color
            </label>
            <div className="flex flex-wrap gap-3">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, backgroundColor: color })}
                  className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                    formData.backgroundColor === color
                      ? 'border-primary-500 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {formData.backgroundColor === color && (
                    <Check className={`w-5 h-5 ${
                      color === '#1e293b' || color === '#0f172a' || color === '#7c3aed' 
                        ? 'text-white' 
                        : 'text-slate-700'
                    }`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-slate-700 mb-4">Preview</h3>
          <div 
            className="h-40 rounded-xl relative overflow-hidden"
            style={{ backgroundColor: formData.backgroundColor }}
          >
            <div className="absolute inset-0 pattern-confetti opacity-30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span className="text-4xl mb-2">
                {OCCASION_OPTIONS.find(o => o.value === formData.occasion)?.emoji}
              </span>
              <h4 className={`font-semibold text-lg ${
                formData.backgroundColor === '#1e293b' || formData.backgroundColor === '#0f172a' || formData.backgroundColor === '#7c3aed'
                  ? 'text-white'
                  : 'text-slate-800'
              }`}>
                {formData.title || 'Your Board Title'}
              </h4>
              <p className={`text-sm ${
                formData.backgroundColor === '#1e293b' || formData.backgroundColor === '#0f172a' || formData.backgroundColor === '#7c3aed'
                  ? 'text-white/80'
                  : 'text-slate-600'
              }`}>
                For {formData.recipientName || 'Recipient'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Board'
          )}
        </button>
      </form>
    </div>
  );
}
