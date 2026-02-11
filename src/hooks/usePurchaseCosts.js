import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/api/firebase";

export function usePurchaseCosts() {
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = collection(db, "purchase_costs");
    const q = query(ref, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCosts(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error cargando costos");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { costs, loading, error };
}
