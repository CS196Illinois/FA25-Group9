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
    <div className="min-h-screen bg-black p-4" style={{
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 0, 0, 0.1) 2px, rgba(139, 0, 0, 0.1) 4px)',
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
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-red-600 pixel-title inline-block" style={{
            textShadow: '4px 4px 0 #000, -2px -2px 0 #8B0000',
            letterSpacing: '0.1em'
          }}>
            WEREWOLF
          </h1>
          <h2 className="text-5xl font-bold text-red-500 pixel-title mt-2" style={{
            textShadow: '3px 3px 0 #000'
          }}>
            狼人杀
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-b from-red-950 to-black pixel-border p-6">
            <h2 className="text-3xl font-bold text-red-500 mb-6 pixel-title">
              HOST GAME
            </h2>
            <h3 className="text-2xl text-red-400 mb-6 pixel-text">创建游戏</h3>

            <div className="mb-4">
              <label className="block text-xl text-red-400 mb-2 pixel-text">
                # of Players 玩家人数:
              </label>
              <input
                type="number"
                min="6"
                max="20"
                value={totalPlayers}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotalPlayers(e.target.value)}
                className="w-full px-4 py-3 bg-black border-4 border-red-900 text-red-400 text-2xl pixel-text focus:outline-none focus:border-red-600"
                placeholder="6-20"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xl text-red-600 font-bold mb-2 pixel-text">
                普通狼人 Normal Wolves : #
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={numWolves}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumWolves(e.target.value)}
                className="w-full px-4 py-3 bg-black border-4 border-red-900 text-red-400 text-2xl pixel-text focus:outline-none focus:border-red-600"
                placeholder="0-5"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xl text-red-500 font-bold mb-2 pixel-text">
                技能狼 Special Wolves : #
              </label>
              <input
                type="number"
                min="0"
                max="4"
                value={numSpecialWolves}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumSpecialWolves(e.target.value)}
                className="w-full px-4 py-3 bg-black border-4 border-red-900 text-red-400 text-2xl pixel-text focus:outline-none focus:border-red-600"
                placeholder="0-4"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xl text-yellow-500 font-bold mb-2 pixel-text">
                神职 Gods : #
              </label>
              <input
                type="number"
                min="0"
                max="8"
                value={numGods}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumGods(e.target.value)}
                className="w-full px-4 py-3 bg-black border-4 border-red-900 text-red-400 text-2xl pixel-text focus:outline-none focus:border-red-600"
                placeholder="0-8"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xl text-purple-400 font-bold mb-2 pixel-text">
                中立/第三方 Neutral : #
              </label>
              <input
                type="number"
                min="0"
                max="2"
                value={numNeutral}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumNeutral(e.target.value)}
                className="w-full px-4 py-3 bg-black border-4 border-red-900 text-red-400 text-2xl pixel-text focus:outline-none focus:border-red-600"
                placeholder="0-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xl text-gray-400 font-bold mb-2 pixel-text">
                村民 Villagers : #
              </label>
              <input
                type="number"
                min="0"
                max="15"
                value={numVillagers}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumVillagers(e.target.value)}
                className="w-full px-4 py-3 bg-black border-4 border-red-900 text-red-400 text-2xl pixel-text focus:outline-none focus:border-red-600"
                placeholder="0-15"
              />
            </div>

            {(parseInt(numSpecialWolves) > 0 || parseInt(numGods) > 0 || parseInt(numNeutral) > 0) && (
              <div className="mb-4">
                <label className="block text-xl text-red-300 mb-2 pixel-text">
                  选择特殊角色 Select Roles ({selectedRoles.length}/{(parseInt(numSpecialWolves) || 0) + (parseInt(numGods) || 0) + (parseInt(numNeutral) || 0)}):
                </label>
                <div className="bg-black border-4 border-red-900 p-3 max-h-64 overflow-y-auto">
                  {parseInt(numSpecialWolves) > 0 && (
                    <div className="mb-4">
                      <h4 className="text-red-500 font-bold pixel-text mb-2 text-xl border-b-2 border-red-800 pb-1">
                        🐺 技能狼 ({selectedRoles.filter(r => roleCategories.wolf.includes(r)).length}/{numSpecialWolves})
                      </h4>
                      {roleCategories.wolf.map((role, index) => (
                        <div key={`wolf-${index}`} className="flex items-center mb-2 hover:bg-red-950 p-2 transition-colors">
                          <input
                            type="checkbox"
                            id={`wolf-role-${index}`}
                            checked={selectedRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            className="mr-3 w-5 h-5"
                            style={{ accentColor: '#8B0000' }}
                          />
                          <label htmlFor={`wolf-role-${index}`} className="text-red-300 text-lg pixel-text cursor-pointer">
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {parseInt(numGods) > 0 && (
                    <div className="mb-4">
                      <h4 className="text-yellow-500 font-bold pixel-text mb-2 text-xl border-b-2 border-yellow-800 pb-1">
                        ⭐ 神职 ({selectedRoles.filter(r => roleCategories.god.includes(r)).length}/{numGods})
                      </h4>
                      {roleCategories.god.map((role, index) => (
                        <div key={`god-${index}`} className="flex items-center mb-2 hover:bg-red-950 p-2 transition-colors">
                          <input
                            type="checkbox"
                            id={`god-role-${index}`}
                            checked={selectedRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            className="mr-3 w-5 h-5"
                            style={{ accentColor: '#8B0000' }}
                          />
                          <label htmlFor={`god-role-${index}`} className="text-red-300 text-lg pixel-text cursor-pointer">
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {parseInt(numNeutral) > 0 && (
                    <div>
                      <h4 className="text-purple-400 font-bold pixel-text mb-2 text-xl border-b-2 border-purple-800 pb-1">
                        🎭 中立/第三方 ({selectedRoles.filter(r => roleCategories.neutral.includes(r)).length}/{numNeutral})
                      </h4>
                      {roleCategories.neutral.map((role, index) => (
                        <div key={`neutral-${index}`} className="flex items-center mb-2 hover:bg-red-950 p-2 transition-colors">
                          <input
                            type="checkbox"
                            id={`neutral-role-${index}`}
                            checked={selectedRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            className="mr-3 w-5 h-5"
                            style={{ accentColor: '#8B0000' }}
                          />
                          <label htmlFor={`neutral-role-${index}`} className="text-red-300 text-lg pixel-text cursor-pointer">
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xl text-red-300 mb-2 pixel-text">
                游戏详情 Details:
              </label>
              <textarea
                value={gameDetails}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGameDetails(e.target.value)}
                className="w-full px-4 py-3 bg-black border-4 border-red-900 text-red-400 text-lg pixel-text focus:outline-none focus:border-red-600 h-32"
                placeholder="角色配置将自动生成..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-900 border-4 border-red-600 p-4 pixel-text text-yellow-300 text-center animate-pulse text-lg">
                <p className="whitespace-pre-line">{errorMessage}</p>
              </div>
            )}

            <button
              onClick={handleGenerateQR}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 px-6 pixel-button pixel-title text-lg"
            >
              GENERATE QR
            </button>
          </div>

          <div className="bg-gradient-to-b from-red-950 to-black pixel-border p-6">
            <h2 className="text-3xl font-bold text-red-500 mb-6 pixel-title">
              QR CODE
            </h2>
            <h3 className="text-2xl text-red-400 mb-6 pixel-text">二维码</h3>

            {showQR ? (
              <div className="space-y-4">
                <div className="bg-black p-6 border-4 border-red-900 flex justify-center items-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="Game QR Code" 
                    className="w-70 h-70"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                <div className="bg-red-950 border-4 border-red-700 text-white p-4 text-center">
                  <p className="text-sm mb-1 pixel-text text-red-300">游戏代码 CODE:</p>
                  <p className="text-4xl font-bold tracking-wider pixel-title text-red-500">{gameCode}</p>
                </div>

                <div className="bg-black border-4 border-red-900 p-3">
                  <p className="text-sm text-red-400 mb-1 pixel-text">分享链接 LINK:</p>
                  <p className="text-lg text-red-300 break-all pixel-text">{gameUrl}</p>
                </div>

                <div className="bg-black border-4 border-red-900 p-4">
                  <h3 className="text-xl font-semibold text-red-400 mb-3 pixel-text">
                    等待玩家 WAITING ({waitingPlayers.length}/{totalPlayers}):
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {waitingPlayers.map((player, index) => (
                      <div key={index} className="flex items-center bg-red-950 p-2 border-2 border-red-800">
                        <span className="w-8 h-8 bg-red-600 text-white flex items-center justify-center text-lg mr-3 pixel-text border-2 border-black">
                          {index + 1}
                        </span>
                        <span className="text-red-300 pixel-text text-lg">{player}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-950 border-4 border-yellow-700 p-4">
                  <h3 className="text-xl font-semibold text-yellow-400 mb-2 pixel-text">
                    游戏配置 CONFIG:
                  </h3>
                  <div className="text-lg text-yellow-300 space-y-1 pixel-text">
                    <p>• 总玩家 Total: {totalPlayers}</p>
                    <p>• 普通狼人 Normal: {numWolves}</p>
                    {(() => {
                      const wolfRoles = selectedRoles.filter(r => roleCategories.wolf.includes(r));
                      const godRoles = selectedRoles.filter(r => roleCategories.god.includes(r));
                      const neutralRoles = selectedRoles.filter(r => roleCategories.neutral.includes(r));
                      return (
                        <>
                          {wolfRoles.length > 0 && (
                            <>
                              <p>• 技能狼 Special: {wolfRoles.length}</p>
                              <p className="text-sm pl-4">{wolfRoles.join(', ')}</p>
                            </>
                          )}
                          {godRoles.length > 0 && (
                            <>
                              <p>• 神职 Gods: {godRoles.length}</p>
                              <p className="text-sm pl-4">{godRoles.join(', ')}</p>
                            </>
                          )}
                          {neutralRoles.length > 0 && (
                            <>
                              <p>• 中立 Neutral: {neutralRoles.length}</p>
                              <p className="text-sm pl-4">{neutralRoles.join(', ')}</p>
                            </>
                          )}
                        </>
                      );
                    })()}
                    <p>• 村民 Villagers: {numVillagers}</p>
                  </div>
                </div>

                <button
                  onClick={handleStartGame}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 px-6 pixel-button pixel-title text-lg"
                >
                  START GAME
                </button>
              </div>
            ) : (
              <div className="bg-black border-4 border-red-900 h-96 flex items-center justify-center">
                <p className="text-red-600 text-xl pixel-text animate-pulse">
                  等待生成...<br/>
                  WAITING...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostGamePage;