# Werewolf Game - Vercel Deployment Guide

## Quick Deploy to Vercel

### Step 1: Push to GitHub (Already Done ✅)
Your code is already on GitHub at: `https://github.com/CS196Illinois/FA25-Group9`

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Sign Up" or "Login"
   - Choose "Continue with GitHub"

2. **Import Your Repository**
   - Click "Add New..." → "Project"
   - Find and select `FA25-Group9` repository
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset:** Create React App
   - **Root Directory:** Click "Edit" → Enter `Project/werewolf-game`
   - **Build Command:** `npm run build` (default, keep as is)
   - **Output Directory:** `build` (default, keep as is)
   - **Install Command:** `npm install` (default, keep as is)

4. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - You'll get a URL like: `https://your-project-name.vercel.app`

### Step 3: Test Your Deployment

1. Open the Vercel URL
2. Click "Host Game"
3. Share the URL with friends (or use QR code)
4. They should be able to scan and join!

---

## How the Game Works

### For the Host:
1. Go to your Vercel URL
2. Click "Host Game"
3. Configure settings (player count, timers)
4. Click "Create Game"
5. **Share the QR code** or **share the game code**
6. Wait for players to join and ready up
7. Click "Start Game" when everyone is ready

### For Players:
1. **Scan the QR code** OR **visit the Vercel URL and click "Join Game"**
2. Enter your name
3. Click "Ready"
4. Wait for host to start

### During the Game:
- **Night Phase:** Werewolves select victim, special roles act
- **Day Phase:** See who died, discuss in voice chat
- **Voting Phase:** Vote to eliminate a suspect
- **Results:** See vote results, repeat until a team wins

---

## Voice Chat Setup

Voice chat uses **Agora** (already configured with App ID).

**Features:**
- ✅ Auto-joins when game starts
- ✅ Auto-mutes non-werewolves during night
- ✅ Manual mute/unmute controls
- ✅ Shows participant count
- ✅ Leave Voice button to disconnect

**Note:** Free tier supports up to 10 players - perfect for your game!

---

## Troubleshooting

### Build Fails on Vercel
- Make sure Root Directory is set to `Project/werewolf-game`
- Check that all dependencies are in `package.json`

### Voice Chat Not Working
- Make sure players allow microphone permissions
- Check browser console for errors
- Agora free tier: 10,000 minutes/month (more than enough!)

### Players Can't Join
- Make sure they're using the exact game code (case-sensitive)
- Check Firebase is reachable (already configured)
- Try refreshing the page

### Game Doesn't Start
- Make sure all players clicked "Ready"
- Host must click "Start Game"
- Check browser console for errors

---

## Firebase Configuration

Already set up! Your Firebase project:
- **Database:** `werewolf-game-441e4-default-rtdb.firebaseio.com`
- **Auth:** Anonymous authentication enabled
- **Real-time sync:** All players see updates instantly

---

## Features Implemented

✅ QR Code joining
✅ Real-time lobby sync
✅ Role assignment (Werewolf, Doctor, Detective, Seer, Villager)
✅ Night/Day phase system
✅ Voting and elimination
✅ Win condition detection
✅ Voice chat with Agora
✅ Phase-based muting
✅ Firebase backend

---

## Need Help?

1. Check browser console (F12) for errors
2. Check Vercel deployment logs
3. Make sure Firebase is accessible
4. Test locally first: `cd Project/werewolf-game && npm start`

---

**Have fun playing Werewolf! 🐺🎮**
