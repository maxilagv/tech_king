import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/api/firebase";

export function useLandingHeroes(options = {}) {
  const { onlyActive = false } = options;
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = collection(db, "landing_heroes");
    const q = query(ref, orderBy("orden", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        if (onlyActive) {
          items = items.filter((item) => item.activo !== false);
        }
        setHeroes(items);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError?.message || "No se pudo cargar la configuracion del hero.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [onlyActive]);

  return { heroes, loading, error };
}
