export interface Board {
  id: string;
  userId: string;
  title: string;
  recipientName: string;
  occasion: string;
  description?: string;
  backgroundColor: string;
  backgroundPattern?: string;
  isPublic: boolean;
  password?: string;
  shareCode: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  boardId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  imageUrl?: string;
  gifUrl?: string;
  cardColor: string;
  cardStyle: string;
  positionX: number;
  positionY: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  googleId?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
