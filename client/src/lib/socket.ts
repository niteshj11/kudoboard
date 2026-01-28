import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

class SocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to socket server');
        // Rejoin board if we were in one
        if (this.currentBoardId) {
          this.joinBoard(this.currentBoardId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from socket server');
      });
    }

    return this.socket;
  }

  joinBoard(boardId: string): void {
    this.currentBoardId = boardId;
    if (this.socket?.connected) {
      this.socket.emit('board:join', boardId);
    }
  }

  leaveBoard(boardId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('board:leave', boardId);
    }
    if (this.currentBoardId === boardId) {
      this.currentBoardId = null;
    }
  }

  onMessageCreated(callback: (message: unknown) => void): void {
    this.socket?.on('message:created', callback);
  }

  onMessageUpdated(callback: (message: unknown) => void): void {
    this.socket?.on('message:updated', callback);
  }

  onMessageDeleted(callback: (data: { id: string; boardId: string }) => void): void {
    this.socket?.on('message:deleted', callback);
  }

  onUserJoined(callback: (data: { socketId: string; timestamp: string }) => void): void {
    this.socket?.on('user:joined', callback);
  }

  onUserLeft(callback: (data: { socketId: string; timestamp: string }) => void): void {
    this.socket?.on('user:left', callback);
  }

  emitCursorMove(boardId: string, x: number, y: number, name?: string): void {
    this.socket?.emit('cursor:move', { boardId, x, y, name });
  }

  emitTypingStart(boardId: string, name: string): void {
    this.socket?.emit('typing:start', { boardId, name });
  }

  emitTypingStop(boardId: string): void {
    this.socket?.emit('typing:stop', { boardId });
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentBoardId = null;
    }
  }
}

export const socketService = new SocketService();
