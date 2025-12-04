// Firebase database schema and type definitions

export interface GameSettings {
  totalPlayers: number;
  nightDuration: number;
  dayDuration: number;
  discussionDuration: number;
  votingDuration: number;
  usePresetRoles: boolean;
  customRoles: { [roleId: string]: number };
}

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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'public' | 'whisper';
  targetId?: string;
  targetName?: string;
}

export interface GameState {
  currentPhase: 'lobby' | 'night' | 'day' | 'discussion' | 'voting' | 'results' | 'finished';
  round: number;
  timeRemaining: number;
  lastUpdate: number;
  winningSide?: 'werewolves' | 'villagers';
  eliminatedPlayer?: string;
  lastNightResult?: 'killed' | 'protected';
  voteResult?: 'success' | 'tie';
}

export interface Game {
  gameId: string;
  gameCode: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  settings: GameSettings;
  players: { [playerId: string]: Player };
  gameState: GameState;
  messages?: { [messageId: string]: ChatMessage };
  createdAt: number;
  voiceSignals?: { [playerId: string]: any };
}

export const DB_PATHS = {
  games: 'games',
  gameByCode: (code: string) => `games/${code}`,
  playersInGame: (code: string) => `games/${code}/players`,
  gameState: (code: string) => `games/${code}/gameState`,
  gameSettings: (code: string) => `games/${code}/settings`,
  messages: (code: string) => `games/${code}/messages`,
  voiceSignals: (code: string) => `games/${code}/voiceSignals`,
} as const;
