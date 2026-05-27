import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/api/firebase";

export function useBlogs(options = {}) {
  const {
    onlyPublished = false,
    limit = null,
  } = options;
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filtersKey = useMemo(
    () => `${onlyPublished}-${limit || ""}`,
    [onlyPublished, limit]
  );

  useEffect(() => {
    const ref = collection(db, "blogs");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (onlyPublished) {
          items = items.filter((item) => item.published !== false);
        }
        // Ordenar por fecha de publicación/creación de forma descendente
        items = items.sort((a, b) => {
          const aTime = a.publishedAt?.seconds || a.createdAt?.seconds || 0;
          const bTime = b.publishedAt?.seconds || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        if (limit) {
          items = items.slice(0, limit);
        }
        setBlogs(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error cargando blogs");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filtersKey, onlyPublished, limit]);

  return { blogs, loading, error };
}
