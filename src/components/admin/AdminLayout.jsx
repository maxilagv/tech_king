import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  Building2,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  ShoppingCart,
  Sparkles,
  Tags,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/api/firebase";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_MODULES } from "@/constants/adminAccess";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const MODULE_ICON_BY_ID = {
  products: Package,
  categories: Tags,
  offers: Sparkles,
  customers: Users,
  orders: ShoppingCart,
  remitos: FileText,
  suppliers: Building2,
  costs: BadgeDollarSign,
  stock: Warehouse,
  finance: BadgeDollarSign,
  users: UserCog,
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checking, authLoading, isSuperAdmin, modules } = useAdminAccess();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin/login");
  };

  const moduleIds = new Set(modules || []);
  const navItems = [
    ...(isSuperAdmin ? [{ label: "Dashboard", to: "/admin", icon: LayoutDashboard }] : []),
    ...ADMIN_MODULES.filter((module) => isSuperAdmin || moduleIds.has(module.id)).map((module) => ({
      label: module.label,
      to: module.path,
      icon: MODULE_ICON_BY_ID[module.id] || LayoutDashboard,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#0B1020] text-white">
      <style>{`
        select { color: #ffffff; }
        option { color: #0B1020; background-color: #ffffff; }
      `}</style>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute bottom-[-160px] right-[-120px] w-[520px] h-[520px] rounded-full bg-blue-500/20 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)]" />
      </div>

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 min-h-screen px-6 py-8 border-r border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-semibold">
              TK
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Admin</p>
              <p className="text-lg font-semibold">Tech King</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {checking || authLoading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/50">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                Cargando accesos
              </div>
            ) : (
              navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all ${
                        isActive
                          ? "bg-white/15 text-white shadow-lg shadow-cyan-500/20"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`
                    }
                    end={item.to === "/admin"}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })
            )}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-8 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesion
          </button>
        </aside>

        {/* Main */}
        <div className="flex-1 min-h-screen">
          <header className="flex items-center justify-between px-6 lg:px-10 py-6 border-b border-white/10 bg-white/5 backdrop-blur-xl">
            <div>
              <p className="text-xs tracking-[0.35em] uppercase text-white/50">
                Panel administrativo
              </p>
              <h1 className="text-2xl lg:text-3xl font-semibold">Operacion diaria</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-white/80">
                  {isSuperAdmin ? "Super Admin" : "Empleado"}
                </p>
                <p className="text-xs text-white/40">{user?.email || "admin@techking"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
                {user?.email?.slice(0, 2).toUpperCase() || "AD"}
              </div>
            </div>
          </header>

          <main className="px-6 lg:px-10 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
