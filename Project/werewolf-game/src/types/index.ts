// src/types/index.ts
export interface Player {
  id: string;
  name: string;
  role?: string;
  isAlive: boolean;
}

export interface GameState {
  players: Player[];
  gamePhase: 'waiting' | 'day' | 'night' | 'voting' | 'ended';
  timer: number;
}