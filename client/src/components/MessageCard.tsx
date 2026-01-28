import { motion } from 'framer-motion';
import { Message } from '../types';
import { format } from 'date-fns';

interface MessageCardProps {
  message: Message;
  boardId: string;
  isPublicView?: boolean;
}

export default function MessageCard({ message }: MessageCardProps) {
  const getCardStyleClasses = () => {
    switch (message.cardStyle) {
      case 'sticky-note':
        return 'sticky-note';
      case 'polaroid':
        return 'polaroid';
      case 'speech-bubble':
        return 'speech-bubble';
      default:
        return '';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow ${getCardStyleClasses()}`}
      style={{ 
        backgroundColor: message.cardColor,
        transform: `rotate(${message.rotation}deg)`
      }}
    >
      {/* Content */}
      <div className="space-y-3">
        {/* Image */}
        {message.imageUrl && (
          <div className="rounded-lg overflow-hidden -mx-2 -mt-2 mb-3">
            <img 
              src={message.imageUrl} 
              alt="" 
              className="w-full h-40 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* GIF */}
        {message.gifUrl && (
          <div className="rounded-lg overflow-hidden -mx-2 -mt-2 mb-3">
            <img 
              src={message.gifUrl} 
              alt="" 
              className="w-full h-40 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Text content */}
        <p className="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>

        {/* Author */}
        <div className="flex items-center justify-between pt-3 border-t border-black/5">
          <span className="text-sm font-medium text-slate-600">
            — {message.authorName}
          </span>
          <span className="text-xs text-slate-400">
            {format(new Date(message.createdAt), 'MMM d')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
