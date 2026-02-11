import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/api/firebase";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = collection(db, "suppliers");
    const q = query(ref, orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSuppliers(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error cargando proveedores");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { suppliers, loading, error };
}
