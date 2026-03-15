import { readFileSync } from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

let firestoreInstance = null;

function loadServiceAccount() {
  const credentialsPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(process.cwd(), "serviceAccountKey.json");

  return JSON.parse(readFileSync(credentialsPath, "utf8"));
}

export function getAdminDb() {
  if (firestoreInstance) return firestoreInstance;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(loadServiceAccount()),
    });
  }

  firestoreInstance = admin.firestore();
  return firestoreInstance;
}

export const AdminFieldValue = admin.firestore.FieldValue;
