import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/api/firebase";
import { getActiveOffersForBanners } from "@/utils/offers";

function sortOffers(offers) {
  return [...offers].sort((a, b) => {
    const pDiff = Number(b.prioridad || 0) - Number(a.prioridad || 0);
    if (pDiff !== 0) return pDiff;
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
}

export function useOffers(options = {}) {
  const { onlyActive = false } = options;
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setOffers([]);
      setLoading(false);
      setError("Firebase no esta configurado");
      return () => {};
    }

    const ref = collection(db, "offers");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        items = sortOffers(items);
        if (onlyActive) {
          items = getActiveOffersForBanners(items);
        }
        setOffers(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Error cargando ofertas");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [onlyActive]);

  return { offers, loading, error };
}
