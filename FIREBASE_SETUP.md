# Firebase Setup Guide for Shared Milestone Counter

This guide explains how to set up Firebase for the shared visitor counter that works across all users.

## Overview

The website now uses Firebase Firestore to store a shared visitor count that is consistent for all users. If Firebase is not configured, the system falls back to local storage (per-user counter).

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add a project" or "Create a project"
3. Enter a project name (e.g., "toranomon-vt")
4. Follow the setup wizard:
   - Enable Google Analytics (optional)
   - Accept the terms
5. Click "Create project"

## Step 2: Create a Firestore Database

1. In the Firebase Console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose **Production mode** or **Test mode** (Test mode is fine for development)
4. Select a location (choose one closest to your users, e.g., "asia-northeast1" for Japan)
5. Click "Enable"

## Step 3: Get Your Firebase Config

1. In the Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (`</>`) to add a web app
5. Register your app with a name (e.g., "toranomon-website")
6. Copy the `firebaseConfig` object values

## Step 4: Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values:

```javascript
config: {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Your actual API key
  authDomain: "toranomon-vt.firebaseapp.com", // Your project ID
  projectId: "toranomon-vt", // Your project ID
  storageBucket: "toranomon-vt.appspot.com",
  messagingSenderId: "123456789012", // Your sender ID
  appId: "1:123456789012:web:abcdef123456" // Your app ID
}
```

## Step 5: Set Up Firestore Security Rules

In the Firebase Console, go to "Firestore Database" → "Rules" tab and set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to the counters collection
    match /counters/{counterId} {
      allow read, write: if true; // For development; restrict in production
    }
  }
}
```

**Note:** For production, you should restrict access more carefully.

## Step 6: Test the Setup

1. Open your website in a browser
2. Visit the homepage - the counter should increment
3. Open the browser console (F12) to see any errors
4. Check the Firebase Console → Firestore Database to see the counter document

## Troubleshooting

### Counter not incrementing
- Check browser console for errors
- Verify your Firebase config values are correct
- Ensure Firestore is enabled in your Firebase project

### "Firebase initialization failed" message
- This is expected if Firebase is not configured
- The system will fall back to local storage

### Permission denied errors
- Check your Firestore security rules
- Make sure the rules allow read/write access to the `counters` collection

## Cost Considerations

Firebase offers a generous free tier:
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage

For a typical website, this should be more than sufficient. Monitor usage in the Firebase Console.

## Production Recommendations

1. **Restrict security rules** to only allow specific operations
2. **Enable Firebase App Check** to prevent abuse
3. **Set up billing alerts** to monitor costs
4. **Consider rate limiting** for the counter endpoint

## Alternative: Using a Different Backend

If you prefer not to use Firebase, you can:
- Use Supabase (open-source Firebase alternative)
- Create a simple Node.js/Python backend with a database
- Use a serverless function (AWS Lambda, Cloud Functions)

The code is designed to fall back to local storage if Firebase is not available.
