// Room Management Service

const DAILY_API_KEY = process.env.REACT_APP_DAILY_API_KEY;
const DAILY_DOMAIN = process.env.REACT_APP_DAILY_DOMAIN || 'your-domain.daily.co';
const DAILY_API_BASE = 'https://api.daily.co/v1';

export interface DailyRoomConfig {
  name: string;
  privacy?: 'public' | 'private';
  maxParticipants?: number;
  enableChat?: boolean;
  enableScreenshare?: boolean;
  startVideoOff?: boolean;
  startAudioOff?: boolean;
}

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    max_participants: number;
  };
}

/**
 * Create a new room
 * @param config Room configuration
 * @returns Room URL
 */
export async function createDailyRoom(config: DailyRoomConfig): Promise<string> {
  if (!DAILY_API_KEY) {
    console.warn('API key not configured, using simple room URL');
    return `https://${DAILY_DOMAIN}/${config.name}`;
  }

  try {
    const response = await fetch(`${DAILY_API_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: config.name,
        privacy: config.privacy || 'private',
        properties: {
          max_participants: config.maxParticipants || 20,
          enable_chat: config.enableChat ?? false,
          enable_screenshare: config.enableScreenshare ?? false,
          start_video_off: config.startVideoOff ?? true,
          start_audio_off: config.startAudioOff ?? false,
          enable_advanced_chat: false,
          enable_emoji_reactions: false
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create room: ${error.info || error.error}`);
    }

    const data: DailyRoom = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating room:', error);
    // Fallback to simple URL format
    return `https://${DAILY_DOMAIN}/${config.name}`;
  }
}

/**
 * Delete a room
 * @param roomName Name of the room to delete
 */
export async function deleteDailyRoom(roomName: string): Promise<void> {
  if (!DAILY_API_KEY) {
    console.warn('API key not configured, cannot delete room');
    return;
  }

  try {
    const response = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to delete room: ${error.info || error.error}`);
    }

    console.log(`Room ${roomName} deleted successfully`);
  } catch (error) {
    console.error('Error deleting room:', error);
  }
}

/**
 * Get room information
 * @param roomName Name of the room
 * @returns Room information
 */
export async function getDailyRoom(roomName: string): Promise<DailyRoom | null> {
  if (!DAILY_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Room doesn't exist
      }
      const error = await response.json();
      throw new Error(`Failed to get room: ${error.info || error.error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting room:', error);
    return null;
  }
}

/**
 * Generate a room URL for a game code
 * @param gameCode The game code to use as room name
 * @returns Room URL
 */
export function generateRoomUrl(gameCode: string): string {
  return `https://${DAILY_DOMAIN}/${gameCode}`;
}

/**
 * Create a room for a werewolf game
 * @param gameCode Game code to use as room name
 * @param maxPlayers Maximum number of players
 * @returns Room URL
 */
export async function createWerewolfGameRoom(
  gameCode: string,
  maxPlayers: number = 20
): Promise<string> {
  return createDailyRoom({
    name: gameCode,
    privacy: 'private',
    maxParticipants: maxPlayers,
    enableChat: false,
    enableScreenshare: false,
    startVideoOff: true,
    startAudioOff: false
  });
}

/**
 * Clean up room when game ends
 * @param gameCode Game code of the room to delete
 */
export async function cleanupGameRoom(gameCode: string): Promise<void> {
  await deleteDailyRoom(gameCode);
}
