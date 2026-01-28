import { Server, Socket } from 'socket.io';

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a board room
    socket.on('board:join', (boardId: string) => {
      socket.join(`board:${boardId}`);
      console.log(`📋 Socket ${socket.id} joined board: ${boardId}`);
      
      // Notify others in the room
      socket.to(`board:${boardId}`).emit('user:joined', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Leave a board room
    socket.on('board:leave', (boardId: string) => {
      socket.leave(`board:${boardId}`);
      console.log(`📋 Socket ${socket.id} left board: ${boardId}`);
      
      socket.to(`board:${boardId}`).emit('user:left', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Handle cursor position updates for collaborative experience
    socket.on('cursor:move', (data: { boardId: string; x: number; y: number; name?: string }) => {
      socket.to(`board:${data.boardId}`).emit('cursor:update', {
        socketId: socket.id,
        x: data.x,
        y: data.y,
        name: data.name
      });
    });

    // Handle typing indicator
    socket.on('typing:start', (data: { boardId: string; name: string }) => {
      socket.to(`board:${data.boardId}`).emit('typing:indicator', {
        socketId: socket.id,
        name: data.name,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data: { boardId: string }) => {
      socket.to(`board:${data.boardId}`).emit('typing:indicator', {
        socketId: socket.id,
        isTyping: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}
