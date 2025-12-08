import React, { useEffect } from 'react';
import { useVoiceChat } from '../contexts/VoiceChatContext';

interface VoiceChatControlsProps {
  gameCode: string;
  playerName: string;
  gamePhase?: string;
  playerRole?: string;
  autoJoin?: boolean;
}

const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({
  gameCode,
  playerName,
  gamePhase = 'lobby',
  playerRole = 'villager',
  autoJoin = true
}) => {
  const { isJoined, isMuted, participants, joinRoom, toggleMute, error } = useVoiceChat();

  useEffect(() => {
    if (autoJoin && !isJoined && playerName && gameCode) {
      // Use game code as the Agora channel name
      joinRoom(gameCode, playerName);
    }

    return () => {
      // Don't auto-leave on unmount to allow navigation
    };
  }, [autoJoin, isJoined, playerName, gameCode]); // Only run when these change

  // Determine if voice should be restricted based on game phase
  const isVoiceRestricted = () => {
    if (gamePhase === 'night') {
      // During night, only werewolves can talk
      return playerRole !== 'werewolf';
    }
    return false;
  };

  // Auto-mute if voice is restricted
  useEffect(() => {
    if (isJoined && isVoiceRestricted() && !isMuted) {
      toggleMute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, playerRole, isJoined]);

  if (!isJoined) {
    return (
      <div className="pixel-border" style={{
        padding: '15px',
        backgroundColor: '#1a0000',
        border: '2px solid #8B0000',
        marginBottom: '15px'
      }}>
        <div className="pixel-text" style={{
          color: '#DC143C',
          fontSize: '1rem',
          textAlign: 'center'
        }}>
          Connecting to voice chat...
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-border" style={{
      padding: '8px 12px',
      backgroundColor: '#1a0000',
      border: '2px solid #8B0000'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px'
      }}>
        <h4 className="pixel-title" style={{
          margin: 0,
          fontSize: '0.75rem',
          color: '#DC143C'
        }}>
          VOICE CHAT
        </h4>
        <div className="pixel-text" style={{
          fontSize: '0.7rem',
          color: '#888'
        }}>
          {participants.length + 1} connected
        </div>
      </div>

      {error && (
        <div style={{
          padding: '8px',
          backgroundColor: '#4a0000',
          border: '1px solid #DC143C',
          marginBottom: '10px',
          fontSize: '0.8rem',
          color: '#FF6B6B'
        }}>
          {error}
        </div>
      )}

      {isVoiceRestricted() && (
        <div className="pixel-text" style={{
          padding: '4px 6px',
          backgroundColor: '#4a0000',
          border: '1px solid #DC143C',
          marginBottom: '6px',
          fontSize: '0.75rem',
          color: '#FFD700',
          textAlign: 'center'
        }}>
          {gamePhase === 'night' && playerRole !== 'werewolf'
            ? '🔇 Voice disabled during night'
            : '🔇 Voice restricted'}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={toggleMute}
          disabled={isVoiceRestricted()}
          className="pixel-button pixel-text"
          style={{
            padding: '6px 12px',
            backgroundColor: isMuted ? '#8B0000' : '#228B22',
            color: 'white',
            border: 'none',
            cursor: isVoiceRestricted() ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            opacity: isVoiceRestricted() ? 0.5 : 1
          }}
        >
          {isMuted ? '🔇 Unmute' : '🎤 Mute'}
        </button>
      </div>

    </div>
  );
};

export default VoiceChatControls;
