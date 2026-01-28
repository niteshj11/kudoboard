import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { socketService } from '../lib/socket';
import { Board, Message, OCCASION_OPTIONS } from '../types';
import MessageCard from '../components/MessageCard';
import AddMessageModal from '../components/AddMessageModal';
import { Plus, Lock, Loader2 } from 'lucide-react';

export default function ViewBoardPage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Fetch board by share code
  const { data: board, isLoading: boardLoading, error: boardError, refetch } = useQuery<Board>({
    queryKey: ['board-public', shareCode, password],
    queryFn: async () => {
      const url = password 
        ? `/boards/share/${shareCode}?password=${encodeURIComponent(password)}`
        : `/boards/share/${shareCode}`;
      const response = await api.get(url);
      return response.data;
    },
    enabled: !!shareCode,
    retry: false,
  });

  // Handle password requirement
  useEffect(() => {
    if (boardError) {
      const error = boardError as { response?: { data?: { requiresPassword?: boolean; message?: string } } };
      if (error.response?.data?.requiresPassword) {
        setRequiresPassword(true);
      }
    }
  }, [boardError]);

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['messages-public', board?.id],
    queryFn: async () => {
      const response = await api.get(`/messages/board/${board!.id}`);
      return response.data;
    },
    enabled: !!board?.id,
  });

  // Socket connection
  useEffect(() => {
    if (!board?.id) return;

    socketService.connect();
    socketService.joinBoard(board.id);

    socketService.onMessageCreated((message) => {
      queryClient.setQueryData<Message[]>(['messages-public', board.id], (old) => 
        old ? [...old, message as Message] : [message as Message]
      );
    });

    socketService.onMessageUpdated((message) => {
      queryClient.setQueryData<Message[]>(['messages-public', board.id], (old) =>
        old?.map(m => m.id === (message as Message).id ? message as Message : m) || []
      );
    });

    socketService.onMessageDeleted(({ id: messageId }) => {
      queryClient.setQueryData<Message[]>(['messages-public', board.id], (old) =>
        old?.filter(m => m.id !== messageId) || []
      );
    });

    return () => {
      socketService.leaveBoard(board.id);
      socketService.removeAllListeners();
    };
  }, [board?.id, queryClient]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    refetch();
  };

  // Password gate
  if (requiresPassword && !board) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-800">Protected Board</h1>
            <p className="text-slate-600 mt-2">Enter the password to view this board</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              View Board
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (boardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (boardError && !requiresPassword) {
    const error = boardError as { response?: { data?: { message?: string } } };
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-slate-800 mb-2">
            {error.response?.data?.message || 'Board not found'}
          </h1>
          <p className="text-slate-600">This board may have been deleted or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  const occasionEmoji = OCCASION_OPTIONS.find(o => o.value === board.occasion)?.emoji || '✨';
  const isDarkBg = ['#1e293b', '#0f172a', '#7c3aed'].includes(board.backgroundColor);

  return (
    <div className="min-h-screen" style={{ backgroundColor: board.backgroundColor }}>
      {/* Header */}
      <div className={`sticky top-0 z-40 backdrop-blur-md ${isDarkBg ? 'bg-black/30' : 'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <span className="text-5xl mb-4 block">{occasionEmoji}</span>
            <h1 className={`font-display text-3xl sm:text-4xl font-bold ${isDarkBg ? 'text-white' : 'text-slate-800'}`}>
              {board.title}
            </h1>
            <p className={`text-lg mt-2 ${isDarkBg ? 'text-white/70' : 'text-slate-600'}`}>
              For {board.recipientName}
            </p>
            {board.description && (
              <p className={`text-sm mt-4 max-w-xl mx-auto ${isDarkBg ? 'text-white/60' : 'text-slate-500'}`}>
                {board.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Board content */}
      <div className="relative min-h-[calc(100vh-250px)] p-4 sm:p-8">
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
                  isPublicView
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
        className="fixed bottom-6 right-6 bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-all hover:scale-105 z-50 flex items-center gap-2"
      >
        <Plus className="w-6 h-6" />
        <span className="hidden sm:inline font-medium pr-2">Add Message</span>
      </button>

      {/* Add message modal */}
      <AddMessageModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        boardId={board.id}
        isPublicView
      />
    </div>
  );
}
