import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Player } from '../types';
import gameService from '../firebase/gameService';
import { Game, GameSettings as FirebaseGameSettings } from '../firebase/schema';

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
  setPlayers: (players: Player[]) => void;
  setSettings: (settings: GameSettings) => void;
  setGameCode: (code: string) => void;
  advancePhase: () => void;
  createGame: (settings: GameSettings, hostName: string) => Promise<string>;
  joinGame: (gameCode: string, playerName: string) => Promise<void>;
  setPlayerReady: (ready: boolean) => Promise<void>;
  startGame: () => Promise<void>;
  submitVote: (targetId: string) => Promise<void>;
  leaveGame: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

const DEFAULT_SETTINGS: GameSettings = {
  totalPlayers: 6,
  nightDuration: 60,
  dayDuration: 120,
  discussionDuration: 60,
  votingDuration: 45,
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
      setTimeLeft(game.gameState.timeRemaining);
      setRound(game.gameState.round);
      setGameStatus(game.status);

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

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || currentPhase === 'lobby' || currentPhase === 'finished') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (isHost) {
            advancePhase();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, currentPhase, isHost]);

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

  // Advance to next phase (host only)
  const advancePhase = useCallback(async () => {
    if (!gameCode || !isHost) return;

    let nextPhase: Phase;
    let nextTime: number;

    switch (currentPhase) {
      case 'night':
        nextPhase = 'day';
        nextTime = settings.dayDuration;
        break;
      case 'day':
        nextPhase = 'discussion';
        nextTime = settings.discussionDuration;
        break;
      case 'discussion':
        nextPhase = 'voting';
        nextTime = settings.votingDuration;
        break;
      case 'voting':
        nextPhase = 'results';
        nextTime = 30;
        break;
      case 'results':
        nextPhase = 'night';
        nextTime = settings.nightDuration;
        break;
      default:
        nextPhase = 'night';
        nextTime = settings.nightDuration;
    }

    try {
      await gameService.updateGamePhase(gameCode, nextPhase, nextTime);

      // Increment round when going back to night
      if (nextPhase === 'night' && currentPhase === 'results') {
        // Round increment is handled by Firebase
      }
    } catch (error) {
      console.error('Failed to advance phase:', error);
    }
  }, [gameCode, isHost, currentPhase, settings]);

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
      setPlayers,
      setSettings,
      setGameCode,
      advancePhase,
      createGame,
      joinGame,
      setPlayerReady,
      startGame,
      submitVote,
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