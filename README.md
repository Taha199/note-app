# Firebase Notes App

A complete notes web app built with Next.js, TypeScript, Tailwind CSS, Firebase Authentication, and Cloud Firestore. Notes are stored per user at `users/{uid}/notes/{noteId}` and protected by Firestore security rules.

## Features

- Email/password registration and login
- Google login
- Protected dashboard route
- Create, list, edit, and delete notes
- Per-user Firestore note storage
- Responsive UI with loading and error states
- Vercel-ready environment variable setup

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment example:

   ```bash
   cp .env.example .env.local
   ```

3. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).

4. In Firebase, add a Web App and copy the config values into `.env.local`:

   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

5. Enable Firebase Authentication providers:

   - Go to Authentication > Sign-in method.
   - Enable Email/Password.
   - Enable Google and choose a support email.

6. Create a Cloud Firestore database:

   - Go to Firestore Database.
   - Create a database in production mode.
   - Publish the rules from `firestore.rules`.

7. Run the development server:

   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000).

## Firestore Rules

The included `firestore.rules` file restricts notes so authenticated users can only access their own documents:

```txt
users/{uid}/notes/{noteId}
```

Deploy the rules from the Firebase Console or with Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

## Deploy To Vercel

1. Push this project to GitHub.
2. Import the repository in [Vercel](https://vercel.com/).
3. Add the same Firebase values from `.env.example` in Project Settings > Environment Variables.
4. Deploy.

Vercel will run `npm run build` automatically.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```
