// src/pages/MainGamePage.tsx
// ASSIGNED TO: Tjudge (tjudge2), Jayden (jsbali2), Subash (subashs2) - WORK TOGETHER
import React, { useEffect, useRef, useState } from 'react';
import { GameState } from '../types';

interface MainGamePageProps {
  gameState: GameState;
}

const MainGamePage: React.FC<MainGamePageProps> = ({ gameState }) => {
  const [message, setMessage] = useState('');
  type MessageType = 'public' | 'whisper';
  interface ChatMessage { id: number; content: string; timestamp: Date; type: MessageType; to?: string | null; toName?: string | null }
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageType, setMessageType] = useState<MessageType>('public');
  const [whisperTarget, setWhisperTarget] = useState<string | null>(null);
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

  // format a timestamp like "8:05 AM" in 12-hour time (hour no leading zero, minutes padded)
  const getTimestamp = (d = new Date()) => {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12; // midnight or noon -> 12
    const minuteStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${minuteStr} ${ampm}`;
  };

  // styling helper for different message types (returns className string or style token)
  const getMessageStyles = (msg: ChatMessage) => {
    if (msg.type === 'whisper') return 'whisper';
    return 'public';
  };

  // simple icon helper -- returns JSX for an icon per message type
  const getMessageIcon = (type: MessageType) => {
    if (type === 'whisper') return <span style={{ marginRight: 6 }}>🔒</span>;
    return <span style={{ marginRight: 6 }}>💬</span>;
  };

  // (system messages removed) - keep push logic in your game controller if needed

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
                {messages.map((msg, index) => {
                  const cls = `message ${getMessageStyles(msg)}`;
                  if (msg.type === 'whisper') {
                    return (
                      <div key={index} className={cls} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.2rem', color: '#076affff' }}>
                        {getMessageIcon(msg.type)}
                        <span className="message-text" style={{ flex: '0 1 auto' }}>{msg.content}</span>
                        <span className="message-meta" style={{ color: '#666', fontSize: '0.85em', whiteSpace: 'nowrap' }}>(whisper to {msg.toName ?? 'unknown'}) {getTimestamp(msg.timestamp)}</span>
                      </div>
                    );
                  }

                  // public
                  return (
                    <div key={index} className={cls} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.2rem' }}>
                      {getMessageIcon(msg.type)}
                      <span className="message-text" style={{ flex: '0 1 auto' }}>{msg.content}</span>
                      <span className="message-time" style={{ color: '#666', fontSize: '0.9em', whiteSpace: 'nowrap' }}>{getTimestamp(msg.timestamp)}</span>
                    </div>
                  );
                })}
            </div>
            
            <div className="chat-input">
              <div className="message-type-selector" style={{ marginBottom: '0.4rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9em' }}>
                  <input type="radio" name="msgtype" checked={messageType === 'public'} onChange={() => setMessageType('public')} /> Public
                </label>
                <label style={{ fontSize: '0.9em' }}>
                  <input type="radio" name="msgtype" checked={messageType === 'whisper'} onChange={() => setMessageType('whisper')} /> Whisper
                </label>
                {/* System option removed */}
                {messageType === 'whisper' && (
                  <select value={whisperTarget ?? ''} onChange={(e) => setWhisperTarget(e.target.value || null)} style={{ marginLeft: '0.6rem' }}>
                    <option value="">Select player</option>
                    {gameState.players.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <input 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                disabled={gameState.gamePhase === 'night'}
              />
              <button onClick={() => {
                if (message.trim()) {
                  const chatMsg: ChatMessage = {
                    id: Date.now(),
                    content: message.trim(),
                    timestamp: new Date(),
                    type: messageType,
                    to: undefined,
                    toName: undefined
                  };
                  if (messageType === 'whisper') {
                    chatMsg.to = whisperTarget ?? null;
                    chatMsg.toName = gameState.players.find(p => p.id === whisperTarget)?.name ?? null;
                  }
                  setMessages(prev => [...prev, chatMsg]);
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

            <div className="notes-main">
              <textarea
                className="notes-editor"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={"Write your private notes here...\nUse one line per bullet."}
                rows={15}
              />

              {/* Split notes into lines for preview */}
              {/*
                noteLines: string[] - each line of notes, trimmed, non-empty
              */}
              {(() => {
                const noteLines = notes
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line.length > 0);
                return (
                  <div className="notes-preview">
                    <h5>Preview</h5>
                    {noteLines.length === 0 ? (
                      <div className="notes-empty"></div>
                    ) : (
                      <ul className="notes-preview-list">
                        {noteLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="notes-meta">{notes.length} chars</div>

            <div className="notes-actions">
              <button onClick={() => {
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
