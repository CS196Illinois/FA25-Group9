import React, { useState } from "react";

type Player = {
  id: number;       
  name: string;
  isReady: boolean;
};

const MAX_PLAYERS = 12;

const PlayerSlotPage: React.FC = () => {
  const [players, setPlayers] = useState<(Player | null)[]>(
    Array(MAX_PLAYERS).fill(null)
  );

  const [myIndex, setMyIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [inputName, setInputName] = useState<string>("");

  const startJoin = (index: number) => {
    if (players[index] !== null) return;      
    if (myIndex !== null) return;             
    setEditingIndex(index);
    setInputName("");
  };

  const confirmJoin = () => {
    if (editingIndex === null) return;
    const name = inputName.trim();
    if (!name) return;

    setPlayers(prev => {
      const next = prev.slice();
      next[editingIndex] = { id: editingIndex, name, isReady: false };
      return next;
    });
    setMyIndex(editingIndex);
    setEditingIndex(null);
    setInputName("");
  };

  const cancelJoin = () => {
    setEditingIndex(null);
    setInputName("");
  };

  const toggleReady = () => {
    if (myIndex === null) return;
    setPlayers(prev =>
      prev.map((p, i) =>
        i === myIndex && p ? { ...p, isReady: !p.isReady } : p
      )
    );
  };

  const leaveGame = () => {
    if (myIndex === null) return;
    setPlayers(prev => prev.map((p, i) => (i === myIndex ? null : p)));
    setMyIndex(null);
  };

  const currentCount = players.filter(p => p !== null).length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 0, 0, 0.1) 2px, rgba(139, 0, 0, 0.1) 4px)',
      padding: '20px',
      overflowX: 'hidden'
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

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 className="pixel-title" style={{
            fontSize: '3rem',
            color: '#DC143C',
            textShadow: '4px 4px 0 #000, -2px -2px 0 #8B0000',
            letterSpacing: '0.1em',
            margin: '0 0 10px 0'
          }}>
            GAME LOBBY
          </h1>
          <p className="pixel-text" style={{
            fontSize: '1.5rem',
            color: '#DC143C',
            margin: '10px 0'
          }}>
            {currentCount}/{MAX_PLAYERS} players joined
          </p>
          <p className="pixel-text" style={{
            fontSize: '1.2rem',
            color: '#DC143C',
            margin: '5px 0'
          }}>
            Game Code: <span style={{ color: '#FFD700' }}>ABCD1234</span>
          </p>
        </div>

        {/* Player Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          {players.map((player, index) => (
            <div
              key={index}
              className="pixel-border"
              style={{
                padding: '25px',
                background: player ? 'linear-gradient(to bottom, #4a0000, #000)' : 'linear-gradient(to bottom, #2a0000, #000)',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: player || myIndex !== null ? 'default' : 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => {
                if (!player && myIndex === null && editingIndex === null) {
                  startJoin(index);
                }
              }}
            >
              {player ? (
                <>
                  <h3 className="pixel-text" style={{
                    margin: '0 0 10px 0',
                    fontSize: '1.5rem',
                    color: '#DC143C'
                  }}>
                    {player.name}
                  </h3>
                  <p className="pixel-text" style={{ 
                    margin: '8px 0',
                    fontSize: '1.2rem',
                    color: player.isReady ? '#00FF00' : '#DC143C'
                  }}>
                    Status: {player.isReady ? '✅ Ready' : '❌ Not Ready'}
                  </p>

                  {myIndex === index && (
                    <button 
                      onClick={toggleReady}
                      className="pixel-button pixel-text"
                      style={{
                        marginTop: '10px',
                        padding: '10px 20px',
                        backgroundColor: player.isReady ? '#666' : '#228B22',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      {player.isReady ? 'Unready' : 'Ready'}
                    </button>
                  )}
                </>
              ) : editingIndex === index ? (
                <div style={{ width: '100%' }}>
                  <input
                    value={inputName}
                    onChange={e => setInputName(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    className="pixel-text"
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '10px',
                      backgroundColor: '#000',
                      color: '#DC143C',
                      border: '2px solid #8B0000',
                      fontSize: '1.2rem'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') confirmJoin();
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button 
                      onClick={confirmJoin}
                      className="pixel-button pixel-text"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#228B22',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      Join
                    </button>
                    <button 
                      onClick={cancelJoin}
                      className="pixel-button pixel-text"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#8B0000',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="pixel-text" style={{
                  color: '#888',
                  fontSize: '1.2rem',
                  textAlign: 'center'
                }}>
                  Empty Slot<br/>(Click to sit down)
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Leave Game Button */}
        {myIndex !== null && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={leaveGame}
              className="pixel-button pixel-title"
              style={{
                padding: '15px 40px',
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
        )}
      </div>
    </div>
  );
};

export default PlayerSlotPage;