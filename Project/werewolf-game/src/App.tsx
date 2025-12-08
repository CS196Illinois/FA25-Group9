import React, { useState, useEffect } from 'react';
import { GameProvider, useGameContext } from './contexts/GameContext';
import { VoiceChatProvider } from './contexts/VoiceChatContext';
import TitlePage from './pages/TitlePage';
import HostGamePage from './pages/HostGamePage';
import PlayerSlotPage from './pages/PlayerSlotPage';
import MainGamePage from './pages/MainGamePage';
import './App.css';

type Page = 'title' | 'host' | 'lobby' | 'game';

// Inner component that has access to GameContext
const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('title');
  const [urlGameCode, setUrlGameCode] = useState<string | null>(null);
  const { gameStatus, gameCode } = useGameContext();

  // Check URL for /join/:gameCode on mount
  useEffect(() => {
    const path = window.location.pathname;
    const joinMatch = path.match(/\/join\/([A-Z0-9]+)/);
    if (joinMatch && joinMatch[1]) {
      setUrlGameCode(joinMatch[1]);
      setCurrentPage('lobby');
    }
  }, []);

  // Auto-navigate to game when status changes to 'playing'
  useEffect(() => {
    if (gameStatus === 'playing' && gameCode) {
      setCurrentPage('game');
    } else if (gameStatus === 'waiting' && gameCode) {
      // Stay in lobby if waiting
      if (currentPage === 'title' || currentPage === 'host') {
        // Don't auto-navigate if we're still in setup
      }
    }
  }, [gameStatus, gameCode, currentPage]);

  return (
    <VoiceChatProvider>
      <div className="App">
        {currentPage === 'title' && (
          <TitlePage
            onHost={() => setCurrentPage('host')}
            onJoin={() => setCurrentPage('lobby')}
          />
        )}

        {currentPage === 'host' && (
          <HostGamePage />
        )}

        {currentPage === 'lobby' && (
          <PlayerSlotPage initialGameCode={urlGameCode || undefined} />
        )}

        {currentPage === 'game' && (
          <MainGamePage />
        )}
      </div>
    </VoiceChatProvider>
  );
};

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;