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
  const { isJoined, isMuted, participants, joinRoom, leaveRoom, toggleMute, error } = useVoiceChat();

  const roomUrl = `https://your-domain.daily.co/${gameCode}`;

  useEffect(() => {
    if (autoJoin && !isJoined && playerName) {
      joinRoom(roomUrl, playerName);
    }

    return () => {
      if (isJoined) {
        leaveRoom();
      }
    };
  }, []); // Only run on mount

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
      padding: '15px',
      backgroundColor: '#1a0000',
      border: '2px solid #8B0000',
      marginBottom: '15px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h4 className="pixel-title" style={{
          margin: 0,
          fontSize: '0.9rem',
          color: '#DC143C'
        }}>
          VOICE CHAT
        </h4>
        <div className="pixel-text" style={{
          fontSize: '0.8rem',
          color: '#888'
        }}>
          {participants.length} connected
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
          padding: '8px',
          backgroundColor: '#4a0000',
          border: '1px solid #DC143C',
          marginBottom: '10px',
          fontSize: '0.9rem',
          color: '#FFD700',
          textAlign: 'center'
        }}>
          {gamePhase === 'night' && playerRole !== 'werewolf'
            ? '🔇 Voice disabled during night phase'
            : '🔇 Voice restricted'}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={toggleMute}
          disabled={isVoiceRestricted()}
          className="pixel-button pixel-text"
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: isMuted ? '#8B0000' : '#228B22',
            color: 'white',
            border: 'none',
            cursor: isVoiceRestricted() ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: isVoiceRestricted() ? 0.5 : 1
          }}
        >
          {isMuted ? '🔇 Unmute' : '🎤 Mute'}
        </button>

        <button
          onClick={leaveRoom}
          className="pixel-button pixel-text"
          style={{
            padding: '12px 20px',
            backgroundColor: '#4a0000',
            color: '#DC143C',
            border: '1px solid #8B0000',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Leave Voice
        </button>
      </div>

      {/* Participants list */}
      <div style={{
        marginTop: '12px',
        maxHeight: '120px',
        overflowY: 'auto'
      }}>
        <div className="pixel-text" style={{
          fontSize: '0.8rem',
          color: '#888',
          marginBottom: '6px'
        }}>
          In voice chat:
        </div>
        {participants.map((participant) => (
          <div
            key={participant.session_id}
            className="pixel-text"
            style={{
              padding: '6px',
              fontSize: '0.85rem',
              color: '#DC143C',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{participant.user_name || 'Anonymous'}</span>
            {participant.local && <span style={{ color: '#FFD700' }}>(You)</span>}
            {participant.audio === false && <span>🔇</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceChatControls;
