import React, { useEffect, useState } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { ROLE_DEFINITIONS } from '../firebase/rolesConfig';
import VoiceChatControls from '../components/VoiceChatControls';
import gameService from '../firebase/gameService';

const MainGamePage: React.FC = () => {
  const {
    currentPhase,
    timeLeft,
    players,
    round,
    currentUserId,
    gameStatus,
    gameStateData,
    gameCode,
    submitVote,
    protectPlayer,
    investigatePlayer,
    seerVision,
    sendMessage: sendMessageToFirebase
  } = useGameContext();
  const [message, setMessage] = useState('');
  type MessageType = 'public' | 'whisper';
  interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    type: MessageType;
    targetId?: string | null;
    targetName?: string | null;
  }
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageType, setMessageType] = useState<MessageType>('public');
  const [whisperTarget, setWhisperTarget] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [actionTaken, setActionTaken] = useState(false);

  // Get current player
  const currentPlayer = players.find(p => p.id === currentUserId);
  const currentRole = currentPlayer?.role || '';
  const isAlive = currentPlayer?.isAlive ?? true;

  // Reset action taken when phase changes
  useEffect(() => {
    setActionTaken(false);
    setSelectedPlayer(null);
  }, [currentPhase, round]);

  useEffect(() => {
    const saved = localStorage.getItem('werewolf_notes');
    if (saved) setNotes(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('werewolf_notes', notes);
  }, [notes]);

  // Subscribe to messages from Firebase
  useEffect(() => {
    if (!gameCode) return;

    const unsubscribe = gameService.subscribeToMessages(gameCode, (firebaseMessages: any[]) => {
      // Filter messages: show public messages to everyone, whispers only to sender and target
      const filteredMessages = firebaseMessages.filter(msg => {
        if (msg.type === 'public') return true;
        if (msg.type === 'whisper') {
          return msg.senderId === currentUserId || msg.targetId === currentUserId;
        }
        return false;
      });
      setMessages(filteredMessages);
    });

    return () => unsubscribe();
  }, [gameCode, currentUserId]);

  // Handle player leaving when closing tab
  useEffect(() => {
    if (!gameCode || !currentUserId) return;

    const handleBeforeUnload = async () => {
      // Remove player from game when closing tab
      await gameService.leaveGame(gameCode, currentUserId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also leave game when component unmounts
      handleBeforeUnload();
    };
  }, [gameCode, currentUserId]);

  const getTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const minuteStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${minuteStr} ${ampm}`;
  };

  // Handle role-specific night actions
  const handleNightAction = async () => {
    if (!selectedPlayer || actionTaken) return;

    try {
      switch (currentRole) {
        case 'werewolf':
          await submitVote(selectedPlayer);
          setActionTaken(true);
          break;
        case 'doctor':
          await protectPlayer(selectedPlayer);
          setActionTaken(true);
          break;
        case 'detective':
          await investigatePlayer(selectedPlayer);
          setActionTaken(true);
          break;
        case 'seer':
          await seerVision(selectedPlayer);
          setActionTaken(true);
          break;
      }
    } catch (error) {
      console.error('Failed to perform action:', error);
    }
  };

  // Get action button text based on role and phase
  const getActionButtonText = () => {
    if (actionTaken) return 'Action Submitted';

    if (currentPhase === 'night') {
      switch (currentRole) {
        case 'werewolf': return 'Vote to Kill';
        case 'doctor': return 'Protect Player';
        case 'detective': return 'Investigate Player';
        case 'seer': return 'View Role';
        default: return 'No Action';
      }
    }

    if (currentPhase === 'voting') {
      return 'Vote to Eliminate';
    }

    return 'No Action';
  };

  // Get werewolf teammates for display during night
  const getWerewolfTeam = () => {
    return players.filter(p => p.role === 'werewolf' && p.isAlive);
  };

  // Get phase message
  const getPhaseMessage = () => {
    if (gameStatus === 'finished') {
      return 'Game Over!';
    }

    switch (currentPhase) {
      case 'night':
        if (currentRole === 'werewolf') {
          return 'Werewolves, choose your victim...';
        } else if (currentRole === 'doctor') {
          return 'Doctor, choose who to protect...';
        } else if (currentRole === 'detective') {
          return 'Detective, choose who to investigate...';
        } else if (currentRole === 'seer') {
          return 'Seer, choose whose role to see...';
        } else {
          return 'Night time... sleep tight.';
        }
      case 'day':
        return 'Morning has come. Review what happened last night.';
      case 'discussion':
        return 'Discuss who you think the werewolf is!';
      case 'voting':
        return 'Time to vote! Choose who to eliminate.';
      case 'results':
        return 'Votes are being counted...';
      default:
        return 'Welcome to Werewolf!';
    }
  };

  // Determine if player can take action
  const canTakeAction = () => {
    if (!isAlive || actionTaken) return false;

    if (currentPhase === 'night') {
      return ['werewolf', 'doctor', 'detective', 'seer'].includes(currentRole);
    }

    if (currentPhase === 'voting') {
      return true;
    }

    return false;
  };

  // Show game over screen
  if (gameStatus === 'finished' && gameStateData.winningSide) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 0, 0, 0.1) 2px, rgba(139, 0, 0, 0.1) 4px)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
          .pixel-title { font-family: 'Press Start 2P', cursive; image-rendering: pixelated; }
          .pixel-text { font-family: 'VT323', monospace; image-rendering: pixelated; }
          .pixel-border { box-shadow: 0 0 0 2px #8B0000, 0 0 0 4px #000, inset 0 0 0 2px #8B0000; }
        `}</style>

        <div className="pixel-border" style={{
          backgroundColor: '#1a0000',
          padding: '40px',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <h1 className="pixel-title" style={{
            fontSize: '2.5rem',
            color: gameStateData.winningSide === 'werewolves' ? '#DC143C' : '#FFD700',
            marginBottom: '20px',
            textShadow: '3px 3px 0 #000'
          }}>
            GAME OVER
          </h1>

          <div className="pixel-text" style={{ fontSize: '1.8rem', marginBottom: '30px', color: '#DC143C' }}>
            {gameStateData.winningSide === 'werewolves' ? '🐺 WEREWOLVES WIN! 🐺' : '👨‍🌾 VILLAGERS WIN! 👨‍🌾'}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 className="pixel-title" style={{ fontSize: '1rem', color: '#FFD700', marginBottom: '15px' }}>
              FINAL STANDINGS
            </h3>
            {players.map(player => (
              <div key={player.id} className="pixel-text" style={{
                padding: '10px',
                marginBottom: '8px',
                backgroundColor: '#000',
                border: '2px solid #8B0000',
                fontSize: '1.1rem',
                color: player.isAlive ? '#00FF00' : '#888',
                textDecoration: player.isAlive ? 'none' : 'line-through'
              }}>
                {ROLE_DEFINITIONS[player.role]?.icon} {player.name} - {ROLE_DEFINITIONS[player.role]?.name}
                {!player.isAlive && ' ☠️'}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 0, 0, 0.1) 2px, rgba(139, 0, 0, 0.1) 4px)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      position: 'relative'
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
            Time Remaining: <strong style={{ color: '#FFD700' }}>{timeLeft}s</strong>
          </div>
          <div className="pixel-text" style={{
            fontSize: '1.1rem',
            color: '#888'
          }}>
            Phase: {currentPhase} | Round: {round}
          </div>
        </div>
        <div className="pixel-text" style={{
          fontSize: '1.2rem',
          color: '#DC143C'
        }}>
          Your Role: <strong style={{ color: '#FFD700' }}>
            {currentRole ? ROLE_DEFINITIONS[currentRole]?.icon + ' ' + ROLE_DEFINITIONS[currentRole]?.name : 'Unknown'}
          </strong>
        </div>
        <div className="pixel-text" style={{
          fontSize: '1rem',
          color: '#FFD700',
          fontStyle: 'italic',
          width: '100%',
          textAlign: 'center'
        }}>
          {getPhaseMessage()}
        </div>
      </div>

      {/* Voice Chat Controls */}
      {gameCode && currentPlayer && (
        <div style={{
          background: 'linear-gradient(to bottom, #1a0000, #000)',
          padding: '8px 20px',
          borderBottom: '2px solid #8B0000'
        }}>
          <VoiceChatControls
            gameCode={gameCode}
            playerName={currentPlayer.name}
            gamePhase={currentPhase}
            playerRole={currentRole}
            autoJoin={true}
          />
        </div>
      )}

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
            PLAYERS ({players.length})
          </h3>

          {/* Show werewolf team during night */}
          {currentPhase === 'night' && currentRole === 'werewolf' && (
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: '#1a0000',
              border: '2px solid #DC143C'
            }}>
              <div className="pixel-text" style={{ color: '#DC143C', fontSize: '1rem', marginBottom: '5px' }}>
                🐺 Your Pack:
              </div>
              {getWerewolfTeam().map(wolf => (
                <div key={wolf.id} className="pixel-text" style={{ color: '#FFD700', fontSize: '0.9rem' }}>
                  • {wolf.name}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
            {players.map(player => {
              const canSelectThisPlayer = isAlive && player.isAlive && player.id !== currentUserId;

              return (
                <div
                  key={player.id}
                  onClick={() => canSelectThisPlayer && setSelectedPlayer(player.id)}
                  className="pixel-text"
                  style={{
                    padding: '12px',
                    margin: '8px 0',
                    backgroundColor: selectedPlayer === player.id ? '#228B22' : '#000',
                    border: `2px solid ${player.id === currentUserId ? '#FFD700' : '#8B0000'}`,
                    color: player.id === currentUserId ? '#FFD700' : '#DC143C',
                    cursor: canSelectThisPlayer ? 'pointer' : 'default',
                    opacity: player.isAlive ? 1 : 0.5,
                    textDecoration: player.isAlive ? 'none' : 'line-through',
                    transition: 'all 0.2s',
                    fontSize: '1.1rem'
                  }}
                >
                  {player.name} {player.id === currentUserId && '(You)'}
                  {!player.isAlive && ' ☠️'}
                </div>
              );
            })}
          </div>

          <button
            disabled={!selectedPlayer || !canTakeAction()}
            onClick={async () => {
              if (currentPhase === 'voting') {
                await submitVote(selectedPlayer!);
                setActionTaken(true);
              } else if (currentPhase === 'night') {
                await handleNightAction();
              }
            }}
            className="pixel-button pixel-text"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: (selectedPlayer && canTakeAction()) ? '#8B0000' : '#3a0000',
              color: 'white',
              border: 'none',
              cursor: (selectedPlayer && canTakeAction()) ? 'pointer' : 'not-allowed',
              fontSize: '1rem'
            }}
          >
            {getActionButtonText()}
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
            {messages.map((msg) => (
              <div key={msg.id} className="pixel-text" style={{
                padding: '10px',
                marginBottom: '8px',
                backgroundColor: msg.type === 'whisper' ? '#1a3a5a' : '#2a0000',
                border: '1px solid #8B0000',
                fontSize: '1.1rem',
                color: '#DC143C'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: msg.senderId === currentUserId ? '#FFD700' : '#DC143C' }}>
                      {msg.senderName}
                      {msg.senderId === currentUserId && ' (You)'}:
                    </strong>
                    {' '}
                    <span>{msg.content}</span>
                    {msg.type === 'whisper' && (
                      <span style={{ fontSize: '0.9rem', color: '#888', fontStyle: 'italic' }}>
                        {' '}(whisper to {msg.targetName})
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#888',
                    whiteSpace: 'nowrap',
                    marginLeft: '10px'
                  }}>
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
                {players.map(p => (
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
              disabled={currentPhase === 'night'}
              placeholder={currentPhase === 'night' ? 'Chat disabled during night...' : 'Type your message...'}
              className="pixel-text"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#000',
                color: '#DC143C',
                border: '2px solid #8B0000',
                fontSize: '1.1rem'
              }}
              onKeyPress={async (e) => {
                if (e.key === 'Enter' && message.trim()) {
                  const targetName = messageType === 'whisper'
                    ? players.find(p => p.id === whisperTarget)?.name
                    : undefined;

                  await sendMessageToFirebase(
                    message.trim(),
                    messageType,
                    whisperTarget || undefined,
                    targetName
                  );
                  setMessage('');
                }
              }}
            />
            <button
              onClick={async () => {
                if (message.trim()) {
                  const targetName = messageType === 'whisper'
                    ? players.find(p => p.id === whisperTarget)?.name
                    : undefined;

                  await sendMessageToFirebase(
                    message.trim(),
                    messageType,
                    whisperTarget || undefined,
                    targetName
                  );
                  setMessage('');
                }
              }}
              disabled={currentPhase === 'night'}
              className="pixel-button pixel-text"
              style={{
                padding: '12px 24px',
                backgroundColor: currentPhase === 'night' ? '#3a3a3a' : '#228B22',
                color: 'white',
                border: 'none',
                cursor: currentPhase === 'night' ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              Send
            </button>
          </div>

          {/* Quick Comments */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['👍', '👎', '🤔', '😱'].map((emoji, i) => (
              <button
                key={i}
                disabled={currentPhase === 'night'}
                className="pixel-button"
                style={{
                  padding: '10px 15px',
                  fontSize: '1.5rem',
                  backgroundColor: currentPhase === 'night' ? '#3a3a3a' : '#228B22',
                  border: 'none',
                  cursor: currentPhase === 'night' ? 'not-allowed' : 'pointer'
                }}
                onClick={async () => {
                  await sendMessageToFirebase(emoji, 'public');
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
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

      {/* Phase Results Overlay */}
      {currentPhase === 'day' && gameStateData.eliminatedPlayer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="pixel-border" style={{
            backgroundColor: '#1a0000',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h2 className="pixel-title" style={{
              fontSize: '1.5rem',
              color: '#DC143C',
              marginBottom: '20px'
            }}>
              NIGHT PHASE RESULTS
            </h2>

            {gameStateData.lastNightResult === 'killed' && (
              <>
                <div className="pixel-text" style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#FF0000' }}>
                  ☠️ SOMEONE HAS DIED ☠️
                </div>
                <div className="pixel-text" style={{ fontSize: '1.3rem', color: '#FFD700' }}>
                  {players.find(p => p.id === gameStateData.eliminatedPlayer)?.name} was killed by werewolves!
                </div>
              </>
            )}

            {gameStateData.lastNightResult === 'protected' && (
              <>
                <div className="pixel-text" style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#00FF00' }}>
                  ✨ A LIFE WAS SAVED ✨
                </div>
                <div className="pixel-text" style={{ fontSize: '1.3rem', color: '#FFD700' }}>
                  The doctor protected someone from the werewolves!
                </div>
              </>
            )}

            {!gameStateData.lastNightResult && (
              <div className="pixel-text" style={{ fontSize: '1.3rem', color: '#FFD700' }}>
                The night was quiet... no one died.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Phase Overlay */}
      {currentPhase === 'results' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="pixel-border" style={{
            backgroundColor: '#1a0000',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h2 className="pixel-title" style={{
              fontSize: '1.5rem',
              color: '#DC143C',
              marginBottom: '20px'
            }}>
              VOTING RESULTS
            </h2>

            {gameStateData.voteResult === 'success' && gameStateData.eliminatedPlayer && (
              <>
                <div className="pixel-text" style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#FF0000' }}>
                  ⚖️ THE VILLAGE HAS SPOKEN ⚖️
                </div>
                <div className="pixel-text" style={{ fontSize: '1.3rem', color: '#FFD700' }}>
                  {players.find(p => p.id === gameStateData.eliminatedPlayer)?.name} has been eliminated!
                </div>
                <div className="pixel-text" style={{ fontSize: '1.1rem', color: '#888', marginTop: '15px' }}>
                  They were a {ROLE_DEFINITIONS[players.find(p => p.id === gameStateData.eliminatedPlayer)?.role || '']?.name}
                </div>
              </>
            )}

            {gameStateData.voteResult === 'tie' && (
              <>
                <div className="pixel-text" style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#FFD700' }}>
                  🤝 IT'S A TIE 🤝
                </div>
                <div className="pixel-text" style={{ fontSize: '1.3rem', color: '#DC143C' }}>
                  No one could agree... no one was eliminated.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Investigation Results (Detective/Seer) */}
      {currentPlayer?.lastInvestigation && currentPlayer.lastInvestigation.round === round && (currentPhase === 'day' || currentPhase === 'discussion') && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999
        }}>
          <div className="pixel-border" style={{
            backgroundColor: '#1a3a5a',
            padding: '20px',
            maxWidth: '300px'
          }}>
            <div className="pixel-title" style={{ fontSize: '0.8rem', color: '#FFD700', marginBottom: '10px' }}>
              🔍 INVESTIGATION RESULT
            </div>
            <div className="pixel-text" style={{ fontSize: '1.1rem', color: 'white' }}>
              {currentPlayer.lastInvestigation.targetName} is a{' '}
              <strong style={{ color: currentPlayer.lastInvestigation.result === 'werewolf' ? '#FF0000' : '#00FF00' }}>
                {currentPlayer.lastInvestigation.result.toUpperCase()}
              </strong>
            </div>
          </div>
        </div>
      )}

      {currentPlayer?.lastVision && currentPlayer.lastVision.round === round && (currentPhase === 'day' || currentPhase === 'discussion') && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999
        }}>
          <div className="pixel-border" style={{
            backgroundColor: '#3a1a5a',
            padding: '20px',
            maxWidth: '300px'
          }}>
            <div className="pixel-title" style={{ fontSize: '0.8rem', color: '#FFD700', marginBottom: '10px' }}>
              👁️ SEER VISION
            </div>
            <div className="pixel-text" style={{ fontSize: '1.1rem', color: 'white' }}>
              {currentPlayer.lastVision.targetName} is a{' '}
              <strong style={{ color: '#FFD700' }}>
                {ROLE_DEFINITIONS[currentPlayer.lastVision.role]?.name.toUpperCase()}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainGamePage;