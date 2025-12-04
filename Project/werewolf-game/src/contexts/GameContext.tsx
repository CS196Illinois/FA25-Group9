import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Player } from '../types';
import gameService from '../firebase/gameService';
import { Game, GameSettings as FirebaseGameSettings } from '../firebase/schema';
import { haveWerewolvesWon, haveVillagersWon } from '../firebase/rolesConfig';

type Phase = 'lobby' | 'night' | 'day' | 'discussion' | 'voting' | 'results' | 'finished';

interface GameSettings {
  totalPlayers: number;
  nightDuration: number;
  dayDuration: number;
  discussionDuration: number;
  votingDuration: number;
  usePresetRoles: boolean;
  customRoles: { [roleId: string]: number };
}

interface GameContextType {
  currentPhase: Phase;
  timeLeft: number;
  players: Player[];
  round: number;
  settings: GameSettings;
  gameCode: string | null;
  currentUserId: string | null;
  isHost: boolean;
  gameStatus: 'waiting' | 'playing' | 'finished';
  gameStateData: {
    winningSide?: 'werewolves' | 'villagers';
    eliminatedPlayer?: string;
    lastNightResult?: 'killed' | 'protected';
    voteResult?: 'success' | 'tie';
  };
  setPlayers: (players: Player[]) => void;
  setSettings: (settings: GameSettings) => void;
  setGameCode: (code: string) => void;
  advancePhase: () => void;
  createGame: (settings: GameSettings, hostName: string) => Promise<string>;
  joinGame: (gameCode: string, playerName: string) => Promise<void>;
  setPlayerReady: (ready: boolean) => Promise<void>;
  startGame: () => Promise<void>;
  submitVote: (targetId: string) => Promise<void>;
  protectPlayer: (targetId: string) => Promise<void>;
  investigatePlayer: (targetId: string) => Promise<void>;
  seerVision: (targetId: string) => Promise<void>;
  sendMessage: (content: string, type: 'public' | 'whisper', targetId?: string, targetName?: string) => Promise<void>;
  leaveGame: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

const DEFAULT_SETTINGS: GameSettings = {
  totalPlayers: 6,
  nightDuration: 45,
  dayDuration: 15,
  discussionDuration: 60,
  votingDuration: 30,
  usePresetRoles: true,
  customRoles: {}
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPhase, setCurrentPhase] = useState<Phase>('lobby');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState<number>(0);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [gameStateData, setGameStateData] = useState<{
    winningSide?: 'werewolves' | 'villagers';
    eliminatedPlayer?: string;
    lastNightResult?: 'killed' | 'protected';
    voteResult?: 'success' | 'tie';
  }>({});

  // Subscribe to Firebase game updates
  useEffect(() => {
    if (!gameCode) return;

    console.log('Subscribing to game:', gameCode);
    const unsubscribe = gameService.subscribeToGame(gameCode, (game: Game | null) => {
      if (!game) {
        console.log('Game not found or deleted');
        return;
      }

      console.log('Game updated:', game);
      console.log('Players object:', game.players);
      console.log('Player IDs:', Object.keys(game.players));

      // Update players
      const playersList = Object.values(game.players);
      console.log('Players list:', playersList);
      console.log('Number of players:', playersList.length);
      setPlayers(playersList);

      // Update game state
      setCurrentPhase(game.gameState.currentPhase as Phase);

      // Update time from Firebase - host manages countdown and syncs every 5 seconds
      setTimeLeft(game.gameState.timeRemaining);

      setRound(game.gameState.round);
      setGameStatus(game.status);
      setGameStateData({
        winningSide: game.gameState.winningSide,
        eliminatedPlayer: game.gameState.eliminatedPlayer,
        lastNightResult: game.gameState.lastNightResult,
        voteResult: game.gameState.voteResult
      });

      // Update settings
      setSettings({
        totalPlayers: game.settings.totalPlayers,
        nightDuration: game.settings.nightDuration,
        dayDuration: game.settings.dayDuration,
        discussionDuration: game.settings.discussionDuration,
        votingDuration: game.settings.votingDuration,
        usePresetRoles: game.settings.usePresetRoles,
        customRoles: game.settings.customRoles
      });

      // Check if current user is host
      const userId = gameService.getCurrentUserId();
      if (userId) {
        setCurrentUserId(userId);
        setIsHost(game.hostId === userId);
      }
    });

    return () => {
      console.log('Unsubscribing from game:', gameCode);
      unsubscribe();
    };
  }, [gameCode]);

  // Timer countdown - only host manages the timer
  useEffect(() => {
    if (!isHost || timeLeft <= 0 || currentPhase === 'lobby' || currentPhase === 'finished') return;

    const timer = setInterval(async () => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;

        if (newTime <= 0) {
          advancePhase();
          return 0;
        }

        // Update Firebase every 5 seconds to keep clients in sync
        if (newTime % 5 === 0 && gameCode) {
          gameService.updateGamePhase(gameCode, currentPhase, newTime);
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, currentPhase, isHost, gameCode]);

  // Create a new game
  const createGame = useCallback(async (settings: GameSettings, hostName: string): Promise<string> => {
    try {
      const firebaseSettings: FirebaseGameSettings = {
        totalPlayers: settings.totalPlayers,
        nightDuration: settings.nightDuration,
        dayDuration: settings.dayDuration,
        discussionDuration: settings.discussionDuration,
        votingDuration: settings.votingDuration,
        usePresetRoles: settings.usePresetRoles,
        customRoles: settings.customRoles
      };

      const code = await gameService.createGame(firebaseSettings, hostName);
      setGameCode(code);
      setCurrentUserId(gameService.getCurrentUserId());
      setIsHost(true);
      return code;
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  }, []);

  // Join an existing game
  const joinGame = useCallback(async (code: string, playerName: string): Promise<void> => {
    try {
      await gameService.joinGame(code, playerName);
      setGameCode(code);
      setCurrentUserId(gameService.getCurrentUserId());
      setIsHost(false);
    } catch (error) {
      console.error('Failed to join game:', error);
      throw error;
    }
  }, []);

  // Set player ready status
  const setPlayerReady = useCallback(async (ready: boolean): Promise<void> => {
    if (!gameCode || !currentUserId) return;

    try {
      await gameService.setPlayerReady(gameCode, currentUserId, ready);
    } catch (error) {
      console.error('Failed to set ready status:', error);
      throw error;
    }
  }, [gameCode, currentUserId]);

  // Start the game (host only)
  const startGame = useCallback(async (): Promise<void> => {
    if (!gameCode || !isHost) return;

    try {
      await gameService.startGame(gameCode);
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  }, [gameCode, isHost]);

  // Submit a vote
  const submitVote = useCallback(async (targetId: string): Promise<void> => {
    if (!gameCode || !currentUserId) return;

    try {
      await gameService.submitVote(gameCode, currentUserId, targetId);
    } catch (error) {
      console.error('Failed to submit vote:', error);
      throw error;
    }
  }, [gameCode, currentUserId]);

  // Protect a player (doctor ability)
  const protectPlayer = useCallback(async (targetId: string): Promise<void> => {
    if (!gameCode || !currentUserId) return;

    try {
      await gameService.protectPlayer(gameCode, targetId);
    } catch (error) {
      console.error('Failed to protect player:', error);
      throw error;
    }
  }, [gameCode, currentUserId]);

  // Investigate a player (detective ability)
  const investigatePlayer = useCallback(async (targetId: string): Promise<void> => {
    if (!gameCode || !currentUserId) return;

    try {
      await gameService.investigatePlayer(gameCode, currentUserId, targetId);
    } catch (error) {
      console.error('Failed to investigate player:', error);
      throw error;
    }
  }, [gameCode, currentUserId]);

  // Seer vision (seer ability)
  const seerVision = useCallback(async (targetId: string): Promise<void> => {
    if (!gameCode || !currentUserId) return;

    try {
      await gameService.seerVision(gameCode, currentUserId, targetId);
    } catch (error) {
      console.error('Failed to use seer vision:', error);
      throw error;
    }
  }, [gameCode, currentUserId]);

  // Send a chat message
  const sendMessage = useCallback(async (
    content: string,
    type: 'public' | 'whisper',
    targetId?: string,
    targetName?: string
  ): Promise<void> => {
    if (!gameCode || !currentUserId) return;

    const currentPlayer = players.find(p => p.id === currentUserId);
    if (!currentPlayer) return;

    try {
      await gameService.sendMessage(
        gameCode,
        currentUserId,
        currentPlayer.name,
        content,
        type,
        targetId,
        targetName
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [gameCode, currentUserId, players]);

  // Leave the game
  const leaveGame = useCallback(async (): Promise<void> => {
    if (!gameCode || !currentUserId) return;

    try {
      await gameService.leaveGame(gameCode, currentUserId);
      setGameCode(null);
      setCurrentUserId(null);
      setIsHost(false);
    } catch (error) {
      console.error('Failed to leave game:', error);
      throw error;
    }
  }, [gameCode, currentUserId]);

  // Helper function to convert Player array to object format for win condition checks
  const playersArrayToObject = (playerArray: Player[]): { [key: string]: Player } => {
    const playersObj: { [key: string]: Player } = {};
    playerArray.forEach(player => {
      playersObj[player.id] = player;
    });
    return playersObj;
  };

  // Advance to next phase (host only)
  const advancePhase = useCallback(async () => {
    if (!gameCode || !isHost) return;

    try {
      let nextPhase: Phase;
      let nextTime: number;

      // Process game logic BEFORE transitioning phases
      switch (currentPhase) {
        case 'night':
          // Process night actions (werewolf kills, doctor protection)
          await gameService.processNightActions(gameCode);

          // Clear protections for next round
          await gameService.clearProtections(gameCode);

          // Fetch updated game state to get current alive players after night actions
          const updatedGameAfterNight = await gameService.getGame(gameCode);
          if (updatedGameAfterNight) {
            const updatedPlayersNight = Object.values(updatedGameAfterNight.players);
            const aliveAfterNight = updatedPlayersNight.filter((p: any) => p.isAlive);
            const alivePlayersObj = playersArrayToObject(aliveAfterNight as Player[]);

            if (haveWerewolvesWon(alivePlayersObj)) {
              await gameService.endGame(gameCode, 'werewolves');
              return;
            }
            if (haveVillagersWon(alivePlayersObj)) {
              await gameService.endGame(gameCode, 'villagers');
              return;
            }
          }

          nextPhase = 'day';
          nextTime = settings.dayDuration;
          break;

        case 'day':
          // Day phase is just for discussion/announcement
          nextPhase = 'discussion';
          nextTime = settings.discussionDuration;
          break;

        case 'discussion':
          // Transition to voting phase
          nextPhase = 'voting';
          nextTime = settings.votingDuration;
          break;

        case 'voting':
          // Tally votes and eliminate player
          await gameService.tallyVotes(gameCode);

          // Clear votes for next round
          await gameService.clearVotes(gameCode);

          // Fetch updated game state to get current alive players after elimination
          const updatedGame = await gameService.getGame(gameCode);
          if (updatedGame) {
            const updatedPlayers = Object.values(updatedGame.players);
            const aliveAfterVote = updatedPlayers.filter((p: any) => p.isAlive);
            const aliveAfterVoteObj = playersArrayToObject(aliveAfterVote as Player[]);

            if (haveWerewolvesWon(aliveAfterVoteObj)) {
              await gameService.endGame(gameCode, 'werewolves');
              return;
            }
            if (haveVillagersWon(aliveAfterVoteObj)) {
              await gameService.endGame(gameCode, 'villagers');
              return;
            }
          }

          nextPhase = 'results';
          nextTime = 15;
          break;

        case 'results':
          // Go back to night phase and increment round
          nextPhase = 'night';
          nextTime = settings.nightDuration;
          break;

        default:
          nextPhase = 'night';
          nextTime = settings.nightDuration;
      }

      await gameService.updateGamePhase(gameCode, nextPhase, nextTime);
    } catch (error) {
      console.error('Failed to advance phase:', error);
    }
  }, [gameCode, isHost, currentPhase, settings, players]);

  return (
    <GameContext.Provider value={{
      currentPhase,
      timeLeft,
      players,
      round,
      settings,
      gameCode,
      currentUserId,
      isHost,
      gameStatus,
      gameStateData,
      setPlayers,
      setSettings,
      setGameCode,
      advancePhase,
      createGame,
      joinGame,
      setPlayerReady,
      startGame,
      submitVote,
      protectPlayer,
      investigatePlayer,
      seerVision,
      sendMessage,
      leaveGame,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameContext must be used within a GameProvider');
  return context;
};