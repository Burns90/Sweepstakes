# World Cup Sweepstake App

A full-featured web application for managing World Cup betting pools/sweepstakes. Owners can create sweepstakes, generate league codes, and manage players. Players can join via league codes and are randomly assigned World Cup teams. The app automatically tracks team elimination and declares winners.

## Features

### Authentication
- User signup with email and password
- Secure login/logout
- Firebase Authentication

### Owner Features
- Create new sweepstakes with enrollment deadlines
- Generate unique league codes for players to join
- View all players and their assigned teams
- Track player payment status
- Monitor team elimination status in real-time
- Export player list as CSV

### Player Features
- Join sweepstakes with league codes
- Random team assignment (no duplicates)
- View assigned team prominently
- See leaderboard and tournament standings
- Track which teams are still in the tournament
- Access fixture schedule and match results

### Fixtures & Results
- View upcoming World Cup matches
- See match results and scores
- Filter by tournament stage
- Real-time updates from World Cup API

### Automation (In Progress)
- Automatic team elimination tracking
- Winner detection when team wins tournament
- Notifications for winners

## Tech Stack

- **Frontend**: React 18, TypeScript, React Router
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Hosting**: Firebase Hosting (optional)

## Quick Start

1. **Set up Firebase** - See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Install dependencies**: `npm install`
3. **Configure environment**: Add your Firebase config to `.env`
4. **Start the app**: `npm start`

## Available Scripts

```bash
npm start           # Start dev server on http://localhost:3000
npm test            # Run tests
npm run build       # Build for production
```

## Setup & Deployment

For detailed setup instructions and deployment steps, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Need Help?

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for troubleshooting.
