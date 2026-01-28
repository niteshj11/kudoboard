import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Board, OCCASION_OPTIONS } from '../types';
import { Plus, ExternalLink, Copy, Trash2, Calendar, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/dashboard' } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const { data: boards, isLoading, refetch } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await api.get('/boards');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const copyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/b/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const deleteBoard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this board?')) return;
    
    try {
      await api.delete(`/boards/${id}`);
      toast.success('Board deleted');
      refetch();
    } catch {
      toast.error('Failed to delete board');
    }
  };

  const getOccasionEmoji = (occasion: string) => {
    return OCCASION_OPTIONS.find(o => o.value === occasion)?.emoji || '✨';
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-800">My Boards</h1>
          <p className="text-slate-600 mt-1">Manage your appreciation boards</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Board
        </Link>
      </div>

      {/* Board List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : boards && boards.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <div
              key={board.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Board preview header */}
              <div 
                className="h-24 relative"
                style={{ backgroundColor: board.backgroundColor }}
              >
                <div className="absolute inset-0 pattern-confetti opacity-30" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-4xl">{getOccasionEmoji(board.occasion)}</span>
                </div>
              </div>

              {/* Board content */}
              <div className="p-5">
                <h3 className="font-semibold text-lg text-slate-800 mb-1 truncate">
                  {board.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  For {board.recipientName}
                </p>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(board.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <Link
                    to={`/board/${board.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </Link>
                  <button
                    onClick={() => copyShareLink(board.shareCode)}
                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Copy share link"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteBoard(board.id)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete board"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No boards yet</h2>
          <p className="text-slate-600 mb-6">Create your first appreciation board to get started</p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Board
          </Link>
        </div>
      )}
    </div>
  );
}
