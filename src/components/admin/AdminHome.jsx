import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { getDefaultAdminPath } from "@/constants/adminAccess";

export default function AdminHome() {
  const { checking, authLoading, isAdmin, isSuperAdmin, modules } = useAdminAccess();

  if (checking || authLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-white/70">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
          Cargando inicio
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isSuperAdmin) {
    return <AdminDashboard />;
  }

  const fallbackPath = getDefaultAdminPath({ isSuperAdmin, modules });
  return <Navigate to={fallbackPath} replace />;
}
