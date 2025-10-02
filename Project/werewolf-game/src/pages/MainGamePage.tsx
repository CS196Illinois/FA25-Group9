// src/pages/MainGamePage.tsx
// ASSIGNED TO: Tjudge (tjudge2), Jayden (jsbali2), Subash (subashs2) - WORK TOGETHER
import React, { useEffect, useRef, useState } from 'react';
import { GameState, Player } from '../types';

interface MainGamePageProps {
  gameState: GameState;
}

const MainGamePage: React.FC<MainGamePageProps> = ({ gameState }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [rightWidth, setRightWidth] = useState<number>(300);
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);
  
  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('werewolf_notes');
    if (saved) setNotes(saved);
  }, []);

  // Save notes to localStorage when they change
  useEffect(() => {
    localStorage.setItem('werewolf_notes', notes);
  }, [notes]);

  // Resizer mouse handlers (global listeners)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const container = document.querySelector('.game-content') as HTMLElement | null;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const min = 200;
      const max = Math.min(600, rect.width - 200);
      if (newWidth >= min && newWidth <= max) setRightWidth(newWidth);
    };

    const onUp = () => { isResizingRef.current = false; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  return (
    <div className="main-game-page">
      {/* TIMER SECTION - All team members work on this together */}
      <div className="game-header">
        <div className="page-title">
  <h1>Werewolf Kill Game</h1>
  <p className="subtitle">Discuss, deduce, survive.</p>
</div>
        <div className="timer">
          <h3>Time Remaining: {gameState.timer}s</h3>
          <div className="phase">Phase: {gameState.gamePhase}</div>
        </div>
        
        <div className="role-display">
          <h4>Your Role: [Role Name]</h4>
          {/* TODO: Show role card and abilities */}
        </div>
      </div>

      <div className="game-content">
        {/* PLAYER LIST SECTION - All team members work on this together */}
        <div className="left-panel">
          <h3>Players ({gameState.players.length})</h3>
          <div className="player-list">
            {gameState.players.map(player => (
              <div 
                key={player.id} 
                className={`player ${player.isAlive ? 'alive' : 'dead'} ${selectedPlayer === player.id ? 'selected' : ''}`}
                onClick={() => setSelectedPlayer(player.id)}
              >
                <span>{player.name}</span>
                {/* TODO: Add voting buttons during voting phase */}
                {/* TODO: Show status indicators */}
              </div>
            ))}
          </div>
          
          {/* TODO: Add voting section */}
          <div className="voting-section">
            <button disabled={!selectedPlayer}>Vote to Eliminate</button>
          </div>
        </div>

        {/* CHAT SECTION - All team members work on this together */}
        <div className="center-panel">
          <div className="chat-box">
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className="message">{msg}</div>
              ))}
              {/* TODO: Handle different message types (public, whisper, system) */}
              {/* TODO: Add message timestamps */}
            </div>
            
            <div className="chat-input">
              <input 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={gameState.gamePhase === 'night'}
              />
              <button onClick={() => {
                if (message.trim()) {
                  setMessages([...messages, message]);
                  setMessage('');
                }
              }}>Send</button>
            </div>
            
            {/* TODO: Quick comment buttons */}
            <div className="quick-comments">
              <button>👍</button>
              <button>👎</button>
              <button>🤔</button>
              <button>😱</button>
            </div>
          </div>
        </div>

        {/* NOTES SECTION - All team members work on this together */}
        <div className="right-panel" style={{ width: rightWidth }}>
          <div className="notes-pad">
            <h4>Private Notes</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your private notes here..."
              rows={15}
            />
            <div className="notes-actions">
              <button onClick={() => {
                setNotes('');
                localStorage.removeItem('werewolf_notes');
              }}>Clear</button>
            </div>
          </div>
          <div
            ref={resizerRef}
            className="resizer"
            onMouseDown={() => { isResizingRef.current = true; }}
            onDoubleClick={() => setRightWidth(300)}
          />
        </div>
      </div>

      {/* GAME ACTIONS SECTION - All team members work on this together */}
      <div className="game-actions">
        {/* TODO: Add role-specific action buttons */}
        {/* TODO: Add phase transition handling */}
        <button>End Turn</button>
      </div>
    </div>
  );
};

export default MainGamePage;
