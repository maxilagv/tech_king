# Firebase local setup

## 1) Complete local env vars
Edit `.env.local` and set:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

These values are in Firebase Console:
`Project settings > Your apps > Firebase SDK snippet > Config`.

## 2) Optional: set admin fallback
If you want admin login by email/uid without custom claims:

- `VITE_ADMIN_EMAIL`
- `VITE_ADMIN_UID`

## 3) Optional: use emulators
If you run local emulators, set:

- `VITE_FIREBASE_USE_EMULATORS=true`
- `VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=127.0.0.1`
- `VITE_FIREBASE_FIRESTORE_EMULATOR_PORT=8080`
- `VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1`
- `VITE_FIREBASE_AUTH_EMULATOR_PORT=9099`

Then run Firebase emulators before `npm run dev`.

## 4) Run locally
```bash
npm run dev
```

If Firebase is not configured, the app now shows which vars are missing.
