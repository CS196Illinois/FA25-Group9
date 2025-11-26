import React, { useState } from 'react';
import { GameProvider } from './contexts/GameContext';
import { VoiceChatProvider } from './contexts/VoiceChatContext';
import TitlePage from './pages/TitlePage';
import HostGamePage from './pages/HostGamePage';
import PlayerSlotPage from './pages/PlayerSlotPage';
import MainGamePage from './pages/MainGamePage';
import './App.css';

type Page = 'title' | 'host' | 'lobby' | 'game';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('title');

  return (
    <GameProvider>
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
            <PlayerSlotPage />
          )}

          {currentPage === 'game' && (
            <MainGamePage />
          )}

          {/* Debug Navigation */}
          <div style={{ position: 'fixed', bottom: 10, left: 10, display: 'flex', gap: '5px' }}>
            <button onClick={() => setCurrentPage('title')}>Title</button>
            <button onClick={() => setCurrentPage('host')}>Host</button>
            <button onClick={() => setCurrentPage('lobby')}>Lobby</button>
            <button onClick={() => setCurrentPage('game')}>Game</button>
          </div>
        </div>
      </VoiceChatProvider>
    </GameProvider>
  );
}

export default App;