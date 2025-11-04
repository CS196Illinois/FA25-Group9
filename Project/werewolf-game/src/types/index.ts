export interface Player {
  id: string;
  name: string;
  isAlive: boolean;
  role: string;
  seat: number;
  isHost: boolean;
  isReady: boolean;
  lastSeen: number;
  votedFor?: string;
  isProtected?: boolean;
}

export interface GameState {
  players: Player[];
  timer: number;
  gamePhase: 'night' | 'day' | 'discussion' | 'voting' | 'results';
  round: number;
}

export type MessageType = 'public' | 'whisper';

export interface ChatMessage {
  id: number;
  content: string;
  timestamp: Date;
  type: MessageType;
  to?: string | null;
  toName?: string | null;
}