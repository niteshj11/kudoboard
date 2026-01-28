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

export interface Board {
  id: string;
  userId: string;
  title: string;
  recipientName: string;
  occasion: OccasionType;
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
  cardStyle: CardStyle;
  positionX: number;
  positionY: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

export type OccasionType = 
  | 'birthday'
  | 'farewell'
  | 'congratulations'
  | 'thank-you'
  | 'welcome'
  | 'anniversary'
  | 'get-well'
  | 'holiday'
  | 'other';

export type CardStyle = 
  | 'default'
  | 'sticky-note'
  | 'polaroid'
  | 'speech-bubble'
  | 'heart'
  | 'star';

export interface CreateBoardDto {
  title: string;
  recipientName: string;
  occasion: OccasionType;
  description?: string;
  backgroundColor?: string;
  backgroundPattern?: string;
  isPublic?: boolean;
  password?: string;
  expiresAt?: string;
}

export interface CreateMessageDto {
  boardId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  imageUrl?: string;
  gifUrl?: string;
  cardColor?: string;
  cardStyle?: CardStyle;
  positionX?: number;
  positionY?: number;
  rotation?: number;
}

export interface UpdateMessageDto {
  content?: string;
  imageUrl?: string;
  gifUrl?: string;
  cardColor?: string;
  cardStyle?: CardStyle;
  positionX?: number;
  positionY?: number;
  rotation?: number;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
