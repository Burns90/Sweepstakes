# World Cup Sweepstake App - Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

## Step 1: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use an existing one)
3. Enable the following services:
   - **Firestore Database** (Production mode)
   - **Authentication** (Email/Password provider)
   - **Hosting** (optional, for deployment)

### Create a Web App in Firebase

1. In Firebase Console, click "Add App" → Web
2. Copy your Firebase config (you'll see keys like `apiKey`, `authDomain`, etc.)

### Set Up Firestore Database

1. Go to Firestore → Rules tab
2. Replace the default rules with the rules from `FIRESTORE_SETUP.md`
3. Publish the rules

## Step 2: Install and Configure the App

### Clone/Navigate to Project

```bash
cd sweepstake-app
```

### Install Dependencies

```bash
npm install
```

### Set Up Environment Variables

Create a `.env` file in the `sweepstake-app` directory with your Firebase config:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

You can find these values in Firebase Console → Project Settings → Your apps → Web app config.

## Step 3: Run the App Locally

```bash
npm start
```

The app will open at `http://localhost:3000`

## Step 4: Test the App

### Create a Test Account

1. Go to `/signup`
2. Sign up with an email and password
3. You'll be redirected to the home page as an "owner"

### Create a Sweepstake (Owner)

1. Click "Create Sweepstake"
2. Enter a name (e.g., "My World Cup Pool")
3. Select an enrollment deadline (must be in the future)
4. You'll get a league code (e.g., `ABC123`)
5. You'll see the owner dashboard showing player list

### Join a Sweepstake (Player)

1. Open a new browser tab / incognito window
2. Sign up with a different email
3. Click "Join Sweepstake"
4. Enter the league code from step 4 above
5. You'll be assigned a random team and see your player dashboard

### Test Owner Dashboard Features

- View all players and their assigned teams
- Check their "in tournament" status
- Mark players as paid (checkbox)
- Export player list as CSV

### Test Player Dashboard Features

- See your assigned team
- View leaderboard of all players
- See which teams are still in the tournament
- Access fixtures page (currently shows placeholder)

## Step 5: Integrate World Cup API

Currently, the fixtures page is a placeholder. When you have the World Cup API endpoint:

1. Edit `src/services/worldCupApi.ts`
2. Replace the placeholder functions with actual API calls
3. Implement the following functions:
   - `getUpcomingMatches()` - Get upcoming matches
   - `getMatchResults()` - Get completed matches
   - `getTournamentWinner()` - Get current tournament winner
   - `getAllMatches()` - Get all matches (for fixtures page)

## Step 6: Deploy to Firebase Hosting (Optional)

### Build the App

```bash
npm run build
```

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Deploy

```bash
firebase login
firebase init hosting
firebase deploy
```

## Troubleshooting

### "Users cannot be created" Error

- Check that Authentication is enabled in Firebase Console
- Ensure Email/Password provider is enabled

### "Permission denied" Firestore Errors

- Verify Firestore rules are properly set up (see `FIRESTORE_SETUP.md`)
- Make sure you're signed in

### Teams Not Showing Up

- Check that Firestore database is initialized
- Verify the player assignment logic in `src/services/sweepstakeApi.ts`

## File Structure

```
sweepstake-app/
├── public/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── ProtectedRoute.tsx
│   │   └── Sweepstake/
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── SweepstakeContext.tsx
│   ├── pages/
│   │   ├── CreateSweepstake.tsx
│   │   ├── FixturesPage.tsx
│   │   ├── Home.tsx
│   │   ├── JoinSweepstake.tsx
│   │   ├── Login.tsx
│   │   ├── OwnerDashboard.tsx
│   │   ├── PlayerDashboard.tsx
│   │   └── Signup.tsx
│   ├── services/
│   │   ├── auth.ts
│   │   ├── firebase.ts
│   │   ├── sweepstakeApi.ts
│   │   └── worldCupApi.ts
│   ├── App.tsx
│   ├── App.css
│   └── index.tsx
├── .env
├── FIRESTORE_SETUP.md
├── package.json
└── README.md
```

## Next Steps

1. Confirm Firebase is set up correctly
2. Test user signup/login
3. Test sweepstake creation and joining
4. Find and integrate the World Cup API
5. Set up Cloud Functions for automatic winner detection
6. Deploy to Firebase Hosting

## Need Help?

- Firebase Docs: https://firebase.google.com/docs
- React Router: https://reactrouter.com
- Firestore: https://firebase.google.com/docs/firestore
