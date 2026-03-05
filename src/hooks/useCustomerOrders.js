import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/api/firebase";

function getTimeValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

export function useCustomerOrders(customerId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customerId) {
      setOrders([]);
      setLoading(false);
      setError("");
      return () => {};
    }

    if (!isFirebaseConfigured || !db) {
      setOrders([]);
      setLoading(false);
      setError("Firebase no esta configurado.");
      return () => {};
    }

    const ref = collection(db, "orders");
    const q = query(ref, where("customerId", "==", customerId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt));
        setOrders(items);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError?.message || "No se pudieron cargar tus pedidos.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [customerId]);

  return { orders, loading, error };
}
