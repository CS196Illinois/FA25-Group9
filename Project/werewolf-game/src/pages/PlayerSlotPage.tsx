/*
// src/pages/PlayerSlotPage.tsx  
// ASSIGNED TO: Xinhang (xinhang7)
import React from 'react';
import { Player } from '../types';

interface PlayerSlotPageProps {
  players: Player[];
}

const PlayerSlotPage: React.FC<PlayerSlotPageProps> = ({ players }) => {
  return (
    <div className="player-slot-page">
      <h2>Game Lobby</h2>
      // {/* TODO: Display all player slots (empty and filled) */
      {/* TODO: Show player names and ready status */}
      {/* TODO: Ready/Unready button for current player */}
      {/* TODO: Leave game button */}
      {/* TODO: Show game code for inviting others */}
   // </div>
  //);
//};

//export default PlayerSlotPage;
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
    <div style={{ textAlign: "center", padding: "20px", color: "white" }}>
      <h1>Game Lobby</h1>
      <p>{currentCount}/{MAX_PLAYERS} players joined</p>
      <p>Game Code: <strong>ABCD1234</strong></p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        {players.map((player, index) => (
          <div
            key={index}
            style={{
              border: "2px solid gray",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: player ? "#222" : "#444",
              minHeight: "140px",
              position: "relative",
              cursor: player || myIndex !== null ? "default" : "pointer",
            }}
            onClick={() => {
              // 只有当这个格子是空并且我还没坐下时，才允许开始加入
              if (!player && myIndex === null && editingIndex === null) {
                startJoin(index);
              }
            }}
          >
            {player ? (
              <>
                <h3 style={{ marginTop: 0 }}>{player.name}</h3>
                <p style={{ margin: "6px 0" }}>
                  Status: {player.isReady ? "✅ Ready" : "❌ Not Ready"}
                </p>

                {/* 只有我自己的格子，才显示 Ready/Unready 按钮 */}
                {myIndex === index && (
                  <button onClick={toggleReady}>
                    {player.isReady ? "Unready" : "Ready"}
                  </button>
                )}
              </>
            ) : editingIndex === index ? (
              
              <div style={{ marginTop: "8px" }}>
                <input
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    width: "90%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #888",
                    marginBottom: "8px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button onClick={confirmJoin}>Join</button>
                  <button onClick={cancelJoin}>Cancel</button>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: "40px" }}>Empty Slot (Click to sit down)</p>
            )}
          </div>
        ))}
      </div>

      {myIndex !== null && (
        <button
          onClick={leaveGame}
          style={{
            marginTop: "30px",
            backgroundColor: "red",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Leave Game
        </button>
      )}
    </div>
  );
};

export default PlayerSlotPage;