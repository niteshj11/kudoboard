import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { socketService } from '../lib/socket';
import { Board, Message, OCCASION_OPTIONS } from '../types';
import MessageCard from '../components/MessageCard';
import AddMessageModal from '../components/AddMessageModal';
import { ArrowLeft, Plus, Share2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch board
  const { data: board, isLoading: boardLoading, error: boardError } = useQuery<Board>({
    queryKey: ['board', id],
    queryFn: async () => {
      const response = await api.get(`/boards/${id}`);
      return response.data;
    },
    enabled: !!id && isAuthenticated,
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['messages', id],
    queryFn: async () => {
      const response = await api.get(`/messages/board/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Socket connection
  useEffect(() => {
    if (!id) return;

    socketService.connect();
    socketService.joinBoard(id);

    socketService.onMessageCreated((message) => {
      queryClient.setQueryData<Message[]>(['messages', id], (old) => 
        old ? [...old, message as Message] : [message as Message]
      );
    });

    socketService.onMessageUpdated((message) => {
      queryClient.setQueryData<Message[]>(['messages', id], (old) =>
        old?.map(m => m.id === (message as Message).id ? message as Message : m) || []
      );
    });

    socketService.onMessageDeleted(({ id: messageId }) => {
      queryClient.setQueryData<Message[]>(['messages', id], (old) =>
        old?.filter(m => m.id !== messageId) || []
      );
    });

    return () => {
      socketService.leaveBoard(id);
      socketService.removeAllListeners();
    };
  }, [id, queryClient]);

  const copyShareLink = useCallback(() => {
    if (!board) return;
    const url = `${window.location.origin}/b/${board.shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  }, [board]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-slate-600 mb-4">Please log in to view this board</p>
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Go to Login
        </Link>
      </div>
    );
  }

  if (boardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (boardError || !board) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-slate-600 mb-4">Board not found</p>
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const occasionEmoji = OCCASION_OPTIONS.find(o => o.value === board.occasion)?.emoji || '✨';
  const isDarkBg = ['#1e293b', '#0f172a', '#7c3aed'].includes(board.backgroundColor);

  return (
    <div className="min-h-screen" style={{ backgroundColor: board.backgroundColor }}>
      {/* Header */}
      <div className={`sticky top-0 z-40 backdrop-blur-md ${isDarkBg ? 'bg-black/30' : 'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-2 ${isDarkBg ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex-1 text-center">
              <h1 className={`font-display text-xl sm:text-2xl font-bold ${isDarkBg ? 'text-white' : 'text-slate-800'}`}>
                {occasionEmoji} {board.title}
              </h1>
              <p className={`text-sm ${isDarkBg ? 'text-white/70' : 'text-slate-600'}`}>
                For {board.recipientName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyShareLink}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkBg 
                    ? 'text-white/80 hover:text-white hover:bg-white/10' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Copy share link"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Board content */}
      <div className="relative min-h-[calc(100vh-200px)] p-4 sm:p-8">
        <div className="absolute inset-0 pattern-confetti opacity-20" />
        
        {/* Messages */}
        <div className="relative max-w-7xl mx-auto">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {messages.map((message) => (
                <MessageCard 
                  key={message.id} 
                  message={message} 
                  boardId={board.id}
                />
              ))}
            </div>
          ) : (
            <div className={`text-center py-20 ${isDarkBg ? 'text-white/70' : 'text-slate-600'}`}>
              <p className="text-lg mb-2">No messages yet</p>
              <p className="text-sm">Be the first to add a message!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add message button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-all hover:scale-105 z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add message modal */}
      <AddMessageModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        boardId={board.id}
      />
    </div>
  );
}
