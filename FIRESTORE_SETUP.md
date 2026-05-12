# Firestore Security Rules

Copy these rules into your Firestore console under "Rules" tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid;
      allow create: if request.auth.uid == request.resource.data.uid;
    }

    // Sweepstakes collection
    match /sweepstakes/{sweepstakeId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;

      // Subcollection: players
      match /players/{playerId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == resource.data.userId || request.auth.uid == get(/databases/$(database)/documents/sweepstakes/$(sweepstakeId)).data.ownerId;
        allow create: if request.auth != null;
      }

      // Subcollection: matches
      match /matches/{matchId} {
        allow read: if request.auth != null;
        allow write: if false;
      }
    }

    // Tournament state
    match /tournament/{tournamentId} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // Deny all other reads/writes
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Steps to Set Up Firestore

1. Go to Firebase Console (console.firebase.google.com)
2. Create a new project or select existing one
3. Enable Firestore Database (start in production mode)
4. Copy the above rules into the Rules tab
5. Create a web app and copy the config to your .env file
6. Initialize collections by running the app (signup will create the first user document)
