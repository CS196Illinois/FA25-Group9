// Firebase game service - handles all game operations

import { database, auth } from './config';
import { ref, set, get, onValue, off, remove, update } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { Game, Player, GameSettings, GameState } from './schema';
import { DB_PATHS } from './schema';
import { assignRolesToPlayers, validateRoleSelection } from './rolesConfig';

class GameService {
  private currentGameCode: string | null = null;
  private currentUserId: string | null = null;

  /**
   * Authenticate user anonymously with Firebase
   */
  async authenticateUser(): Promise<string> {
    try {
      // Check if already authenticated
      if (auth.currentUser) {
        this.currentUserId = auth.currentUser.uid;
        console.log('Using existing auth user:', this.currentUserId);
        return this.currentUserId;
      }

      // Sign in anonymously
      const userCredential = await signInAnonymously(auth);
      this.currentUserId = userCredential.user.uid;
      console.log('Created new auth user:', this.currentUserId);
      return this.currentUserId;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Failed to authenticate user');
    }
  }

  /**
   * Generate a random 6-character game code
   */
  private generateGameCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a new game as host
   */
  async createGame(settings: GameSettings, hostName: string): Promise<string> {
    // Always authenticate to ensure we have a user ID
    await this.authenticateUser();

    // Validate custom roles if not using presets
    if (!settings.usePresetRoles) {
      validateRoleSelection(settings.customRoles, settings.totalPlayers);
    }

    const gameCode = this.generateGameCode();
    const gameId = `game_${Date.now()}`;

    const game: Game = {
      gameId,
      gameCode,
      hostId: this.currentUserId!,
      status: 'waiting',
      settings,
      players: {
        [this.currentUserId!]: {
          id: this.currentUserId!,
          name: hostName,
          isAlive: true,
          role: '',
          seat: 0,
          isHost: true,
          isReady: true,
          lastSeen: Date.now()
        }
      },
      gameState: {
        currentPhase: 'lobby',
        round: 0,
        timeRemaining: 0,
        lastUpdate: Date.now()
      },
      createdAt: Date.now()
    };

    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      await set(gameRef, game);

      this.currentGameCode = gameCode;
      console.log(`Game created with code: ${gameCode} by user: ${this.currentUserId}`);
      console.log('Initial game state:', game);
      return gameCode;
    } catch (error) {
      console.error('Failed to create game:', error);
      throw new Error('Failed to create game');
    }
  }

  /**
   * Join an existing game
   */
  async joinGame(gameCode: string, playerName: string): Promise<string> {
    // Always authenticate to ensure we have a user ID
    await this.authenticateUser();

    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      const gameSnapshot = await get(gameRef);

      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }

      const game: Game = gameSnapshot.val();

      console.log('Joining game:', {
        gameCode,
        currentUserId: this.currentUserId,
        existingPlayers: Object.keys(game.players),
        playerCount: Object.keys(game.players).length
      });

      if (game.status !== 'waiting') {
        throw new Error('Game already started');
      }

      // Check if user is already in the game
      if (game.players[this.currentUserId!]) {
        console.log('Player already in game, updating info');
        // Update player info but keep existing data
        const playerRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${this.currentUserId}`);
        await update(playerRef, {
          name: playerName,
          lastSeen: Date.now()
        });
        this.currentGameCode = gameCode;
        return this.currentUserId!;
      }

      const playerCount = Object.keys(game.players).length;
      if (playerCount >= game.settings.totalPlayers) {
        throw new Error('Game is full');
      }

      // Find next available seat
      const occupiedSeats = Object.values(game.players).map(p => p.seat);
      let seat = 0;
      while (occupiedSeats.includes(seat)) {
        seat++;
      }

      const newPlayer: Player = {
        id: this.currentUserId!,
        name: playerName,
        isAlive: true,
        role: '',
        seat,
        isHost: false,
        isReady: false,
        lastSeen: Date.now()
      };

      console.log('Adding new player:', newPlayer);

      const playerRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${this.currentUserId}`);
      await set(playerRef, newPlayer);

      this.currentGameCode = gameCode;
      console.log(`Joined game ${gameCode} as ${playerName} with seat ${seat}`);
      return this.currentUserId!;
    } catch (error) {
      console.error('Failed to join game:', error);
      throw error;
    }
  }

  /**
   * Set player ready status in lobby
   */
  async setPlayerReady(gameCode: string, playerId: string, ready: boolean): Promise<void> {
    try {
      const playerRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${playerId}/isReady`);
      await set(playerRef, ready);
    } catch (error) {
      console.error('Failed to set player ready status:', error);
      throw error;
    }
  }

  /**
   * Update player's last seen timestamp
   */
  async updatePlayerPresence(gameCode: string, playerId: string): Promise<void> {
    try {
      const playerRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${playerId}/lastSeen`);
      await set(playerRef, Date.now());
    } catch (error) {
      console.error('Failed to update player presence:', error);
    }
  }

  /**
   * Start the game - assign roles and begin first night
   */
  async startGame(gameCode: string): Promise<void> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      const gameSnapshot = await get(gameRef);

      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }

      const game: Game = gameSnapshot.val();
      const players = Object.values(game.players);

      // Verify all players are ready
      const allReady = players.every(player => player.isReady);
      if (!allReady) {
        throw new Error('Not all players are ready');
      }

      // Assign roles randomly
      const playersWithRoles = assignRolesToPlayers(players, game.settings);

      // Update game state
      const updates: any = {
        status: 'playing',
        'gameState/currentPhase': 'night',
        'gameState/round': 1,
        'gameState/timeRemaining': game.settings.nightDuration,
        'gameState/lastUpdate': Date.now()
      };

      // Update players with roles
      playersWithRoles.forEach(player => {
        updates[`players/${player.id}/role`] = player.role;
      });

      await update(gameRef, updates);
      console.log(`Game ${gameCode} started with roles assigned`);
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  }

  /**
   * Subscribe to game updates in real-time
   */
  subscribeToGame(gameCode: string, callback: (game: Game | null) => void): () => void {
    const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));

    onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    });

    // Return unsubscribe function
    return () => off(gameRef);
  }

  /**
   * Update game phase
   */
  async updateGamePhase(gameCode: string, phase: GameState['currentPhase'], timeRemaining: number): Promise<void> {
    try {
      const gameStateRef = ref(database, DB_PATHS.gameState(gameCode));
      await update(gameStateRef, {
        currentPhase: phase,
        timeRemaining,
        lastUpdate: Date.now()
      });
    } catch (error) {
      console.error('Failed to update game phase:', error);
      throw error;
    }
  }

  /**
   * Submit a player's vote
   */
  async submitVote(gameCode: string, playerId: string, targetId: string): Promise<void> {
    try {
      const playerRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${playerId}/votedFor`);
      await set(playerRef, targetId);
    } catch (error) {
      console.error('Failed to submit vote:', error);
      throw error;
    }
  }

  /**
   * Clear all votes
   */
  async clearVotes(gameCode: string): Promise<void> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      const gameSnapshot = await get(gameRef);

      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }

      const game: Game = gameSnapshot.val();
      const updates: any = {};

      Object.keys(game.players).forEach(playerId => {
        updates[`players/${playerId}/votedFor`] = null;
      });

      await update(gameRef, updates);
    } catch (error) {
      console.error('Failed to clear votes:', error);
      throw error;
    }
  }

  /**
   * Eliminate a player
   */
  async eliminatePlayer(gameCode: string, playerId: string): Promise<void> {
    try {
      const playerRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${playerId}/isAlive`);
      await set(playerRef, false);
    } catch (error) {
      console.error('Failed to eliminate player:', error);
      throw error;
    }
  }

  /**
   * Protect a player (doctor ability)
   */
  async protectPlayer(gameCode: string, playerId: string): Promise<void> {
    try {
      const playerRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${playerId}/isProtected`);
      await set(playerRef, true);
    } catch (error) {
      console.error('Failed to protect player:', error);
      throw error;
    }
  }

  /**
   * Clear all protections
   */
  async clearProtections(gameCode: string): Promise<void> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      const gameSnapshot = await get(gameRef);

      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }

      const game: Game = gameSnapshot.val();
      const updates: any = {};

      Object.keys(game.players).forEach(playerId => {
        updates[`players/${playerId}/isProtected`] = false;
      });

      await update(gameRef, updates);
    } catch (error) {
      console.error('Failed to clear protections:', error);
      throw error;
    }
  }

  /**
   * End the game with a winner
   */
  async endGame(gameCode: string, winningSide: 'werewolves' | 'villagers'): Promise<void> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      await update(gameRef, {
        status: 'finished',
        'gameState/currentPhase': 'finished',
        'gameState/winningSide': winningSide,
        'gameState/lastUpdate': Date.now()
      });
    } catch (error) {
      console.error('Failed to end game:', error);
      throw error;
    }
  }

  /**
   * Leave the current game
   */
  async leaveGame(gameCode: string, playerId: string): Promise<void> {
    try {
      const playerRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${playerId}`);
      await remove(playerRef);

      if (playerId === this.currentUserId) {
        this.currentGameCode = null;
      }
    } catch (error) {
      console.error('Failed to leave game:', error);
      throw error;
    }
  }

  /**
   * Delete a game (host only)
   */
  async deleteGame(gameCode: string): Promise<void> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      await remove(gameRef);

      if (gameCode === this.currentGameCode) {
        this.currentGameCode = null;
      }
    } catch (error) {
      console.error('Failed to delete game:', error);
      throw error;
    }
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get current game code
   */
  getCurrentGameCode(): string | null {
    return this.currentGameCode;
  }

  /**
   * Set current game code (for when rejoining)
   */
  setCurrentGameCode(gameCode: string): void {
    this.currentGameCode = gameCode;
  }

  /**
   * Check if a game exists
   */
  async gameExists(gameCode: string): Promise<boolean> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      const snapshot = await get(gameRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Failed to check game existence:', error);
      return false;
    }
  }

  /**
   * Process night phase actions - handle werewolf kills and doctor protection
   * Returns the player ID who was eliminated (or null if protected)
   */
  async processNightActions(gameCode: string): Promise<string | null> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      const gameSnapshot = await get(gameRef);

      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }

      const game: Game = gameSnapshot.val();
      const players = Object.values(game.players);

      // Find werewolves and tally their votes
      const werewolves = players.filter(p => p.role === 'werewolf' && p.isAlive);
      const werewolfVotes: { [targetId: string]: number } = {};

      werewolves.forEach(werewolf => {
        if (werewolf.votedFor) {
          werewolfVotes[werewolf.votedFor] = (werewolfVotes[werewolf.votedFor] || 0) + 1;
        }
      });

      // Find the player with most werewolf votes
      let targetId: string | null = null;
      let maxVotes = 0;

      Object.entries(werewolfVotes).forEach(([playerId, voteCount]) => {
        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          targetId = playerId;
        }
      });

      // Check if target was protected by doctor
      if (targetId) {
        const targetPlayer = game.players[targetId];
        if (targetPlayer && targetPlayer.isProtected) {
          console.log(`Player ${targetId} was protected by doctor`);
          // Store in gameState that someone was attacked but saved
          await update(ref(database, DB_PATHS.gameState(gameCode)), {
            lastNightResult: 'protected'
          });
          return null; // No one dies
        }

        // Eliminate the target
        await this.eliminatePlayer(gameCode, targetId);
        await update(ref(database, DB_PATHS.gameState(gameCode)), {
          eliminatedPlayer: targetId,
          lastNightResult: 'killed'
        });
        console.log(`Player ${targetId} was eliminated by werewolves`);
        return targetId;
      }

      return null;
    } catch (error) {
      console.error('Failed to process night actions:', error);
      throw error;
    }
  }

  /**
   * Tally votes and eliminate the player with most votes
   * Returns the eliminated player ID (or null if tie)
   */
  async tallyVotes(gameCode: string): Promise<string | null> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      const gameSnapshot = await get(gameRef);

      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }

      const game: Game = gameSnapshot.val();
      const players = Object.values(game.players);
      const alivePlayers = players.filter(p => p.isAlive);

      // Tally votes from alive players
      const voteCounts: { [targetId: string]: number } = {};

      alivePlayers.forEach(player => {
        if (player.votedFor) {
          voteCounts[player.votedFor] = (voteCounts[player.votedFor] || 0) + 1;
        }
      });

      // Find player(s) with most votes
      let maxVotes = 0;
      const candidates: string[] = [];

      Object.entries(voteCounts).forEach(([playerId, voteCount]) => {
        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          candidates.length = 0;
          candidates.push(playerId);
        } else if (voteCount === maxVotes && voteCount > 0) {
          candidates.push(playerId);
        }
      });

      // If tie, no one is eliminated
      if (candidates.length !== 1 || maxVotes === 0) {
        console.log('Vote resulted in tie or no votes - no elimination');
        await update(ref(database, DB_PATHS.gameState(gameCode)), {
          eliminatedPlayer: null,
          voteResult: 'tie'
        });
        return null;
      }

      const eliminatedId = candidates[0];
      await this.eliminatePlayer(gameCode, eliminatedId);
      await update(ref(database, DB_PATHS.gameState(gameCode)), {
        eliminatedPlayer: eliminatedId,
        voteResult: 'success'
      });

      console.log(`Player ${eliminatedId} was eliminated by vote with ${maxVotes} votes`);
      return eliminatedId;
    } catch (error) {
      console.error('Failed to tally votes:', error);
      throw error;
    }
  }

  /**
   * Store detective investigation result
   */
  async investigatePlayer(gameCode: string, detectiveId: string, targetId: string): Promise<void> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      const gameSnapshot = await get(gameRef);

      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }

      const game: Game = gameSnapshot.val();
      const targetPlayer = game.players[targetId];

      if (!targetPlayer) {
        throw new Error('Target player not found');
      }

      // Determine if target is werewolf or villager (detective only sees team, not exact role)
      const result = targetPlayer.role === 'werewolf' ? 'werewolf' : 'villager';

      // Store investigation result on detective's player object
      const detectiveRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${detectiveId}/lastInvestigation`);
      await set(detectiveRef, {
        targetId,
        targetName: targetPlayer.name,
        result,
        round: game.gameState.round
      });

      console.log(`Detective ${detectiveId} investigated ${targetId}, result: ${result}`);
    } catch (error) {
      console.error('Failed to investigate player:', error);
      throw error;
    }
  }

  /**
   * Store seer vision result (sees exact role)
   */
  async seerVision(gameCode: string, seerId: string, targetId: string): Promise<void> {
    try {
      const gameRef = ref(database, DB_PATHS.gameByCode(gameCode));
      const gameSnapshot = await get(gameRef);

      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }

      const game: Game = gameSnapshot.val();
      const targetPlayer = game.players[targetId];

      if (!targetPlayer) {
        throw new Error('Target player not found');
      }

      // Seer sees exact role
      const seerRef = ref(database, `${DB_PATHS.gameByCode(gameCode)}/players/${seerId}/lastVision`);
      await set(seerRef, {
        targetId,
        targetName: targetPlayer.name,
        role: targetPlayer.role,
        round: game.gameState.round
      });

      console.log(`Seer ${seerId} viewed ${targetId}, role: ${targetPlayer.role}`);
    } catch (error) {
      console.error('Failed to perform seer vision:', error);
      throw error;
    }
  }

  /**
   * Send a chat message
   */
  async sendMessage(
    gameCode: string,
    senderId: string,
    senderName: string,
    content: string,
    type: 'public' | 'whisper',
    targetId?: string,
    targetName?: string
  ): Promise<void> {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageRef = ref(database, `${DB_PATHS.messages(gameCode)}/${messageId}`);

      const message = {
        id: messageId,
        senderId,
        senderName,
        content,
        timestamp: Date.now(),
        type,
        targetId: targetId || null,
        targetName: targetName || null
      };

      await set(messageRef, message);
      console.log(`Message sent by ${senderName}: ${content}`);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to messages in real-time
   */
  subscribeToMessages(gameCode: string, callback: (messages: any[]) => void): () => void {
    const messagesRef = ref(database, DB_PATHS.messages(gameCode));

    onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesObj = snapshot.val();
        const messagesList = Object.values(messagesObj).sort((a: any, b: any) => a.timestamp - b.timestamp);
        callback(messagesList);
      } else {
        callback([]);
      }
    });

    // Return unsubscribe function
    return () => off(messagesRef);
  }
}

// Export singleton instance
const gameService = new GameService();
export default gameService;
