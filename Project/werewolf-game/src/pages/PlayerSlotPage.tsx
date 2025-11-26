import React, { useState, useEffect } from "react";
import { useGameContext } from '../contexts/GameContext';

interface PlayerSlotPageProps {
  initialGameCode?: string;
}

const PlayerSlotPage: React.FC<PlayerSlotPageProps> = ({ initialGameCode }) => {
  const [gameCodeInput, setGameCodeInput] = useState<string>(initialGameCode || '');
  const [playerNameInput, setPlayerNameInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Update game code if initialGameCode prop changes
  useEffect(() => {
    if (initialGameCode) {
      setGameCodeInput(initialGameCode);
    }
  }, [initialGameCode]);

  const {
    gameCode,
    players,
    settings,
    currentUserId,
    joinGame,
    setPlayerReady,
    leaveGame: contextLeaveGame
  } = useGameContext();

  const handleJoinGame = async (): Promise<void> => {
    if (!gameCodeInput.trim()) {
      setErrorMessage('Please enter a game code');
      return;
    }

    if (!playerNameInput.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }

    setErrorMessage('');
    setIsJoining(true);

    try {
      await joinGame(gameCodeInput.toUpperCase().trim(), playerNameInput.trim());
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  const handleToggleReady = async (): Promise<void> => {
    const currentPlayer = players.find(p => p.id === currentUserId);
    if (!currentPlayer) return;

    try {
      await setPlayerReady(!currentPlayer.isReady);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update ready status');
    }
  };

  const handleLeaveGame = async (): Promise<void> => {
    try {
      await contextLeaveGame();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to leave game');
    }
  };

  const currentPlayer = players.find(p => p.id === currentUserId);

  // If not joined a game, show join form
  if (!gameCode) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 0, 0, 0.1) 2px, rgba(139, 0, 0, 0.1) 4px)',
        padding: '20px'
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

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 className="pixel-title" style={{
              fontSize: '3rem',
              color: '#DC143C',
              textShadow: '4px 4px 0 #000, -2px -2px 0 #8B0000',
              letterSpacing: '0.1em'
            }}>
              JOIN GAME
            </h1>
          </div>

          <div className="pixel-border" style={{
            background: 'linear-gradient(to bottom, #4a0000, #000)',
            padding: '30px'
          }}>
            {/* Game Code Input */}
            <div style={{ marginBottom: '20px' }}>
              <label className="pixel-text" style={{
                display: 'block',
                fontSize: '1.2rem',
                color: '#DC143C',
                marginBottom: '10px'
              }}>
                Game Code:
              </label>
              <input
                type="text"
                value={gameCodeInput}
                onChange={(e) => setGameCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter game code"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  color: '#DC143C',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '0.3em',
                  outline: 'none'
                }}
                className="pixel-text"
              />
            </div>

            {/* Player Name Input */}
            <div style={{ marginBottom: '20px' }}>
              <label className="pixel-text" style={{
                display: 'block',
                fontSize: '1.2rem',
                color: '#DC143C',
                marginBottom: '10px'
              }}>
                Your Name:
              </label>
              <input
                type="text"
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                placeholder="Enter your name"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  color: '#DC143C',
                  fontSize: '1.2rem',
                  outline: 'none'
                }}
                className="pixel-text"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleJoinGame();
                }}
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                marginBottom: '20px',
                backgroundColor: '#8B0000',
                border: '3px solid #DC143C',
                padding: '15px',
                textAlign: 'center'
              }}>
                <p className="pixel-text" style={{
                  color: '#FFD700',
                  fontSize: '1rem',
                  margin: 0
                }}>
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Join Button */}
            <button
              onClick={handleJoinGame}
              disabled={isJoining}
              className="pixel-button pixel-title"
              style={{
                width: '100%',
                backgroundColor: isJoining ? '#555' : '#228B22',
                color: 'white',
                padding: '20px',
                fontSize: '1.2rem',
                border: 'none',
                cursor: isJoining ? 'not-allowed' : 'pointer',
                opacity: isJoining ? 0.6 : 1
              }}
            >
              {isJoining ? 'JOINING...' : 'JOIN GAME'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show lobby after joining
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 0, 0, 0.1) 2px, rgba(139, 0, 0, 0.1) 4px)',
      padding: '20px'
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

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 className="pixel-title" style={{
            fontSize: '3rem',
            color: '#DC143C',
            textShadow: '4px 4px 0 #000, -2px -2px 0 #8B0000',
            letterSpacing: '0.1em'
          }}>
            GAME LOBBY
          </h1>
          <p className="pixel-text" style={{
            fontSize: '1.5rem',
            color: '#DC143C',
            margin: '10px 0'
          }}>
            {players.length}/{settings.totalPlayers} players joined
          </p>
          <p className="pixel-text" style={{
            fontSize: '1.2rem',
            color: '#DC143C',
            margin: '5px 0'
          }}>
            Game Code: <span style={{ color: '#FFD700', letterSpacing: '0.2em' }}>{gameCode}</span>
          </p>
        </div>

        <div className="pixel-border" style={{
          background: 'linear-gradient(to bottom, #4a0000, #000)',
          padding: '30px',
          marginBottom: '20px'
        }}>
          {/* Players List */}
          <div style={{ marginBottom: '20px' }}>
            <h3 className="pixel-text" style={{
              color: '#DC143C',
              fontSize: '1.5rem',
              marginBottom: '15px'
            }}>
              PLAYERS:
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {players.map((player, index) => (
                <div key={player.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: player.id === currentUserId ? '#4a0000' : '#2a0000',
                  padding: '15px',
                  border: player.id === currentUserId ? '3px solid #DC143C' : '2px solid #8B0000',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#DC143C',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '15px',
                      border: '2px solid #000'
                    }} className="pixel-text">
                      {index + 1}
                    </span>
                    <span className="pixel-text" style={{
                      color: '#DC143C',
                      fontSize: '1.3rem'
                    }}>
                      {player.name} {player.isHost && '(HOST)'}
                      {player.id === currentUserId && ' (YOU)'}
                    </span>
                  </div>
                  <span className="pixel-text" style={{
                    color: player.isReady ? '#00FF00' : '#888',
                    fontSize: '1.1rem'
                  }}>
                    {player.isReady ? '✅ READY' : '❌ NOT READY'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              marginBottom: '20px',
              backgroundColor: '#8B0000',
              border: '3px solid #DC143C',
              padding: '15px',
              textAlign: 'center'
            }}>
              <p className="pixel-text" style={{
                color: '#FFD700',
                fontSize: '1rem',
                margin: 0
              }}>
                {errorMessage}
              </p>
            </div>
          )}

          {/* Ready/Leave Buttons */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={handleToggleReady}
              className="pixel-button pixel-title"
              style={{
                padding: '15px 30px',
                backgroundColor: currentPlayer?.isReady ? '#666' : '#228B22',
                color: 'white',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              {currentPlayer?.isReady ? 'UNREADY' : 'READY'}
            </button>
            <button
              onClick={handleLeaveGame}
              className="pixel-button pixel-title"
              style={{
                padding: '15px 30px',
                backgroundColor: '#DC143C',
                color: 'white',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              LEAVE GAME
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerSlotPage;