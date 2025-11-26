import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import DailyIframe, { DailyCall, DailyParticipant } from '@daily-co/daily-js';

interface VoiceChatContextType {
  callObject: DailyCall | null;
  isJoined: boolean;
  isMuted: boolean;
  participants: DailyParticipant[];
  joinRoom: (roomUrl: string, userName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleMute: () => Promise<void>;
  error: string | null;
}

const VoiceChatContext = createContext<VoiceChatContextType | undefined>(undefined);

export const VoiceChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<DailyParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const callRef = useRef<DailyCall | null>(null);

  // Initialize call object
  useEffect(() => {
    const call = DailyIframe.createCallObject({
      audioSource: true,
      videoSource: false, // We only need audio for voice chat
    });

    callRef.current = call;
    setCallObject(call);

    // Set up event listeners
    call
      .on('joined-meeting', () => {
        console.log('Joined voice chat');
        setIsJoined(true);
        setError(null);
      })
      .on('left-meeting', () => {
        console.log('Left voice chat');
        setIsJoined(false);
        setParticipants([]);
      })
      .on('participant-joined', (event) => {
        console.log('Participant joined:', event.participant);
        updateParticipants(call);
      })
      .on('participant-updated', (event) => {
        console.log('Participant updated:', event.participant);
        updateParticipants(call);
      })
      .on('participant-left', (event) => {
        console.log('Participant left:', event.participant);
        updateParticipants(call);
      })
      .on('error', (event) => {
        console.error('Voice chat error:', event);
        setError(event.errorMsg || 'An error occurred with voice chat');
      });

    return () => {
      if (callRef.current) {
        callRef.current.destroy();
      }
    };
  }, []);

  const updateParticipants = useCallback((call: DailyCall) => {
    const parts = call.participants();
    const participantList = Object.values(parts);
    setParticipants(participantList);
  }, []);

  const joinRoom = useCallback(async (roomUrl: string, userName: string) => {
    if (!callObject) {
      setError('Voice chat not initialized');
      return;
    }

    try {
      console.log('Joining room:', roomUrl);
      await callObject.join({
        url: roomUrl,
        userName: userName
      });
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join voice chat');
    }
  }, [callObject]);

  const leaveRoom = useCallback(async () => {
    if (!callObject) return;

    try {
      await callObject.leave();
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  }, [callObject]);

  const toggleMute = useCallback(async () => {
    if (!callObject) return;

    try {
      const newMutedState = !isMuted;
      await callObject.setLocalAudio(!newMutedState);
      setIsMuted(newMutedState);
    } catch (err) {
      console.error('Error toggling mute:', err);
      setError('Failed to toggle mute');
    }
  }, [callObject, isMuted]);

  return (
    <VoiceChatContext.Provider
      value={{
        callObject,
        isJoined,
        isMuted,
        participants,
        joinRoom,
        leaveRoom,
        toggleMute,
        error
      }}
    >
      {children}
    </VoiceChatContext.Provider>
  );
};

export const useVoiceChat = () => {
  const context = useContext(VoiceChatContext);
  if (!context) {
    throw new Error('useVoiceChat must be used within a VoiceChatProvider');
  }
  return context;
};
