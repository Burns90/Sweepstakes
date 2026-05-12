# Firebase Setup - Step by Step

## Step 1: Create Firebase Project (2 min)

1. Open https://console.firebase.google.com in your browser
2. Click **"Create project"** (blue button)
3. Enter a project name (e.g., "World Cup Sweepstake")
4. Click **Continue**
5. Toggle **"Enable Google Analytics"** OFF (not needed)
6. Click **Create project**
7. Wait 30-60 seconds for it to complete (you'll see a loading screen)
8. Click **Continue** when done

**You're now in Firebase Console ✓**

---

## Step 2: Enable Authentication (1 min)

1. In left sidebar, click **Authentication** (looks like a person icon)
2. Click **Get Started** button
3. You'll see "Sign-in method" - click **Email/Password**
4. Toggle the switch to **Enable** (blue)
5. Click **Save**

**Email/Password auth is now enabled ✓**

---

## Step 3: Create Firestore Database (2 min)

1. In left sidebar, click **Firestore Database** (looks like a document)
2. Click **Create database** button
3. A popup appears - select **Start in production mode**
4. Click **Next**
5. Select your location (pick closest to you, or US if unsure)
6. Click **Enable**
7. Wait 30 seconds for it to initialize

**Firestore is ready ✓**

---

## Step 4: Get Your Firebase Config (1 min)

1. Click the **gear icon** ⚙️ at top left (Project Settings)
2. Go to **"Your apps"** section (you should see it)
3. Under "Web Apps", you'll see your app listed, OR click **"</>  Web"** to add one
4. Copy the entire `firebaseConfig` object that looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-123abc",
  storageBucket: "your-project-123abc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd1234efgh5678"
};
```

**Note each value:**
- `apiKey` - looks like `AIza...`
- `authDomain` - looks like `xxx.firebaseapp.com`
- `projectId` - usually `xxx-123abc`
- `storageBucket` - looks like `xxx.appspot.com`
- `messagingSenderId` - a number
- `appId` - looks like `1:123...:web:...`

---

## Step 5: Update Your .env File

1. Open `/sweepstake-app/.env` in your editor
2. Replace the placeholder values with your actual Firebase config:

```
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-123abc
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-123abc.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcd1234efgh5678
```

3. Save the file

---

## Step 6: Set Firestore Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click **Rules** tab
3. Replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid;
      allow create: if request.auth != null;
    }

    // Sweepstakes collection
    match /sweepstakes/{sweepstakeId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;

      // Players subcollection
      match /players/{playerId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == resource.data.userId || request.auth.uid == get(/databases/$(database)/documents/sweepstakes/$(sweepstakeId)).data.ownerId;
        allow create: if request.auth != null;
      }

      // Matches subcollection
      match /matches/{matchId} {
        allow read: if request.auth != null;
        allow write: if false;
      }
    }

    // Tournament collection
    match /tournament/{tournamentId} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **Publish**

---

## Step 7: Restart Your App

1. Stop your dev server (Ctrl+C in terminal)
2. Run: `npm start`
3. Wait for it to compile (~10 sec)
4. Browser opens to http://localhost:3000

---

## Step 8: Test It

1. Click **Sign up**
2. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!
3. Click **Sign Up**

**It should work now!** You'll be redirected to home page.

---

## Troubleshooting

**Still getting "api-key-not-valid" error?**
- Make sure you restarted `npm start` AFTER saving `.env`
- Check that all values in `.env` match exactly (no extra spaces)
- Verify you copied from the correct Firebase project

**Can't find Authentication/Firestore?**
- Make sure you're in the right Firebase project (check name at top)
- Try refreshing the Firebase console page

**Error when signing up?**
- Check browser console (F12) for error details
- Make sure Firestore Database is "created" (not just creating)

---

**Done! Let me know once you get past signup. Then we can test creating a sweepstake.**
