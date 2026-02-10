import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/api/firebase";

export function useProducts(options = {}) {
  const {
    onlyActive = false,
    featuredOnly = false,
    categorySlug = null,
    limit = null,
  } = options;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filtersKey = useMemo(
    () => `${onlyActive}-${featuredOnly}-${categorySlug || ""}-${limit || ""}`,
    [onlyActive, featuredOnly, categorySlug, limit]
  );

  useEffect(() => {
    const ref = collection(db, "products");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (onlyActive) {
          items = items.filter((item) => item.activo !== false);
        }
        if (featuredOnly) {
          items = items.filter((item) => item.destacado === true);
        }
        if (categorySlug) {
          items = items.filter((item) => item.categorySlug === categorySlug);
        }
        items = items.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        if (limit) {
          items = items.slice(0, limit);
        }
        setProducts(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error cargando productos");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filtersKey, onlyActive, featuredOnly, categorySlug, limit]);

  return { products, loading, error };
}
