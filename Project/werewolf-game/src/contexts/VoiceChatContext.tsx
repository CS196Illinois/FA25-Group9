import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

// Your Agora App ID
const AGORA_APP_ID = '44d14f031f964b0e8371d5dd2e620c93';

interface VoiceChatContextType {
  client: IAgoraRTCClient | null;
  isJoined: boolean;
  isMuted: boolean;
  participants: string[];
  joinRoom: (channelName: string, userName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleMute: () => Promise<void>;
  error: string | null;
}

const VoiceChatContext = createContext<VoiceChatContextType | undefined>(undefined);

export const VoiceChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);

  const updateParticipants = useCallback(() => {
    const remoteUsers = client.remoteUsers.map((user: IAgoraRTCRemoteUser) => user.uid.toString());
    setParticipants(remoteUsers);
  }, [client]);

  const joinRoom = useCallback(async (channelName: string, userName: string) => {
    if (isJoined) {
      console.log('Already joined a channel');
      return;
    }

    try {
      console.log('Joining Agora channel:', channelName);

      // Join the channel (using null for token in testing mode)
      await client.join(AGORA_APP_ID, channelName, null, null);

      // Create and publish local audio track
      localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([localAudioTrack.current]);

      setIsJoined(true);
      setError(null);
      console.log('Successfully joined voice chat');

      // Listen for remote users
      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'audio') {
          await client.subscribe(user, mediaType);
          user.audioTrack?.play();
          console.log('Remote user published:', user.uid);
          updateParticipants();
        }
      });

      client.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
        console.log('Remote user unpublished:', user.uid);
        updateParticipants();
      });

      client.on('user-joined', (user: IAgoraRTCRemoteUser) => {
        console.log('User joined:', user.uid);
        updateParticipants();
      });

      client.on('user-left', (user: IAgoraRTCRemoteUser) => {
        console.log('User left:', user.uid);
        updateParticipants();
      });

      updateParticipants();
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join voice chat');
    }
  }, [client, isJoined, updateParticipants]);

  const leaveRoom = useCallback(async () => {
    if (!isJoined) {
      console.log('Not joined to any channel');
      return;
    }

    try {
      console.log('Leaving voice chat...');

      // Unpublish the local audio track
      if (localAudioTrack.current) {
        await client.unpublish([localAudioTrack.current]);
        localAudioTrack.current.stop();
        localAudioTrack.current.close();
        localAudioTrack.current = null;
      }

      // Leave the channel
      await client.leave();

      setIsJoined(false);
      setParticipants([]);
      setIsMuted(false);
      console.log('Successfully left voice chat');
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave voice chat');
      // Force reset state even if there's an error
      setIsJoined(false);
      setParticipants([]);
      setIsMuted(false);
    }
  }, [client, isJoined]);

  const toggleMute = useCallback(async () => {
    if (!localAudioTrack.current) return;

    try {
      const newMutedState = !isMuted;
      await localAudioTrack.current.setEnabled(!newMutedState);
      setIsMuted(newMutedState);
      console.log(newMutedState ? 'Muted' : 'Unmuted');
    } catch (err) {
      console.error('Error toggling mute:', err);
      setError('Failed to toggle mute');
    }
  }, [isMuted]);

  return (
    <VoiceChatContext.Provider
      value={{
        client,
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
