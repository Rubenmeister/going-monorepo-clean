/**
 * Chat and messaging types
 */

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface ChatInterfaceProps {
  rideId: string;
  driverName?: string;
  userId: string;
  userName: string;
}

export interface WebSocketChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export const QUICK_REPLIES = [
  '👋 Ya llegué',
  '🚗 En camino',
  '⏳ Dame 5 minutos',
  '📍 ¿Dónde estás?',
  '✅ Aquí te espero',
] as const;

export type QuickReply = (typeof QUICK_REPLIES)[number];
