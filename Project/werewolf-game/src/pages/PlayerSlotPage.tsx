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
      {/* TODO: Display all player slots (empty and filled) */}
      {/* TODO: Show player names and ready status */}
      {/* TODO: Ready/Unready button for current player */}
      {/* TODO: Leave game button */}
      {/* TODO: Show game code for inviting others */}
    </div>
  );
};

export default PlayerSlotPage;