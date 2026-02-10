import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const adminUid = import.meta.env.VITE_ADMIN_UID;

    if (!user) {
      setChecking(false);
      setAuthorized(false);
      return () => {};
    }

    user
      .getIdTokenResult()
      .then((result) => {
        if (!active) return;
        const isAdminClaim = result?.claims?.admin === true;
        const isAdminEmail = adminEmail && user.email === adminEmail;
        const isAdminUid = adminUid && user.uid === adminUid;
        setAuthorized(isAdminClaim || isAdminEmail || isAdminUid);
        setChecking(false);
      })
      .catch(() => {
        if (!active) return;
        setAuthorized(false);
        setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1020] text-white">
        <div className="flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-white/60">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          Cargando panel
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1020] text-white px-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Acceso restringido</p>
          <h2 className="text-2xl font-semibold">No tenes permisos de administrador.</h2>
          <p className="text-sm text-white/60">
            Contacta al administrador del sistema para obtener acceso.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
