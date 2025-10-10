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
    players: [
      { id: 'p1', name: 'Alice', isAlive: true },
      { id: 'p2', name: 'Ben', isAlive: true },
      { id: 'p3', name: 'Cara', isAlive: true },
      { id: 'p4', name: 'Dan', isAlive: true },
      { id: 'p5', name: 'Eve', isAlive: true },
      { id: 'p6', name: 'Fay', isAlive: true },
      { id: 'p7', name: 'Gabe', isAlive: true },
      { id: 'p8', name: 'Hana', isAlive: false }
    ],
    gamePhase: 'voting',
    timer: 180
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