import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredFirebaseValues.every(
  (value) => typeof value === "string" && value.trim().length > 0
);

const app = initializeApp(firebaseConfig);

// Firestore is needed immediately for data fetching (products, heroes, etc.)
export const db = getFirestore(app);

// ─── Lazy Firebase Auth ────────────────────────────────────────────────────────
// CRITICAL PERFORMANCE: Do NOT call getAuth(app) at module load time.
// Calling getAuth() triggers the download of auth/iframe.js (90KB) which
// adds ~1,474ms to the critical path before the page is interactive.
//
// Instead, auth is initialized lazily on first access. The browser only
// downloads iframe.js when the user actually needs authentication.
// ─────────────────────────────────────────────────────────────────────────────

let _auth = null;

export function getAuthInstance() {
  // Note: This is intentionally left as a sync stub.
  // In ESM/Vite context, use getAuthAsync() instead.
  throw new Error("Use getAuthAsync() in Vite/ESM projects.");
}

// Async version for use in hooks (preferred — avoids require() in ESM context)
let _authPromise = null;

export async function getAuthAsync() {
  if (_auth) return _auth;
  if (!_authPromise) {
    _authPromise = import("firebase/auth").then(({ getAuth }) => {
      _auth = getAuth(app);
      return _auth;
    });
  }
  return _authPromise;
}

// Analytics — defer completely (non-critical)
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    isSupported()
      .then((supported) => {
        if (supported) getAnalytics(app);
      })
      .catch(() => undefined);
  }, { once: true, passive: true });
}
