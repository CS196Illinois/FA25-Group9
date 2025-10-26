import React, { useState } from 'react';

interface RoleCategories {
  wolf: string[];
  god: string[];
  neutral: string[];
}

const HostGamePage: React.FC = () => {
  const [totalPlayers, setTotalPlayers] = useState<string>('');
  const [numWolves, setNumWolves] = useState<string>('');
  const [numSpecialWolves, setNumSpecialWolves] = useState<string>('');
  const [numGods, setNumGods] = useState<string>('');
  const [numNeutral, setNumNeutral] = useState<string>('');
  const [numVillagers, setNumVillagers] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [gameCode, setGameCode] = useState<string>('');
  const [showQR, setShowQR] = useState<boolean>(false);
  const [waitingPlayers, setWaitingPlayers] = useState<string[]>([]);
  const [gameDetails, setGameDetails] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const roleCategories: RoleCategories = {
    wolf: [
      '机械狼 Mechanical Wolf',
      '黑狼王 Black Wolf King',
      '白狼王 White Wolf King',
      '狼美人 Wolf Beauty'
    ],
    god: [
      '预言家 Prophet',
      '女巫 Witch',
      '猎人 Hunter',
      '守卫 Guard',
      '白痴 Idiot',
      '长老 Elder',
      '骑士 Knight',
      '奇迹商人 Miracle Merchant'
    ],
    neutral: [
      '混血儿 Half-Blood',
      '丘比特 Cupid'
    ]
  };

  const generateGameCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleGenerateQR = (): void => {
    const total = parseInt(totalPlayers) || 0;
    const wolves = parseInt(numWolves) || 0;
    const specialWolves = parseInt(numSpecialWolves) || 0;
    const gods = parseInt(numGods) || 0;
    const neutral = parseInt(numNeutral) || 0;
    const villagers = parseInt(numVillagers) || 0;

    setErrorMessage('');

    if (total < 6) {
      setErrorMessage('至少需要6名玩家！Minimum 6 players required!');
      return;
    }

    if (wolves + specialWolves + gods + neutral + villagers !== total) {
      setErrorMessage('⚠️ 人数有误！角色数量总和必须等于玩家总数！\n⚠️ Player Count Error! Role counts must equal total players!');
      return;
    }

    if (selectedRoles.length !== (specialWolves + gods + neutral)) {
      setErrorMessage(`请选择 ${specialWolves + gods + neutral} 个特殊角色！\nPlease select ${specialWolves + gods + neutral} special roles!`);
      return;
    }

    const wolfRoles = selectedRoles.filter(r => roleCategories.wolf.includes(r));
    const godRoles = selectedRoles.filter(r => roleCategories.god.includes(r));
    const neutralRoles = selectedRoles.filter(r => roleCategories.neutral.includes(r));

    if (wolfRoles.length !== specialWolves) {
      setErrorMessage(`请选择 ${specialWolves} 个技能狼角色！\nPlease select ${specialWolves} special wolf roles!`);
      return;
    }

    if (godRoles.length !== gods) {
      setErrorMessage(`请选择 ${gods} 个神职角色！\nPlease select ${gods} god roles!`);
      return;
    }

    if (neutralRoles.length !== neutral) {
      setErrorMessage(`请选择 ${neutral} 个中立/第三方角色！\nPlease select ${neutral} neutral roles!`);
      return;
    }

    const code = generateGameCode();
    setGameCode(code);
    
    const roleSummary = `本局角色配置 Role Configuration:
总玩家 Total Players: ${total}

狼人阵营 Wolf Camp: ${wolves + specialWolves}
- 普通狼人 Normal Wolves: ${wolves}
${wolfRoles.length > 0 ? `- 技能狼 Special Wolves:\n  ${wolfRoles.join('\n  ')}` : ''}

神职阵营 God Camp: ${godRoles.length}
${godRoles.length > 0 ? `${godRoles.map(r => '- ' + r).join('\n')}` : ''}

中立/第三方 Neutral/Third Party: ${neutralRoles.length}
${neutralRoles.length > 0 ? `${neutralRoles.map(r => '- ' + r).join('\n')}` : ''}

村民 Villagers: ${villagers}`;
    
    setGameDetails(roleSummary);
    
    const gameUrl = `https://werewolf-game.com/join/${code}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(gameUrl)}`;
    setQrCodeUrl(qrUrl);
    setShowQR(true);
    
    setWaitingPlayers(['主持人 Host']);
  };

  const handleRoleToggle = (role: string): void => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      const specialWolves = parseInt(numSpecialWolves) || 0;
      const gods = parseInt(numGods) || 0;
      const neutral = parseInt(numNeutral) || 0;
      const totalSpecial = specialWolves + gods + neutral;
      
      if (selectedRoles.length < totalSpecial) {
        setSelectedRoles([...selectedRoles, role]);
      } else {
        alert(`最多只能选择 ${totalSpecial} 个特殊角色！\nMax ${totalSpecial} special roles allowed!`);
      }
    }
  };

  const handleStartGame = (): void => {
    if (waitingPlayers.length < parseInt(totalPlayers)) {
      alert(`还需要 ${parseInt(totalPlayers) - waitingPlayers.length} 名玩家加入！\nWaiting for ${parseInt(totalPlayers) - waitingPlayers.length} more players!`);
      return;
    }
    alert('游戏开始！Game Start!');
  };

  const gameUrl = `https://werewolf-game.com/join/${gameCode}`;

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
        
        input, textarea {
          image-rendering: pixelated;
        }

        .host-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .host-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 1024px) {
          .host-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div className="host-container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 className="pixel-title" style={{
            fontSize: '3rem',
            color: '#DC143C',
            textShadow: '4px 4px 0 #000, -2px -2px 0 #8B0000',
            letterSpacing: '0.1em',
            margin: '0 0 10px 0'
          }}>
            WEREWOLF
          </h1>
          <h2 className="pixel-title" style={{
            fontSize: '2.5rem',
            color: '#DC143C',
            textShadow: '3px 3px 0 #000',
            margin: '0'
          }}>
            狼人杀
          </h2>
        </div>

        <div className="host-grid">
          {/* Left Column - Host Game Form */}
          <div className="pixel-border" style={{
            background: 'linear-gradient(to bottom, #4a0000, #000)',
            padding: '25px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 className="pixel-title" style={{
              fontSize: '1.5rem',
              color: '#DC143C',
              marginBottom: '15px'
            }}>
              HOST GAME
            </h2>
            <h3 className="pixel-text" style={{
              fontSize: '1.3rem',
              color: '#DC143C',
              marginBottom: '20px'
            }}>创建游戏</h3>

            {/* Player Count */}
            <div style={{ marginBottom: '15px' }}>
              <label className="pixel-text" style={{
                display: 'block',
                fontSize: '1rem',
                color: '#DC143C',
                marginBottom: '8px'
              }}>
                # of Players 玩家人数:
              </label>
              <input
                type="number"
                min="6"
                max="20"
                value={totalPlayers}
                onChange={(e) => setTotalPlayers(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  color: '#DC143C',
                  fontSize: '1.2rem',
                  outline: 'none'
                }}
                className="pixel-text"
                placeholder="6-20"
              />
            </div>

            {/* Normal Wolves */}
            <div style={{ marginBottom: '15px' }}>
              <label className="pixel-text" style={{
                display: 'block',
                fontSize: '1rem',
                color: '#DC143C',
                marginBottom: '8px'
              }}>
                普通狼人 Normal Wolves : #
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={numWolves}
                onChange={(e) => setNumWolves(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  color: '#DC143C',
                  fontSize: '1.2rem'
                }}
                className="pixel-text"
                placeholder="0-5"
              />
            </div>

            {/* Special Wolves */}
            <div style={{ marginBottom: '15px' }}>
              <label className="pixel-text" style={{
                display: 'block',
                fontSize: '1rem',
                color: '#DC143C',
                marginBottom: '8px'
              }}>
                技能狼 Special Wolves : #
              </label>
              <input
                type="number"
                min="0"
                max="4"
                value={numSpecialWolves}
                onChange={(e) => setNumSpecialWolves(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  color: '#DC143C',
                  fontSize: '1.2rem'
                }}
                className="pixel-text"
                placeholder="0-4"
              />
            </div>

            {/* Gods */}
            <div style={{ marginBottom: '15px' }}>
              <label className="pixel-text" style={{
                display: 'block',
                fontSize: '1rem',
                color: '#FFD700',
                marginBottom: '8px'
              }}>
                神职 Gods : #
              </label>
              <input
                type="number"
                min="0"
                max="8"
                value={numGods}
                onChange={(e) => setNumGods(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  color: '#DC143C',
                  fontSize: '1.2rem'
                }}
                className="pixel-text"
                placeholder="0-8"
              />
            </div>

            {/* Neutral */}
            <div style={{ marginBottom: '15px' }}>
              <label className="pixel-text" style={{
                display: 'block',
                fontSize: '1rem',
                color: '#BA55D3',
                marginBottom: '8px'
              }}>
                中立/第三方 Neutral : #
              </label>
              <input
                type="number"
                min="0"
                max="2"
                value={numNeutral}
                onChange={(e) => setNumNeutral(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  color: '#DC143C',
                  fontSize: '1.2rem'
                }}
                className="pixel-text"
                placeholder="0-2"
              />
            </div>

            {/* Villagers */}
            <div style={{ marginBottom: '15px' }}>
              <label className="pixel-text" style={{
                display: 'block',
                fontSize: '1rem',
                color: '#888',
                marginBottom: '8px'
              }}>
                村民 Villagers : #
              </label>
              <input
                type="number"
                min="0"
                max="15"
                value={numVillagers}
                onChange={(e) => setNumVillagers(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  color: '#DC143C',
                  fontSize: '1.2rem'
                }}
                className="pixel-text"
                placeholder="0-15"
              />
            </div>

            {/* Role Selection */}
            {(parseInt(numSpecialWolves) > 0 || parseInt(numGods) > 0 || parseInt(numNeutral) > 0) && (
              <div style={{ marginBottom: '15px' }}>
                <label className="pixel-text" style={{
                  display: 'block',
                  fontSize: '1rem',
                  color: '#DC143C',
                  marginBottom: '8px'
                }}>
                  选择特殊角色 Select Roles ({selectedRoles.length}/{(parseInt(numSpecialWolves) || 0) + (parseInt(numGods) || 0) + (parseInt(numNeutral) || 0)}):
                </label>
                <div style={{
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  padding: '10px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {parseInt(numSpecialWolves) > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4 className="pixel-text" style={{
                        color: '#DC143C',
                        fontSize: '1rem',
                        borderBottom: '2px solid #8B0000',
                        paddingBottom: '5px',
                        marginBottom: '10px'
                      }}>
                        🐺 技能狼 ({selectedRoles.filter(r => roleCategories.wolf.includes(r)).length}/{numSpecialWolves})
                      </h4>
                      {roleCategories.wolf.map((role, index) => (
                        <div key={`wolf-${index}`} style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '8px',
                          padding: '5px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            id={`wolf-role-${index}`}
                            checked={selectedRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            style={{ marginRight: '10px', width: '18px', height: '18px' }}
                          />
                          <label htmlFor={`wolf-role-${index}`} className="pixel-text" style={{
                            color: '#DC143C',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                          }}>
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {parseInt(numGods) > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4 className="pixel-text" style={{
                        color: '#FFD700',
                        fontSize: '1rem',
                        borderBottom: '2px solid #FFD700',
                        paddingBottom: '5px',
                        marginBottom: '10px'
                      }}>
                        ⭐ 神职 ({selectedRoles.filter(r => roleCategories.god.includes(r)).length}/{numGods})
                      </h4>
                      {roleCategories.god.map((role, index) => (
                        <div key={`god-${index}`} style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '8px',
                          padding: '5px'
                        }}>
                          <input
                            type="checkbox"
                            id={`god-role-${index}`}
                            checked={selectedRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            style={{ marginRight: '10px', width: '18px', height: '18px' }}
                          />
                          <label htmlFor={`god-role-${index}`} className="pixel-text" style={{
                            color: '#DC143C',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                          }}>
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {parseInt(numNeutral) > 0 && (
                    <div>
                      <h4 className="pixel-text" style={{
                        color: '#BA55D3',
                        fontSize: '1rem',
                        borderBottom: '2px solid #BA55D3',
                        paddingBottom: '5px',
                        marginBottom: '10px'
                      }}>
                        🎭 中立/第三方 ({selectedRoles.filter(r => roleCategories.neutral.includes(r)).length}/{numNeutral})
                      </h4>
                      {roleCategories.neutral.map((role, index) => (
                        <div key={`neutral-${index}`} style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '8px',
                          padding: '5px'
                        }}>
                          <input
                            type="checkbox"
                            id={`neutral-role-${index}`}
                            checked={selectedRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            style={{ marginRight: '10px', width: '18px', height: '18px' }}
                          />
                          <label htmlFor={`neutral-role-${index}`} className="pixel-text" style={{
                            color: '#DC143C',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                          }}>
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Game Details */}
            <div style={{ marginBottom: '20px' }}>
              <label className="pixel-text" style={{
                display: 'block',
                fontSize: '1rem',
                color: '#DC143C',
                marginBottom: '8px'
              }}>
                游戏详情 Details:
              </label>
              <textarea
                value={gameDetails}
                onChange={(e) => setGameDetails(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  color: '#DC143C',
                  fontSize: '0.9rem',
                  height: '120px',
                  resize: 'vertical'
                }}
                className="pixel-text"
                placeholder="角色配置将自动生成..."
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                marginBottom: '15px',
                backgroundColor: '#8B0000',
                border: '3px solid #DC143C',
                padding: '15px',
                textAlign: 'center'
              }}>
                <p className="pixel-text" style={{
                  color: '#FFD700',
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-line',
                  margin: 0
                }}>
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Generate QR Button */}
            <button
              onClick={handleGenerateQR}
              className="pixel-button pixel-title"
              style={{
                width: '100%',
                backgroundColor: '#8B0000',
                color: 'white',
                padding: '15px',
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              GENERATE QR
            </button>
          </div>

          {/* Right Column - QR Code */}
          <div className="pixel-border" style={{
            background: 'linear-gradient(to bottom, #4a0000, #000)',
            padding: '25px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 className="pixel-title" style={{
              fontSize: '1.5rem',
              color: '#DC143C',
              marginBottom: '15px'
            }}>
              QR CODE
            </h2>
            <h3 className="pixel-text" style={{
              fontSize: '1.3rem',
              color: '#DC143C',
              marginBottom: '20px'
            }}>二维码</h3>

            {showQR ? (
              <div>
                {/* QR Code Image */}
                <div style={{
                  backgroundColor: '#000',
                  padding: '20px',
                  border: '3px solid #8B0000',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <img 
                    src={qrCodeUrl} 
                    alt="Game QR Code"
                    style={{ width: '280px', height: '280px', imageRendering: 'pixelated' }}
                  />
                </div>

                {/* Game Code */}
                <div style={{
                  backgroundColor: '#4a0000',
                  border: '3px solid #DC143C',
                  padding: '15px',
                  textAlign: 'center',
                  marginBottom: '15px'
                }}>
                  <p className="pixel-text" style={{
                    color: '#DC143C',
                    fontSize: '0.8rem',
                    margin: '0 0 5px 0'
                  }}>游戏代码 CODE:</p>
                  <p className="pixel-title" style={{
                    color: '#DC143C',
                    fontSize: '2rem',
                    letterSpacing: '0.1em',
                    margin: 0
                  }}>{gameCode}</p>
                </div>

                {/* Share Link */}
                <div style={{
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  padding: '10px',
                  marginBottom: '15px'
                }}>
                  <p className="pixel-text" style={{
                    color: '#DC143C',
                    fontSize: '0.8rem',
                    margin: '0 0 5px 0'
                  }}>分享链接 LINK:</p>
                  <p className="pixel-text" style={{
                    color: '#DC143C',
                    fontSize: '0.9rem',
                    wordBreak: 'break-all',
                    margin: 0
                  }}>{gameUrl}</p>
                </div>

                {/* Waiting Players */}
                <div style={{
                  backgroundColor: '#000',
                  border: '3px solid #8B0000',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <h3 className="pixel-text" style={{
                    color: '#DC143C',
                    fontSize: '1rem',
                    marginBottom: '10px'
                  }}>
                    等待玩家 WAITING ({waitingPlayers.length}/{totalPlayers}):
                  </h3>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {waitingPlayers.map((player, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#4a0000',
                        padding: '8px',
                        border: '2px solid #8B0000',
                        marginBottom: '5px'
                      }}>
                        <span style={{
                          width: '30px',
                          height: '30px',
                          backgroundColor: '#DC143C',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '10px',
                          border: '2px solid #000'
                        }} className="pixel-text">
                          {index + 1}
                        </span>
                        <span className="pixel-text" style={{ color: '#DC143C' }}>{player}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Game Config */}
                <div style={{
                  backgroundColor: '#4a0000',
                  border: '3px solid #FFD700',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <h3 className="pixel-text" style={{
                    color: '#FFD700',
                    fontSize: '1rem',
                    marginBottom: '10px'
                  }}>
                    游戏配置 CONFIG:
                  </h3>
                  <div className="pixel-text" style={{
                    color: '#FFD700',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}>
                    <p style={{ margin: '5px 0' }}>• 总玩家 Total: {totalPlayers}</p>
                    <p style={{ margin: '5px 0' }}>• 普通狼人 Normal: {numWolves}</p>
                    {(() => {
                      const wolfRoles = selectedRoles.filter(r => roleCategories.wolf.includes(r));
                      const godRoles = selectedRoles.filter(r => roleCategories.god.includes(r));
                      const neutralRoles = selectedRoles.filter(r => roleCategories.neutral.includes(r));
                      return (
                        <>
                          {wolfRoles.length > 0 && (
                            <>
                              <p style={{ margin: '5px 0' }}>• 技能狼 Special: {wolfRoles.length}</p>
                              <p style={{ margin: '5px 0 5px 15px', fontSize: '0.8rem' }}>{wolfRoles.join(', ')}</p>
                            </>
                          )}
                          {godRoles.length > 0 && (
                            <>
                              <p style={{ margin: '5px 0' }}>• 神职 Gods: {godRoles.length}</p>
                              <p style={{ margin: '5px 0 5px 15px', fontSize: '0.8rem' }}>{godRoles.join(', ')}</p>
                            </>
                          )}
                          {neutralRoles.length > 0 && (
                            <>
                              <p style={{ margin: '5px 0' }}>• 中立 Neutral: {neutralRoles.length}</p>
                              <p style={{ margin: '5px 0 5px 15px', fontSize: '0.8rem' }}>{neutralRoles.join(', ')}</p>
                            </>
                          )}
                        </>
                      );
                    })()}
                    <p style={{ margin: '5px 0' }}>• 村民 Villagers: {numVillagers}</p>
                  </div>
                </div>

                {/* Start Game Button */}
                <button
                  onClick={handleStartGame}
                  className="pixel-button pixel-title"
                  style={{
                    width: '100%',
                    backgroundColor: '#228B22',
                    color: 'white',
                    padding: '15px',
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  START GAME
                </button>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#000',
                border: '3px solid #8B0000',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="pixel-text" style={{
                  color: '#DC143C',
                  fontSize: '1.2rem',
                  textAlign: 'center'
                }}>
                  等待生成...<br/>
                  WAITING...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostGamePage;