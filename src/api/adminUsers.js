import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseConfig, isFirebaseConfigured } from "@/api/firebase";
import { normalizeAdminModules } from "@/constants/adminAccess";

function getProvisioningAppName() {
  const nonce = Math.random().toString(36).slice(2, 10);
  return `admin-provision-${Date.now()}-${nonce}`;
}

export async function createEmployeeUser({
  email,
  password,
  displayName,
  modules,
  createdBy,
}) {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase no esta configurado.");
  }

  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const cleanName = String(displayName || "").trim();
  const cleanModules = normalizeAdminModules(modules);
  const cleanCreatedBy = String(createdBy || "").trim();

  if (!cleanEmail || !password || cleanModules.length === 0) {
    throw new Error("Completa email, contrasena y al menos un modulo.");
  }

  const appName = getProvisioningAppName();
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);

    if (cleanName) {
      await updateProfile(credential.user, { displayName: cleanName });
    }

    await setDoc(doc(db, "admin_users", credential.user.uid), {
      email: cleanEmail,
      displayName: cleanName,
      role: "employee",
      modules: cleanModules,
      active: true,
      createdBy: cleanCreatedBy || "system",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { uid: credential.user.uid, email: cleanEmail };
  } catch (error) {
    const code = String(error?.code || "");
    if (code === "auth/email-already-in-use") {
      throw new Error("Ese email ya existe en Firebase Auth.");
    }
    if (code === "auth/weak-password") {
      throw new Error("La contrasena es muy debil (minimo 6 caracteres).");
    }
    if (code === "auth/invalid-email") {
      throw new Error("El email no es valido.");
    }
    throw new Error(error?.message || "No se pudo crear el empleado.");
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}

export async function saveAdminUserProfile(uid, data) {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase no esta configurado.");
  }

  const cleanUid = String(uid || "").trim();
  if (!cleanUid) {
    throw new Error("UID de usuario invalido.");
  }

  const payload = {
    ...data,
    modules: normalizeAdminModules(data?.modules),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "admin_users", cleanUid), payload, { merge: false });
}
