// Role definitions and assignment logic

import { Player, GameSettings } from './schema';

export interface RoleDefinition {
  id: string;
  name: string;
  team: 'werewolves' | 'villagers';
  description: string;
  nightAction?: string;
  minCount: number;
  maxCount: number;
  icon: string;
  color: string;
}

export const ROLE_DEFINITIONS: { [key: string]: RoleDefinition } = {
  werewolf: {
    id: 'werewolf',
    name: 'Werewolf',
    team: 'werewolves',
    description: 'Eliminate villagers during the night.',
    nightAction: 'Choose a villager to eliminate',
    minCount: 1,
    maxCount: 4,
    icon: '🐺',
    color: '#8B0000'
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    team: 'villagers',
    description: 'Protect one player each night.',
    nightAction: 'Choose a player to protect',
    minCount: 0,
    maxCount: 1,
    icon: '⚕️',
    color: '#00CED1'
  },
  detective: {
    id: 'detective',
    name: 'Detective',
    team: 'villagers',
    description: 'Investigate one player each night.',
    nightAction: 'Choose a player to investigate',
    minCount: 0,
    maxCount: 1,
    icon: '🔍',
    color: '#4169E1'
  },
  seer: {
    id: 'seer',
    name: 'Seer',
    team: 'villagers',
    description: 'See alignment of one player each night.',
    nightAction: 'Choose a player to see their alignment',
    minCount: 0,
    maxCount: 1,
    icon: '👁️',
    color: '#9370DB'
  },
  villager: {
    id: 'villager',
    name: 'Villager',
    team: 'villagers',
    description: 'Find and eliminate werewolves.',
    minCount: 1,
    maxCount: 8,
    icon: '👨‍🌾',
    color: '#228B22'
  }
};

/**
 * Validate that the role selection is valid for the game
 */
export function validateRoleSelection(customRoles: {[key: string]: number}, totalPlayers: number): boolean {
  const totalRoles = Object.values(customRoles).reduce((sum, count) => sum + count, 0);

  if (totalRoles !== totalPlayers) {
    throw new Error(`Total roles (${totalRoles}) must equal total players (${totalPlayers})`);
  }

  const werewolfCount = customRoles.werewolf || 0;
  if (werewolfCount === 0) {
    throw new Error('Must have at least 1 werewolf');
  }

  if (werewolfCount >= totalPlayers - werewolfCount) {
    throw new Error('Werewolves cannot equal or outnumber villager team');
  }

  return true;
}

/**
 * Get preset role configurations based on player count
 */
export function getPresetRoles(playerCount: number): { [key: string]: number } {
  const presets: { [key: number]: { [key: string]: number } } = {
    4: { werewolf: 1, doctor: 1, villager: 2 },
    5: { werewolf: 1, doctor: 1, detective: 1, villager: 2 },
    6: { werewolf: 2, doctor: 1, detective: 1, villager: 2 },
    7: { werewolf: 2, doctor: 1, detective: 1, seer: 1, villager: 2 },
    8: { werewolf: 2, doctor: 1, detective: 1, seer: 1, villager: 3 },
    9: { werewolf: 2, doctor: 1, detective: 1, seer: 1, villager: 4 },
    10: { werewolf: 3, doctor: 1, detective: 1, seer: 1, villager: 4 },
    11: { werewolf: 3, doctor: 1, detective: 1, seer: 1, villager: 5 },
    12: { werewolf: 3, doctor: 1, detective: 1, seer: 1, villager: 6 }
  };

  return presets[playerCount] || presets[6];
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Assign roles to players randomly
 * This is the core random assignment logic
 */
export function assignRolesToPlayers(players: Player[], settings: GameSettings): Player[] {
  let roles: string[] = [];

  // Create role pool based on settings
  if (settings.usePresetRoles) {
    // Use preset combinations
    const presetRoles = getPresetRoles(players.length);
    Object.entries(presetRoles).forEach(([roleId, count]) => {
      for (let i = 0; i < count; i++) {
        roles.push(roleId);
      }
    });
  } else {
    // Use custom roles
    Object.entries(settings.customRoles).forEach(([roleId, count]) => {
      for (let i = 0; i < count; i++) {
        roles.push(roleId);
      }
    });
  }

  // Shuffle roles randomly using Fisher-Yates
  const shuffledRoles = shuffleArray(roles);

  // Sort players by seat number for deterministic assignment
  const sortedPlayers = [...players].sort((a, b) => a.seat - b.seat);

  // Assign shuffled roles to sorted players
  return sortedPlayers.map((player, index) => ({
    ...player,
    role: shuffledRoles[index]
  }));
}

/**
 * Get role information by role ID
 */
export function getRoleInfo(roleId: string): RoleDefinition | undefined {
  return ROLE_DEFINITIONS[roleId];
}

/**
 * Check if a role is a werewolf
 */
export function isWerewolf(roleId: string): boolean {
  return roleId === 'werewolf';
}

/**
 * Get all werewolf players
 */
export function getWerewolves(players: { [key: string]: Player }): Player[] {
  return Object.values(players).filter(player => isWerewolf(player.role));
}

/**
 * Get all alive players
 */
export function getAlivePlayers(players: { [key: string]: Player }): Player[] {
  return Object.values(players).filter(player => player.isAlive);
}

/**
 * Check if werewolves have won
 */
export function haveWerewolvesWon(players: { [key: string]: Player }): boolean {
  const alivePlayers = getAlivePlayers(players);
  const aliveWerewolves = alivePlayers.filter(p => isWerewolf(p.role));
  const aliveVillagers = alivePlayers.filter(p => !isWerewolf(p.role));

  return aliveWerewolves.length >= aliveVillagers.length;
}

/**
 * Check if villagers have won
 */
export function haveVillagersWon(players: { [key: string]: Player }): boolean {
  const alivePlayers = getAlivePlayers(players);
  const aliveWerewolves = alivePlayers.filter(p => isWerewolf(p.role));

  return aliveWerewolves.length === 0;
}
