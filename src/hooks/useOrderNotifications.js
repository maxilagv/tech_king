import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/api/firebase";

export function useOrderNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = collection(db, "order_notifications");
    const notificationsQuery = query(ref, orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setNotifications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError?.message || "No se pudieron cargar las notificaciones.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { notifications, loading, error };
}
