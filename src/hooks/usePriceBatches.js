import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/api/firebase";

function getTimeValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

export function usePriceBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setBatches([]);
      setLoading(false);
      setError("Firebase no esta configurado");
      return () => {};
    }

    const ref = query(collection(db, "price_batches"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const items = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt));
        setBatches(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error cargando remarcaciones");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { batches, loading, error };
}
