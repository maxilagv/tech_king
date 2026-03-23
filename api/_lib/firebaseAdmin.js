import { readFileSync } from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

function loadServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString(
      "utf8"
    );
    return JSON.parse(decoded);
  }

  return null;
}

function loadServiceAccount() {
  const fromEnv = loadServiceAccountFromEnv();
  if (fromEnv) return fromEnv;

  const credentialsPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(process.cwd(), "serviceAccountKey.json");

  return JSON.parse(readFileSync(credentialsPath, "utf8"));
}

export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });
}

export function getAdminDb() {
  return getAdminApp().firestore();
}

export async function verifyAuthorizationHeader(headerValue) {
  const authHeader = String(headerValue || "");
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Falta el token de autorizacion.");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("El token de autorizacion es invalido.");
  }

  getAdminApp();
  return admin.auth().verifyIdToken(token);
}

export const AdminFieldValue = admin.firestore.FieldValue;
