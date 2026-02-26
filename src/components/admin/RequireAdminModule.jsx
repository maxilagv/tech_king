import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { getDefaultAdminPath } from "@/constants/adminAccess";

export default function RequireAdminModule({ moduleId, children }) {
  const location = useLocation();
  const { checking, authLoading, isAdmin, canAccessModule, modules, isSuperAdmin } =
    useAdminAccess();

  if (checking || authLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-white/70">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
          Verificando permisos
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!canAccessModule(moduleId)) {
    const fallbackPath = getDefaultAdminPath({ isSuperAdmin, modules });
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
