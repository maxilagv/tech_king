import { useEffect, useState, useRef } from "react";
import { getAuthAsync } from "@/api/firebase";

/**
 * Lazily initializes Firebase Auth and subscribes to auth state changes.
 *
 * Auth initialization is deferred until this hook mounts (not at module load
 * time), which keeps the Firebase auth/iframe.js out of the critical rendering
 * path and improves LCP/TBT scores significantly.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    // getAuthAsync() dynamically imports firebase/auth — this is intentional.
    // The 90KB auth/iframe.js only downloads after this hook mounts,
    // NOT during the initial page load critical path.
    Promise.all([
      getAuthAsync(),
      import("firebase/auth"),
    ]).then(([auth, { onAuthStateChanged }]) => {
      if (cancelled) return;
      unsubscribeRef.current = onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      });
    }).catch(() => {
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
    };
  }, []);

  return { user, loading };
}
