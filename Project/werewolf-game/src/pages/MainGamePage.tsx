import React, { useEffect, useState } from 'react';
import { GameState } from '../types';
import VoiceChatControls from '../components/VoiceChatControls';

interface MainGamePageProps {
  gameState: GameState;
}

const MainGamePage: React.FC<MainGamePageProps> = ({ gameState }) => {
  const [message, setMessage] = useState('');
  type MessageType = 'public' | 'whisper';
  interface ChatMessage { 
    id: number; 
    content: string; 
    timestamp: Date; 
    type: MessageType; 
    to?: string | null; 
    toName?: string | null;
  }
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageType, setMessageType] = useState<MessageType>('public');
  const [whisperTarget, setWhisperTarget] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('werewolf_notes');
    if (saved) setNotes(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('werewolf_notes', notes);
  }, [notes]);

  const getTimestamp = (d = new Date()) => {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const minuteStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${minuteStr} ${ampm}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 0, 0, 0.1) 2px, rgba(139, 0, 0, 0.1) 4px)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        
        .pixel-title {
          font-family: 'Press Start 2P', cursive;
          image-rendering: pixelated;
        }
        
        .pixel-text {
          font-family: 'VT323', monospace;
          image-rendering: pixelated;
        }
        
        .pixel-border {
          box-shadow: 
            0 0 0 2px #8B0000,
            0 0 0 4px #000,
            inset 0 0 0 2px #8B0000;
        }
        
        .pixel-button {
          box-shadow: 
            4px 0 0 #000,
            -4px 0 0 #000,
            0 4px 0 #000,
            0 -4px 0 #000,
            4px 4px 0 #000,
            -4px -4px 0 #000,
            4px -4px 0 #000,
            -4px 4px 0 #000;
          transition: all 0.1s;
        }
        
        .pixel-button:hover {
          transform: translate(2px, 2px);
          box-shadow: 
            2px 0 0 #000,
            -2px 0 0 #000,
            0 2px 0 #000,
            0 -2px 0 #000;
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(to bottom, #2a0000, #000)',
        padding: '20px',
        borderBottom: '3px solid #8B0000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h1 className="pixel-title" style={{
            margin: '0 0 5px 0',
            fontSize: '1.5rem',
            color: '#DC143C',
            textShadow: '2px 2px 0 #000'
          }}>
            WEREWOLF KILL GAME
          </h1>
          <p className="pixel-text" style={{
            margin: 0,
            color: '#888',
            fontSize: '1.2rem'
          }}>
            Discuss, deduce, survive.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pixel-text" style={{
            fontSize: '1.3rem',
            marginBottom: '5px',
            color: '#DC143C'
          }}>
            Time Remaining: <strong style={{ color: '#FFD700' }}>{gameState.timer}s</strong>
          </div>
          <div className="pixel-text" style={{
            fontSize: '1.1rem',
            color: '#888'
          }}>
            Phase: {gameState.gamePhase}
          </div>
        </div>
        <div className="pixel-text" style={{
          fontSize: '1.2rem',
          color: '#DC143C'
        }}>
          Your Role: <strong style={{ color: '#FFD700' }}>[Role Name]</strong>
        </div>
      </div>

      {/* Voice Chat Controls */}
      <div style={{
        background: 'linear-gradient(to bottom, #1a0000, #000)',
        padding: '15px 20px',
        borderBottom: '2px solid #8B0000'
      }}>
        <VoiceChatControls
          gameCode="test-game-123"
          playerName="Player"
          gamePhase={gameState.gamePhase}
          playerRole="villager"
          autoJoin={true}
        />
      </div>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '250px 1fr 350px',
        height: 'calc(100vh - 140px)',
        gap: '0'
      }}>
        {/* Left Panel - Players */}
        <div className="pixel-border" style={{
          background: 'linear-gradient(to bottom, #4a0000, #000)',
          padding: '20px',
          overflowY: 'auto',
          borderRight: '3px solid #8B0000'
        }}>
          <h3 className="pixel-title" style={{ 
            margin: '0 0 15px 0',
            fontSize: '1rem',
            textAlign: 'center',
            color: '#DC143C'
          }}>
            PLAYERS ({gameState.players.length})
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            {gameState.players.map(player => (
              <div 
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className="pixel-text"
                style={{
                  padding: '12px',
                  margin: '8px 0',
                  backgroundColor: selectedPlayer === player.id ? '#228B22' : '#000',
                  border: '2px solid #8B0000',
                  color: '#DC143C',
                  cursor: 'pointer',
                  opacity: player.isAlive ? 1 : 0.5,
                  textDecoration: player.isAlive ? 'none' : 'line-through',
                  transition: 'all 0.2s',
                  fontSize: '1.1rem'
                }}
              >
                {player.name}
              </div>
            ))}
          </div>
          
          <button 
            disabled={!selectedPlayer}
            className="pixel-button pixel-text"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: selectedPlayer ? '#8B0000' : '#3a0000',
              color: 'white',
              border: 'none',
              cursor: selectedPlayer ? 'pointer' : 'not-allowed',
              fontSize: '1rem'
            }}
          >
            Vote to Eliminate
          </button>
        </div>

        {/* Center Panel - Chat */}
        <div style={{
          background: 'linear-gradient(to bottom, #1a0000, #000)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px'
        }}>
          {/* Chat Messages */}
          <div className="pixel-border" style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#000',
            padding: '15px',
            marginBottom: '15px'
          }}>
            {messages.map((msg, index) => (
              <div key={index} className="pixel-text" style={{
                padding: '10px',
                marginBottom: '8px',
                backgroundColor: msg.type === 'whisper' ? '#1a3a5a' : '#2a0000',
                border: '1px solid #8B0000',
                fontSize: '1.1rem',
                color: '#DC143C'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{msg.content}</span>
                  <span style={{ 
                    fontSize: '0.9rem',
                    color: '#888',
                    whiteSpace: 'nowrap',
                    marginLeft: '10px'
                  }}>
                    {msg.type === 'whisper' && `(to ${msg.toName}) `}
                    {getTimestamp(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Message Type Selector */}
          <div className="pixel-text" style={{ 
            display: 'flex', 
            gap: '15px', 
            marginBottom: '10px',
            alignItems: 'center',
            fontSize: '1.1rem',
            color: '#DC143C'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input 
                type="radio" 
                name="msgtype" 
                checked={messageType === 'public'} 
                onChange={() => setMessageType('public')}
              />
              Public
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input 
                type="radio" 
                name="msgtype" 
                checked={messageType === 'whisper'} 
                onChange={() => setMessageType('whisper')}
              />
              Whisper
            </label>
            {messageType === 'whisper' && (
              <select 
                value={whisperTarget ?? ''} 
                onChange={(e) => setWhisperTarget(e.target.value || null)}
                className="pixel-text"
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#000',
                  color: '#DC143C',
                  border: '2px solid #8B0000',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select player</option>
                {gameState.players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Chat Input */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              disabled={gameState.gamePhase === 'night'}
              placeholder="Type your message..."
              className="pixel-text"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#000',
                color: '#DC143C',
                border: '2px solid #8B0000',
                fontSize: '1.1rem'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && message.trim()) {
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
              }}
            />
            <button 
              onClick={() => {
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
              }}
              className="pixel-button pixel-text"
              style={{
                padding: '12px 24px',
                backgroundColor: '#228B22',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Send
            </button>
          </div>

          {/* Quick Comments */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
            {['👍', '👎', '🤔', '😱'].map((emoji, i) => (
              <button 
                key={i}
                className="pixel-button"
                style={{
                  padding: '10px 15px',
                  fontSize: '1.5rem',
                  backgroundColor: '#228B22',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const chatMsg: ChatMessage = {
                    id: Date.now(),
                    content: emoji,
                    timestamp: new Date(),
                    type: 'public',
                    to: undefined,
                    toName: undefined
                  };
                  setMessages(prev => [...prev, chatMsg]);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* End Turn Button */}
          <button className="pixel-button pixel-title" style={{
            padding: '12px',
            backgroundColor: '#228B22',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem'
          }}>
            END TURN
          </button>
        </div>

        {/* Right Panel - Notes */}
        <div className="pixel-border" style={{
          background: 'linear-gradient(to bottom, #4a0000, #000)',
          padding: '20px',
          borderLeft: '3px solid #8B0000',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h4 className="pixel-title" style={{
            margin: '0 0 15px 0',
            fontSize: '1rem',
            textAlign: 'center',
            color: '#DC143C'
          }}>
            PRIVATE NOTES
          </h4>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your private notes here...&#10;Use one line per bullet."
            className="pixel-text"
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#fffbe6',
              color: '#111',
              border: '2px solid #8B0000',
              fontSize: '1.1rem',
              resize: 'none',
              marginBottom: '10px'
            }}
          />

          <div style={{
            backgroundColor: '#000',
            border: '2px solid #8B0000',
            padding: '12px',
            marginBottom: '10px',
            minHeight: '150px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <h5 className="pixel-text" style={{
              margin: '0 0 10px 0',
              fontSize: '1.1rem',
              color: '#DC143C'
            }}>Preview</h5>
            {notes.split('\n').filter(line => line.trim()).length === 0 ? (
              <div className="pixel-text" style={{
                color: '#888',
                fontSize: '1rem'
              }}>No notes yet...</div>
            ) : (
              <ul className="pixel-text" style={{
                margin: 0,
                paddingLeft: '20px',
                lineHeight: 1.6,
                color: '#DC143C'
              }}>
                {notes.split('\n').filter(line => line.trim()).map((line, i) => (
                  <li key={i} style={{ fontSize: '1rem' }}>{line}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="pixel-text" style={{ 
            textAlign: 'right', 
            color: '#888', 
            fontSize: '1rem',
            marginBottom: '10px'
          }}>
            {notes.length} chars
          </div>

          <button 
            onClick={() => {
              if (window.confirm('Clear all notes?')) {
                setNotes('');
                localStorage.removeItem('werewolf_notes');
              }
            }}
            className="pixel-button pixel-text"
            style={{
              padding: '10px',
              backgroundColor: '#228B22',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainGamePage;