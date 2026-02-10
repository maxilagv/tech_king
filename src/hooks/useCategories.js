import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/api/firebase";

export function useCategories(options = {}) {
  const { onlyActive = false } = options;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = collection(db, "categories");
    const q = query(ref, orderBy("orden", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (onlyActive) {
          items = items.filter((item) => item.activo !== false);
        }
        setCategories(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error cargando categorias");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [onlyActive]);

  return { categories, loading, error };
}
