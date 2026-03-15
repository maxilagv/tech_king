import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/api/firebase";

export function useConfigDoc(docId, { normalize, fallback = {} } = {}) {
  const normalizeValue =
    typeof normalize === "function"
      ? normalize
      : (value) => value;
  const [data, setData] = useState(() => normalizeValue(fallback));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setData(normalizeValue(fallback));
      setLoading(false);
      setError("Firebase no esta configurado");
      return () => {};
    }

    const ref = doc(db, "config", docId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(normalizeValue(snapshot.exists() ? snapshot.data() : fallback));
        setLoading(false);
      },
      (err) => {
        setData(normalizeValue(fallback));
        setError(err.message || `Error cargando config ${docId}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docId, normalizeValue]);

  return { data, loading, error };
}
