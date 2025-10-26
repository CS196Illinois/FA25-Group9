import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player } from '../types';

type Phase = 'night' | 'day' | 'discussion' | 'voting' | 'results';

interface GameSettings {
  totalPlayers: number;
}

interface GameContextType {
  currentPhase: Phase;
  timeLeft: number;
  players: Player[];
  round: number;
  settings: GameSettings;
  setPlayers: (players: Player[]) => void;
  setSettings: (settings: GameSettings) => void;
  advancePhase: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPhase, setCurrentPhase] = useState<Phase>('night');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState<number>(1);
  const [settings, setSettings] = useState<GameSettings>({ totalPlayers: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          advancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentPhase]);

  const advancePhase = () => {
    let nextPhase: Phase;
    let nextTime: number;

    switch (currentPhase) {
      case 'night':
        nextPhase = 'day';
        nextTime = 120;
        break;
      case 'day':
        nextPhase = 'discussion';
        nextTime = 60;
        break;
      case 'discussion':
        nextPhase = 'voting';
        nextTime = 45;
        break;
      case 'voting':
        nextPhase = 'results';
        nextTime = 30;
        break;
      case 'results':
        nextPhase = 'night';
        nextTime = 60;
        setRound((prev) => prev + 1);
        break;
      default:
        nextPhase = 'night';
        nextTime = 60;
    }

    setCurrentPhase(nextPhase);
    setTimeLeft(nextTime);
  };

  return (
    <GameContext.Provider value={{
      currentPhase,
      timeLeft,
      players,
      round,
      settings,
      setPlayers,
      setSettings,
      advancePhase,
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