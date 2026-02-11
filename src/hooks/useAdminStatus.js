import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useAdminStatus() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const adminUid = import.meta.env.VITE_ADMIN_UID;

    if (loading) return () => {};

    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return () => {};
    }

    user
      .getIdTokenResult()
      .then((result) => {
        if (!active) return;
        const isAdminClaim = result?.claims?.admin === true;
        const isAdminEmail = adminEmail && user.email === adminEmail;
        const isAdminUid = adminUid && user.uid === adminUid;
        setIsAdmin(isAdminClaim || isAdminEmail || isAdminUid);
        setChecking(false);
      })
      .catch(() => {
        if (!active) return;
        setIsAdmin(false);
        setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [user, loading]);

  return { isAdmin, checking };
}
