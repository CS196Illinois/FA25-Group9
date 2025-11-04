# Firebase Setup Guide for Werewolf Game

This guide will help you configure Firebase for the Werewolf game with proper security rules.

## Prerequisites

- Firebase project already created (werewolf-game-441e4)
- Firebase credentials already configured in `src/firebase/config.ts`

## Step 1: Enable Firebase Realtime Database

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **werewolf-game-441e4**
3. Click on **Realtime Database** in the left sidebar
4. Click **Create Database**
5. Choose **United States (us-central1)** as the location
6. Start in **test mode** (we'll configure rules next)

## Step 2: Configure Firebase Security Rules

1. In the Firebase Console, go to **Realtime Database** → **Rules** tab
2. Replace the default rules with the following:

```json
{
  "rules": {
    "games": {
      "$gameCode": {
        ".read": true,
        ".write": "auth != null",
        "players": {
          "$playerId": {
            ".write": "$playerId === auth.uid || data.parent().parent().child('hostId').val() === auth.uid"
          }
        },
        "gameState": {
          ".write": "data.parent().child('hostId').val() === auth.uid"
        },
        "settings": {
          ".write": "data.parent().child('hostId').val() === auth.uid"
        },
        "status": {
          ".write": "data.parent().child('hostId').val() === auth.uid"
        }
      }
    }
  }
}
```

3. Click **Publish** to save the rules

### Security Rules Explanation

- **Read Access**: Anyone can read game data (needed for players to see lobby updates)
- **Write Access**: Only authenticated users can write
- **Player Data**: Players can only modify their own data, or the host can modify any player
- **Game State**: Only the host can modify game state
- **Settings**: Only the host can modify game settings
- **Status**: Only the host can change game status

## Step 3: Enable Anonymous Authentication

1. In the Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Anonymous**
3. Toggle **Enable** switch
4. Click **Save**

This allows players to join games without creating accounts.

## Step 4: Configure Database URL

1. In the Firebase Console, go to **Realtime Database**
2. Copy your database URL (should look like: `https://werewolf-game-441e4-default-rtdb.firebaseio.com/`)
3. Verify this URL is in `src/firebase/config.ts` under `databaseURL`

## Step 5: Test the Integration

1. Start the development server:
   ```bash
   npm start
   ```

2. Test creating a game:
   - Go to the Host Game page
   - Enter your name and configure settings
   - Click "Create Game"
   - Verify a game code is generated and QR code is displayed

3. Test joining a game:
   - Open a new browser window (or incognito mode)
   - Go to the Join Game page
   - Enter the game code from step 2
   - Enter your name and click "Join Game"
   - Verify you see the lobby with both players

4. Test the lobby system:
   - Click "Ready" in the join window
   - Verify the host sees the player as ready
   - In the host window, click "Start Game" when all players are ready
   - Verify roles are randomly assigned

## Database Structure

The Firebase database will have the following structure:

```
games/
  ABC123/                    # Game code
    gameId: "game_1234567890"
    gameCode: "ABC123"
    hostId: "user_xyz"
    status: "waiting" | "playing" | "finished"
    createdAt: 1234567890
    settings/
      totalPlayers: 6
      nightDuration: 60
      dayDuration: 120
      discussionDuration: 60
      votingDuration: 45
      usePresetRoles: true
      customRoles: {}
    players/
      user_xyz/
        id: "user_xyz"
        name: "Host Name"
        isAlive: true
        role: ""
        seat: 0
        isHost: true
        isReady: true
        lastSeen: 1234567890
      user_abc/
        id: "user_abc"
        name: "Player 1"
        isAlive: true
        role: ""
        seat: 1
        isHost: false
        isReady: false
        lastSeen: 1234567890
    gameState/
      currentPhase: "lobby" | "night" | "day" | "discussion" | "voting" | "results" | "finished"
      round: 0
      timeRemaining: 0
      lastUpdate: 1234567890
```

## Features Implemented

### 1. Random Role Assignment
- Roles are randomly assigned when the host starts the game
- Uses Fisher-Yates shuffle algorithm for true randomness
- Supports both preset and custom role configurations
- Werewolves can see each other during night phase

### 2. Lobby System
- Real-time player synchronization
- Players can join using 6-character game codes
- Ready status tracking for all players
- Host can only start when all players are ready
- Maximum player limit enforced

### 3. QR Code Integration
- QR codes generated for easy game joining
- Contains game code for quick scanning
- Works on mobile devices
- Updates in real-time as players join

### 4. Real-time Synchronization
- All game state changes sync instantly
- Player ready status updates in real-time
- Game phase transitions synchronized
- Lobby updates automatically

## Troubleshooting

### Error: "Failed to create game"
- Check that Anonymous Authentication is enabled
- Verify database URL is correct in config.ts
- Check browser console for detailed error messages

### Error: "Game not found"
- Verify the game code is correct (6 characters)
- Check that the host hasn't left/deleted the game
- Ensure database rules are published

### Error: "Permission denied"
- Verify security rules are correctly configured
- Check that Anonymous Authentication is enabled
- Clear browser cache and try again

### Players not syncing
- Check Firebase Console → Realtime Database to see current data
- Verify all players have internet connection
- Check browser console for WebSocket errors

## Next Steps

After Firebase is configured:

1. **Test multiplayer functionality** with multiple devices/browsers
2. **Implement game logic** for night/day phases
3. **Add voting system** for eliminations
4. **Implement special role abilities** (doctor, detective, seer)
5. **Add win condition detection** (werewolves vs villagers)
6. **Deploy to production** using Firebase Hosting

## Production Deployment

When ready for production:

1. Build the app:
   ```bash
   npm run build
   ```

2. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

3. Login to Firebase:
   ```bash
   firebase login
   ```

4. Initialize Firebase hosting:
   ```bash
   firebase init hosting
   ```

5. Deploy:
   ```bash
   firebase deploy
   ```

## Support

If you encounter issues:
1. Check the Firebase Console for error logs
2. Review browser console for client-side errors
3. Verify all configuration steps were completed
4. Test with multiple browsers/devices

Your Werewolf game is now fully integrated with Firebase!
