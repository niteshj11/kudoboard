export interface User {
  id: string;
  email: string;
  name: string;
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

export interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height: { url: string; width: string; height: string };
    fixed_width: { url: string; width: string; height: string };
    original: { url: string; width: string; height: string };
    preview_gif: { url: string };
  };
}

export const OCCASION_OPTIONS: { value: OccasionType; label: string; emoji: string }[] = [
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'farewell', label: 'Farewell', emoji: '👋' },
  { value: 'congratulations', label: 'Congratulations', emoji: '🎉' },
  { value: 'thank-you', label: 'Thank You', emoji: '🙏' },
  { value: 'welcome', label: 'Welcome', emoji: '🤗' },
  { value: 'anniversary', label: 'Anniversary', emoji: '💍' },
  { value: 'get-well', label: 'Get Well', emoji: '💐' },
  { value: 'holiday', label: 'Holiday', emoji: '🎄' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

export const CARD_COLORS = [
  '#ffffff', '#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5',
  '#e0e7ff', '#fae8ff', '#fed7aa', '#fecaca', '#a7f3d0'
];

export const BACKGROUND_COLORS = [
  '#f0f4f8', '#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5',
  '#e0e7ff', '#fae8ff', '#1e293b', '#0f172a', '#7c3aed'
];
