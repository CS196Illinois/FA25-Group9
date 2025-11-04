# Werewolf Game - Student Implementation Tasks

## Overview
The Firebase backend, lobby system, and role assignment are complete. Students will implement the main gameplay mechanics and UI.

## Current State
✅ **Completed:**
- Firebase Realtime Database integration
- Player authentication and lobby system
- Random role assignment (5 roles: Werewolf, Doctor, Detective, Seer, Villager)
- QR code joining
- Host controls

❌ **Needs Implementation:**
- Main game page with phase management
- Voting and elimination mechanics
- Role-specific abilities
- Win condition detection
- Game over screen

---

## TASK 1: Game Phase Management System
**Priority:** HIGH | **Estimated Time:** 6-8 hours | **Difficulty:** Medium

### Description
Implement the core game loop that cycles through different phases (Night → Day → Discussion → Voting → Results) with timers and automatic transitions.

### Requirements

#### 1.1 Phase State Management
Create a phase manager that handles:
- **Night Phase** (60 seconds): Werewolves vote on victim, special roles use abilities
- **Day Phase** (120 seconds): Reveal who died overnight, players discuss
- **Discussion Phase** (60 seconds): Open discussion before voting
- **Voting Phase** (45 seconds): All alive players vote to eliminate someone
- **Results Phase** (10 seconds): Show voting results and eliminated player

#### 1.2 Timer Implementation
- Display countdown timer for current phase
- Automatically advance to next phase when timer reaches 0
- Host can manually skip to next phase (optional)
- Pause/resume functionality (optional)

#### 1.3 Phase Transition Logic
```typescript
// Suggested structure in gameService.ts
async advanceToNextPhase(gameCode: string): Promise<void> {
  const game = await getGame(gameCode);

  switch (game.gameState.currentPhase) {
    case 'night':
      // Process night actions (eliminations, protections, investigations)
      // Move to day phase
      break;
    case 'day':
      // Move to discussion phase
      break;
    case 'discussion':
      // Move to voting phase
      break;
    case 'voting':
      // Tally votes and eliminate player
      // Move to results phase
      break;
    case 'results':
      // Check win conditions
      // Either end game or return to night phase
      break;
  }
}
```

### Files to Modify
- `src/pages/MainGamePage.tsx` - Main game UI
- `src/firebase/gameService.ts` - Add phase transition methods
- `src/contexts/GameContext.tsx` - Add phase management state

### Acceptance Criteria
- [ ] Timer displays and counts down correctly for each phase
- [ ] Phases automatically transition when timer expires
- [ ] All players see the same phase and timer (real-time sync)
- [ ] Phase name is clearly displayed to players
- [ ] Visual distinction between phases (colors, icons, etc.)

### Testing Instructions
1. Start a game with 4+ players
2. Verify night phase begins with 60s timer
3. Let timer expire or skip phase
4. Verify transition to day phase with 120s timer
5. Continue through all phases and verify cycle returns to night
6. Check all players see synchronized phases and timers

---

## TASK 2: Voting System and Elimination Mechanics
**Priority:** HIGH | **Estimated Time:** 5-7 hours | **Difficulty:** Medium-Hard

### Description
Implement the voting interface where players can vote to eliminate others during the day, and handle the elimination logic including vote tallying and tie-breaking.

### Requirements

#### 2.1 Voting Interface
Create a voting UI that shows:
- List of all **alive** players (can't vote for dead players)
- Current player's vote status
- Visual feedback when vote is submitted
- Disable voting after player has voted (or allow vote changes before phase ends)

#### 2.2 Vote Submission
```typescript
// In gameService.ts
async submitVote(gameCode: string, voterId: string, targetId: string): Promise<void> {
  // Update player's votedFor field in Firebase
  await update(ref(database, `games/${gameCode}/players/${voterId}`), {
    votedFor: targetId
  });
}
```

#### 2.3 Vote Tallying
At the end of voting phase:
- Count votes for each player
- Determine player with most votes
- Handle ties (randomly select one or no elimination)
- Mark eliminated player as `isAlive: false`

#### 2.4 Elimination Logic
```typescript
async eliminatePlayer(gameCode: string): Promise<string | null> {
  const game = await getGame(gameCode);
  const votes = {};

  // Count votes
  Object.values(game.players).forEach(player => {
    if (player.isAlive && player.votedFor) {
      votes[player.votedFor] = (votes[player.votedFor] || 0) + 1;
    }
  });

  // Find player with most votes
  const maxVotes = Math.max(...Object.values(votes));
  const candidates = Object.keys(votes).filter(id => votes[id] === maxVotes);

  // Handle tie (randomly pick one or return null for no elimination)
  const eliminatedId = candidates.length === 1 ? candidates[0] :
                       candidates[Math.floor(Math.random() * candidates.length)];

  if (eliminatedId) {
    await update(ref(database, `games/${gameCode}/players/${eliminatedId}`), {
      isAlive: false
    });
  }

  return eliminatedId;
}
```

#### 2.5 Vote Results Display
- Show vote counts for each player
- Highlight eliminated player
- Display "No elimination" if tie handling results in no elimination

### Files to Modify
- `src/pages/MainGamePage.tsx` - Voting UI
- `src/firebase/gameService.ts` - Vote methods
- `src/contexts/GameContext.tsx` - Vote state management

### Acceptance Criteria
- [ ] Players can vote for any alive player (except themselves - optional)
- [ ] Vote is submitted to Firebase and persists
- [ ] All players can see who has voted (not who they voted for)
- [ ] Votes are tallied correctly at end of voting phase
- [ ] Player with most votes is eliminated
- [ ] Tie-breaking logic works
- [ ] Results screen shows vote counts
- [ ] Eliminated player can no longer vote or use abilities

### Testing Instructions
1. Start game with 6 players
2. Progress to voting phase
3. Have each player vote for different players
4. Verify votes are recorded in Firebase
5. Let phase end and verify correct player eliminated
6. Test tie scenario (3 players vote for A, 3 for B)
7. Verify eliminated player is marked dead and can't participate

---

## TASK 3: Werewolf Night Actions and Team Communication
**Priority:** HIGH | **Estimated Time:** 4-6 hours | **Difficulty:** Medium

### Description
Implement the werewolf team's ability to see each other, communicate, and collectively vote on a victim during the night phase.

### Requirements

#### 3.1 Werewolf Team Visibility
During **night phase only**:
- Werewolves can see who the other werewolves are
- Display special indicator/badge for team members
- Other roles cannot see werewolf identities

```typescript
// In MainGamePage.tsx
const currentPlayer = players.find(p => p.id === currentUserId);
const isWerewolf = currentPlayer?.role === 'werewolf';
const isNightPhase = currentPhase === 'night';

// Show werewolf badge only if:
const showWerewolfBadge = (player: Player) => {
  return isNightPhase && isWerewolf && player.role === 'werewolf';
};
```

#### 3.2 Werewolf Voting System
- Only during night phase
- Only werewolves can participate
- Vote on which villager to eliminate
- Can change vote before night ends (optional)
- Show vote progress to all werewolves

#### 3.3 Night Elimination Processing
```typescript
async processNightElimination(gameCode: string): Promise<string | null> {
  const game = await getGame(gameCode);
  const werewolfVotes = {};

  // Count werewolf votes
  Object.values(game.players).forEach(player => {
    if (player.role === 'werewolf' && player.isAlive && player.votedFor) {
      werewolfVotes[player.votedFor] = (werewolfVotes[player.votedFor] || 0) + 1;
    }
  });

  // Determine victim (most votes or random if tie)
  const maxVotes = Math.max(...Object.values(werewolfVotes));
  const victims = Object.keys(werewolfVotes).filter(id => werewolfVotes[id] === maxVotes);
  const victimId = victims[Math.floor(Math.random() * victims.length)];

  // Check if victim is protected by doctor
  const victim = game.players[victimId];
  if (victim?.isProtected) {
    console.log('Victim was protected by doctor!');
    return null; // No one dies
  }

  // Eliminate victim
  if (victimId) {
    await update(ref(database, `games/${gameCode}/players/${victimId}`), {
      isAlive: false
    });
  }

  return victimId;
}
```

#### 3.4 Visual Design
- Distinct UI during night phase for werewolves vs other roles
- Dark/red theme for werewolf night interface
- Clear indication of team members
- Vote status for werewolf team

### Files to Modify
- `src/pages/MainGamePage.tsx` - Night phase UI
- `src/firebase/gameService.ts` - Night action processing
- `src/contexts/GameContext.tsx` - Night phase state

### Acceptance Criteria
- [ ] Werewolves can see each other during night phase only
- [ ] Werewolves can vote on a victim
- [ ] All werewolves see each other's vote status (not specific votes)
- [ ] Victim with most werewolf votes is eliminated
- [ ] Non-werewolves see "waiting" screen during night
- [ ] Doctor protection prevents werewolf kill
- [ ] Tie-breaking works for night votes

### Testing Instructions
1. Start game with 2 werewolves
2. Progress to night phase
3. Verify both werewolves can see each other
4. Verify other players see "Night phase - waiting" message
5. Have both werewolves vote for same player
6. Progress to day phase and verify correct player died
7. Test doctor protection (next task) cancels werewolf kill

---

## TASK 4: Special Role Abilities (Doctor, Detective, Seer)
**Priority:** MEDIUM | **Estimated Time:** 6-8 hours | **Difficulty:** Medium-Hard

### Description
Implement the unique abilities for Doctor, Detective, and Seer roles that are used during the night phase.

### Requirements

#### 4.1 Doctor Ability - Protection
**Mechanic:** Choose one player to protect each night. Protected player survives werewolf attack.

```typescript
// In gameService.ts
async protectPlayer(gameCode: string, doctorId: string, targetId: string): Promise<void> {
  const game = await getGame(gameCode);

  // Verify it's night phase and user is doctor
  if (game.gameState.currentPhase !== 'night') {
    throw new Error('Can only protect during night phase');
  }

  const doctor = game.players[doctorId];
  if (doctor.role !== 'doctor') {
    throw new Error('Only doctor can protect');
  }

  // Clear all protections first
  await clearProtections(gameCode);

  // Apply new protection
  await update(ref(database, `games/${gameCode}/players/${targetId}`), {
    isProtected: true
  });
}
```

**UI Requirements:**
- Show protection interface only to doctor during night
- Display all alive players as options
- Can protect self (optional rule)
- Visual confirmation when protection is set
- Cannot change protection once submitted (or allow changes)

#### 4.2 Detective Ability - Investigation
**Mechanic:** Choose one player to investigate each night. Learn if they are werewolf or not.

```typescript
async investigatePlayer(gameCode: string, detectiveId: string, targetId: string): Promise<string> {
  const game = await getGame(gameCode);

  // Verify permissions
  const detective = game.players[detectiveId];
  if (detective.role !== 'detective') {
    throw new Error('Only detective can investigate');
  }

  const target = game.players[targetId];
  const result = target.role === 'werewolf' ? 'werewolf' : 'villager';

  // Store investigation result (optional - for history)
  await update(ref(database, `games/${gameCode}/players/${detectiveId}`), {
    lastInvestigation: {
      targetId,
      targetName: target.name,
      result,
      round: game.gameState.round
    }
  });

  return result;
}
```

**UI Requirements:**
- Show investigation interface only to detective during night
- Display all alive players as options (except self)
- Show immediate result: "Werewolf" or "Villager"
- Store result so detective can reference it later (optional)
- Cannot investigate same player twice in a row (optional rule)

#### 4.3 Seer Ability - Alignment Vision
**Mechanic:** Choose one player each night to see their exact role.

```typescript
async seeRole(gameCode: string, seerId: string, targetId: string): Promise<string> {
  const game = await getGame(gameCode);

  const seer = game.players[seerId];
  if (seer.role !== 'seer') {
    throw new Error('Only seer can see roles');
  }

  const target = game.players[targetId];

  // Store vision for seer's reference
  await update(ref(database, `games/${gameCode}/players/${seerId}`), {
    lastVision: {
      targetId,
      targetName: target.name,
      role: target.role,
      round: game.gameState.round
    }
  });

  return target.role; // Returns exact role: 'werewolf', 'doctor', etc.
}
```

**UI Requirements:**
- Show role vision interface only to seer during night
- Display all alive players as options (except self)
- Show exact role name when selected
- Keep history of previous visions (optional)
- Visual distinction from detective investigation

#### 4.4 Night Phase UI Layout
```
┌──────────────────────────────────────┐
│ NIGHT PHASE - Round 1 - 00:45        │
├──────────────────────────────────────┤
│                                      │
│ [IF WEREWOLF]                        │
│   Vote to eliminate a villager:     │
│   ☐ Alice  ☐ Bob  ☑ Carol           │
│   Werewolf team: You, Dave           │
│                                      │
│ [IF DOCTOR]                          │
│   Choose someone to protect:         │
│   ☐ Alice  ☑ Bob  ☐ Carol           │
│   [CONFIRM PROTECTION]               │
│                                      │
│ [IF DETECTIVE]                       │
│   Investigate a player:              │
│   ☐ Alice  ☐ Bob  ☐ Carol           │
│   [INVESTIGATE]                      │
│   Last result: Bob is a Villager     │
│                                      │
│ [IF SEER]                            │
│   See someone's role:                │
│   ☐ Alice  ☐ Bob  ☐ Carol           │
│   [SEE ROLE]                         │
│   Last vision: Bob is Doctor         │
│                                      │
│ [IF VILLAGER]                        │
│   Waiting for night phase to end...  │
│   💤 You have no night action        │
│                                      │
└──────────────────────────────────────┘
```

### Files to Modify
- `src/pages/MainGamePage.tsx` - Role ability UI
- `src/firebase/gameService.ts` - Ability methods
- `src/firebase/schema.ts` - Add ability tracking fields to Player type

### Acceptance Criteria
- [ ] Doctor can protect one player per night
- [ ] Protection prevents werewolf elimination
- [ ] Detective receives correct investigation result
- [ ] Seer sees exact role of target
- [ ] Each role sees only their own ability interface
- [ ] Abilities can only be used during night phase
- [ ] Results are stored and viewable to role user
- [ ] Cannot use ability on same target twice in row (optional)

### Testing Instructions
1. Create game with all 5 roles
2. Progress to night phase
3. As werewolves, vote for Alice
4. As doctor, protect Alice
5. Progress to day and verify Alice survived (protection worked)
6. Restart, have detective investigate a werewolf
7. Verify detective sees "Werewolf" result
8. Have seer check a player's role
9. Verify seer sees exact role name

---

## TASK 5: Win Condition Detection and Game Over Screen
**Priority:** MEDIUM | **Estimated Time:** 3-5 hours | **Difficulty:** Easy-Medium

### Description
Implement logic to detect when werewolves or villagers win, end the game, and display results.

### Requirements

#### 5.1 Win Condition Checking
Check after each elimination (night and day):

**Werewolves Win:**
- Number of alive werewolves ≥ number of alive villagers

**Villagers Win:**
- All werewolves are dead (0 alive werewolves)

```typescript
// In rolesConfig.ts (already partially implemented)
export function checkWinCondition(players: { [key: string]: Player }): 'werewolves' | 'villagers' | null {
  const alivePlayers = getAlivePlayers(players);
  const aliveWerewolves = alivePlayers.filter(p => p.role === 'werewolf');
  const aliveVillagers = alivePlayers.filter(p => p.role !== 'werewolf');

  if (aliveWerewolves.length === 0) {
    return 'villagers'; // Villagers win
  }

  if (aliveWerewolves.length >= aliveVillagers.length) {
    return 'werewolves'; // Werewolves win
  }

  return null; // Game continues
}
```

#### 5.2 Game End Logic
```typescript
async endGame(gameCode: string, winner: 'werewolves' | 'villagers'): Promise<void> {
  await update(ref(database, `games/${gameCode}`), {
    status: 'finished',
    'gameState/currentPhase': 'finished',
    'gameState/winningSide': winner,
    'gameState/lastUpdate': Date.now()
  });
}
```

#### 5.3 Game Over Screen UI
Display:
- **Winner announcement** (Werewolves or Villagers)
- **All players with roles revealed**
- **Game statistics:**
  - Total rounds played
  - Players eliminated
  - Successful protections (if doctor)
  - Correct investigations (if detective)
- **Action buttons:**
  - "Return to Lobby" button
  - "New Game" button (creates new game with same players - optional)
  - "Leave Game" button

#### 5.4 Role Reveal
```
┌────────────────────────────────────────┐
│   🎉 WEREWOLVES WIN! 🐺                │
├────────────────────────────────────────┤
│                                        │
│ FINAL RESULTS - Round 3                │
│                                        │
│ 🐺 WEREWOLF TEAM (Winners)             │
│   • Dave 🐺 Werewolf (Alive)           │
│   • Eve 🐺 Werewolf (Alive)            │
│                                        │
│ 👨‍🌾 VILLAGER TEAM                      │
│   • Alice 👨‍🌾 Villager (Dead - R2)     │
│   • Bob ⚕️ Doctor (Dead - R1)           │
│   • Carol 🔍 Detective (Dead - R3)      │
│   • Frank 👁️ Seer (Alive)              │
│                                        │
│ GAME STATS                             │
│   • Total Rounds: 3                    │
│   • Werewolf Kills: 2                  │
│   • Day Eliminations: 1                │
│   • Successful Protections: 1          │
│                                        │
│ [RETURN TO LOBBY]  [NEW GAME]          │
│                                        │
└────────────────────────────────────────┘
```

### Files to Modify
- `src/pages/MainGamePage.tsx` - Game over screen
- `src/firebase/gameService.ts` - Win condition checking
- `src/firebase/rolesConfig.ts` - Win detection helpers
- `src/contexts/GameContext.tsx` - Game end state

### Acceptance Criteria
- [ ] Win condition is checked after each elimination
- [ ] Game ends immediately when condition is met
- [ ] Correct winner is determined
- [ ] Game over screen displays to all players
- [ ] All roles are revealed
- [ ] Game statistics are accurate
- [ ] Players can return to lobby or leave

### Testing Instructions
1. Start game with 2 werewolves, 4 villagers
2. Have werewolves kill 2 villagers over 2 nights
3. Verify game ends when werewolves equal villagers (2v2)
4. Verify "Werewolves Win" screen appears
5. Restart game, eliminate both werewolves during day voting
6. Verify "Villagers Win" screen appears
7. Check all roles are revealed correctly
8. Test "Return to Lobby" button functionality

---

## Additional Implementation Notes

### Firebase Structure Reminder
```javascript
games/
  {GAME_CODE}/
    gameState/
      currentPhase: 'night' | 'day' | 'discussion' | 'voting' | 'results' | 'finished'
      round: number
      timeRemaining: number
      winningSide?: 'werewolves' | 'villagers'
    players/
      {userId}/
        role: string
        isAlive: boolean
        votedFor?: string
        isProtected?: boolean
        lastInvestigation?: {...}
        lastVision?: {...}
```

### Existing Helper Functions
Already implemented in `src/firebase/rolesConfig.ts`:
- `isWerewolf(roleId: string): boolean`
- `getWerewolves(players): Player[]`
- `getAlivePlayers(players): Player[]`
- `haveWerewolvesWon(players): boolean`
- `haveVillagersWon(players): boolean`

### Game Service Methods Already Available
From `src/firebase/gameService.ts`:
- `subscribeToGame(gameCode, callback)` - Real-time updates
- `updateGamePhase(gameCode, phase, timeRemaining)`
- `submitVote(gameCode, voterId, targetId)`
- `eliminatePlayer(gameCode, playerId)`
- `endGame(gameCode, winningSide)`

### Recommended Development Order
1. Task 1: Phase Management (foundation)
2. Task 2: Voting System (core gameplay)
3. Task 3: Werewolf Actions (night phase)
4. Task 4: Special Abilities (role variety)
5. Task 5: Win Conditions (game completion)

### Testing Strategy
- Test with minimum 4 players (2 werewolves, 2 villagers)
- Use different browsers/incognito windows for local testing
- Check Firebase Console to verify data structure
- Test all edge cases (ties, protections, investigations)
- Verify real-time sync across all clients

### Code Style Guidelines
- Follow existing TypeScript patterns in the codebase
- Use the established Firebase schema
- Add console.log statements for debugging
- Comment complex game logic
- Handle errors gracefully with try-catch
- Use existing utility functions from rolesConfig.ts

---

## Submission Requirements

For each task, students should:
1. **Create a feature branch** (e.g., `feature/phase-management`)
2. **Implement the requirements** with clean, commented code
3. **Test thoroughly** with multiple browsers
4. **Record a demo video** (2-3 minutes) showing the feature working
5. **Create a pull request** with:
   - Description of what was implemented
   - Screenshots/video of feature working
   - Any known bugs or limitations
   - Testing instructions

## Resources

- **Firebase Docs:** https://firebase.google.com/docs/database
- **React TypeScript:** https://react-typescript-cheatsheet.netlify.app/
- **Game Logic Reference:** Check `src/firebase/rolesConfig.ts` for role definitions
- **Existing Code:** Review `HostGamePage.tsx` and `PlayerSlotPage.tsx` for UI patterns

## Questions?
Contact the project lead or post in the team Discord/Slack channel.

Good luck! 🐺🎮
