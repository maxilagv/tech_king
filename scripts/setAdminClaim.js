import { readFileSync } from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

const uid = process.argv[2];

if (!uid) {
  console.error("Uso: node scripts/setAdminClaim.js <uid>");
  process.exit(1);
}

const credentialsPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(process.cwd(), "serviceAccountKey.json");

const serviceAccount = JSON.parse(readFileSync(credentialsPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(`Admin claim seteado para UID: ${uid}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seteando admin claim:", err);
  process.exit(1);
});
