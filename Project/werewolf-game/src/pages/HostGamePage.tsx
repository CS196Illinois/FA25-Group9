import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useGameContext } from '../contexts/GameContext';
import { ROLE_DEFINITIONS, getPresetRoles } from '../firebase/rolesConfig';

interface CustomRoleCounts {
  [roleId: string]: number;
}

const HostGamePage: React.FC = () => {
  const [hostName, setHostName] = useState<string>('');
  const [totalPlayers, setTotalPlayers] = useState<number>(6);
  const [usePresetRoles, setUsePresetRoles] = useState<boolean>(true);
  const [customRoles, setCustomRoles] = useState<CustomRoleCounts>({
    werewolf: 2,
    doctor: 1,
    detective: 1,
    seer: 0,
    villager: 2
  });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const { gameCode, players, createGame, startGame, isHost } = useGameContext();

  // Update custom roles when player count changes
  useEffect(() => {
    if (usePresetRoles) {
      setCustomRoles(getPresetRoles(totalPlayers));
    }
  }, [totalPlayers, usePresetRoles]);

  const handleCreateGame = async (): Promise<void> => {
    if (!hostName.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }

    if (totalPlayers < 4 || totalPlayers > 12) {
      setErrorMessage('Player count must be between 4 and 12');
      return;
    }

    // Validate custom roles
    if (!usePresetRoles) {
      const totalRoles = Object.values(customRoles).reduce((sum, count) => sum + count, 0);
      if (totalRoles !== totalPlayers) {
        setErrorMessage(`Total roles (${totalRoles}) must equal total players (${totalPlayers})`);
        return;
      }

      const werewolfCount = customRoles.werewolf || 0;
      if (werewolfCount === 0) {
        setErrorMessage('Must have at least 1 werewolf');
        return;
      }

      if (werewolfCount >= totalPlayers - werewolfCount) {
        setErrorMessage('Werewolves cannot equal or outnumber villager team');
        return;
      }
    }

    setErrorMessage('');
    setIsCreating(true);

    try {
      await createGame({
        totalPlayers,
        nightDuration: 60,
        dayDuration: 120,
        discussionDuration: 60,
        votingDuration: 45,
        usePresetRoles,
        customRoles
      }, hostName.trim());
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartGame = async (): Promise<void> => {
    if (players.length < totalPlayers) {
      setErrorMessage(`Waiting for ${totalPlayers - players.length} more players!`);
      return;
    }

    const allReady = players.every(p => p.isReady);
    if (!allReady) {
      setErrorMessage('Not all players are ready!');
      return;
    }

    setErrorMessage('');

    try {
      await startGame();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to start game');
    }
  };

  const handleRoleCountChange = (roleId: string, count: number): void => {
    setCustomRoles(prev => ({
      ...prev,
      [roleId]: Math.max(0, count)
    }));
  };

  const gameUrl = gameCode ? `${window.location.origin}/join/${gameCode}` : '';

  // If game is created, show lobby; otherwise show creation form
  if (gameCode) {
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

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 className="pixel-title" style={{
              fontSize: '3rem',
              color: '#DC143C',
              textShadow: '4px 4px 0 #000, -2px -2px 0 #8B0000',
              letterSpacing: '0.1em'
            }}>
              WEREWOLF LOBBY
            </h1>
          </div>

          <div className="pixel-border" style={{
            background: 'linear-gradient(to bottom, #4a0000, #000)',
            padding: '30px',
            marginBottom: '20px'
          }}>
            {/* QR Code */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <QRCodeCanvas value={gameUrl} size={256} />
            </div>

            {/* Game Code */}
            <div style={{
              backgroundColor: '#4a0000',
              border: '3px solid #DC143C',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <p className="pixel-text" style={{
                color: '#DC143C',
                fontSize: '1rem',
                margin: '0 0 10px 0'
              }}>
                GAME CODE:
              </p>
              <p className="pixel-title" style={{
                color: '#DC143C',
                fontSize: '3rem',
                letterSpacing: '0.2em',
                margin: 0
              }}>
                {gameCode}
              </p>
            </div>

            {/* Players List */}
            <div style={{
              backgroundColor: '#000',
              border: '3px solid #8B0000',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 className="pixel-text" style={{
                color: '#DC143C',
                fontSize: '1.5rem',
                marginBottom: '15px'
              }}>
                PLAYERS ({players.length}/{totalPlayers}):
              </h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {players.map((player, index) => (
                  <div key={player.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#4a0000',
                    padding: '12px',
                    border: '2px solid #8B0000',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        width: '35px',
                        height: '35px',
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
                        fontSize: '1.2rem'
                      }}>
                        {player.name} {player.isHost && '(HOST)'}
                      </span>
                    </div>
                    <span className="pixel-text" style={{
                      color: player.isReady ? '#00FF00' : '#888',
                      fontSize: '1rem'
                    }}>
                      {player.isReady ? 'READY' : 'NOT READY'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Configuration */}
            <div style={{
              backgroundColor: '#4a0000',
              border: '3px solid #FFD700',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 className="pixel-text" style={{
                color: '#FFD700',
                fontSize: '1.2rem',
                marginBottom: '15px'
              }}>
                ROLE CONFIGURATION:
              </h3>
              <div className="pixel-text" style={{
                color: '#FFD700',
                fontSize: '1.1rem',
                lineHeight: '1.8'
              }}>
                {usePresetRoles ? (
                  <p>Using Preset Roles for {totalPlayers} players</p>
                ) : (
                  Object.entries(customRoles).map(([roleId, count]) => {
                    const roleDef = ROLE_DEFINITIONS[roleId];
                    return count > 0 ? (
                      <p key={roleId} style={{ margin: '5px 0' }}>
                        {roleDef?.icon} {roleDef?.name}: {count}
                      </p>
                    ) : null;
                  })
                )}
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

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              className="pixel-button pixel-title"
              disabled={players.length < totalPlayers}
              style={{
                width: '100%',
                backgroundColor: players.length < totalPlayers ? '#555' : '#228B22',
                color: 'white',
                padding: '20px',
                fontSize: '1.2rem',
                border: 'none',
                cursor: players.length < totalPlayers ? 'not-allowed' : 'pointer',
                opacity: players.length < totalPlayers ? 0.6 : 1
              }}
            >
              START GAME
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game creation form
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
            HOST GAME
          </h1>
        </div>

        <div className="pixel-border" style={{
          background: 'linear-gradient(to bottom, #4a0000, #000)',
          padding: '30px'
        }}>
          {/* Host Name */}
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
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
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
            />
          </div>

          {/* Player Count */}
          <div style={{ marginBottom: '20px' }}>
            <label className="pixel-text" style={{
              display: 'block',
              fontSize: '1.2rem',
              color: '#DC143C',
              marginBottom: '10px'
            }}>
              Number of Players: {totalPlayers}
            </label>
            <input
              type="range"
              min="4"
              max="12"
              value={totalPlayers}
              onChange={(e) => setTotalPlayers(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Preset vs Custom */}
          <div style={{ marginBottom: '20px' }}>
            <label className="pixel-text" style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.2rem',
              color: '#DC143C',
              cursor: 'pointer',
              marginBottom: '10px'
            }}>
              <input
                type="checkbox"
                checked={usePresetRoles}
                onChange={(e) => setUsePresetRoles(e.target.checked)}
                style={{ marginRight: '10px', width: '20px', height: '20px' }}
              />
              Use Preset Roles
            </label>
          </div>

          {/* Custom Role Configuration */}
          {!usePresetRoles && (
            <div style={{
              backgroundColor: '#000',
              border: '3px solid #8B0000',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h3 className="pixel-text" style={{
                color: '#DC143C',
                fontSize: '1.2rem',
                marginBottom: '15px'
              }}>
                Custom Roles:
              </h3>
              {Object.entries(ROLE_DEFINITIONS).map(([roleId, roleDef]) => (
                <div key={roleId} style={{ marginBottom: '15px' }}>
                  <label className="pixel-text" style={{
                    display: 'block',
                    fontSize: '1rem',
                    color: roleDef.color,
                    marginBottom: '5px'
                  }}>
                    {roleDef.icon} {roleDef.name}: {customRoles[roleId] || 0}
                  </label>
                  <input
                    type="range"
                    min={roleDef.minCount}
                    max={roleDef.maxCount}
                    value={customRoles[roleId] || 0}
                    onChange={(e) => handleRoleCountChange(roleId, parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <p className="pixel-text" style={{
                    fontSize: '0.9rem',
                    color: '#888',
                    marginTop: '5px'
                  }}>
                    {roleDef.description}
                  </p>
                </div>
              ))}
            </div>
          )}

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

          {/* Create Game Button */}
          <button
            onClick={handleCreateGame}
            disabled={isCreating}
            className="pixel-button pixel-title"
            style={{
              width: '100%',
              backgroundColor: isCreating ? '#555' : '#8B0000',
              color: 'white',
              padding: '20px',
              fontSize: '1.2rem',
              border: 'none',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              opacity: isCreating ? 0.6 : 1
            }}
          >
            {isCreating ? 'CREATING...' : 'CREATE GAME'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostGamePage;