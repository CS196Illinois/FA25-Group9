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
  lastInvestigation?: {
    targetId: string;
    targetName: string;
    result: 'werewolf' | 'villager';
    round: number;
  };
  lastVision?: {
    targetId: string;
    targetName: string;
    role: string;
    round: number;
  };
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