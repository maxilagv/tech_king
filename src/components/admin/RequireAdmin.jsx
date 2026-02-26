import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function RequireAdmin({ children }) {
  const { user, isAdmin, checking, authLoading } = useAdminAccess();
  const location = useLocation();

  if (authLoading || checking) {
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

  if (!isAdmin) {
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
