import React, { useState } from 'react';
import TitlePage from './pages/TitlePage';
import HostGamePage from './pages/HostGamePage';
import PlayerSlotPage from './pages/PlayerSlotPage';
import MainGamePage from './pages/MainGamePage';
import { GameState } from './types';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'title' | 'host' | 'lobby' | 'game'>('title');
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    gamePhase: 'waiting',
    timer: 0
  });

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'title':
        return <TitlePage />;
      case 'host':
        return <HostGamePage />;
      case 'lobby':
        return <PlayerSlotPage players={gameState.players} />;
      case 'game':
        return <MainGamePage gameState={gameState} />;
      default:
        return <TitlePage />;
    }
  };

  return (
    <div className="App">
      {/* Navigation buttons for testing - remove later */}
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <button onClick={() => setCurrentPage('title')}>Title</button>
        <button onClick={() => setCurrentPage('host')}>Host</button>
        <button onClick={() => setCurrentPage('lobby')}>Lobby</button>
        <button onClick={() => setCurrentPage('game')}>Game</button>
      </div>
      
      {renderCurrentPage()}
    </div>
  );
}

export default App;