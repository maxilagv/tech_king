import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/api/firebase";

export async function getNextCounter(counterId) {
  const counterRef = doc(db, "counters", counterId);
  const nextValue = await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(counterRef);
    const current = snapshot.exists() ? snapshot.data().value || 0 : 0;
    const next = current + 1;
    tx.set(counterRef, { value: next, updatedAt: serverTimestamp() }, { merge: true });
    return next;
  });
  return nextValue;
}
