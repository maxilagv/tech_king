import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/api/firebase";

export function useFxRates() {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = doc(db, "config", "rates");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setRates(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error cargando cotizaciones");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { rates, loading, error };
}
