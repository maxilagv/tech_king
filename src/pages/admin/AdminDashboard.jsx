import React from "react";
import {
  ArrowUpRight,
  BadgeDollarSign,
  FileText,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";

const stats = [
  { label: "Ventas hoy", value: "$ 1.245.000", change: "+12%", icon: BadgeDollarSign },
  { label: "Pedidos", value: "48", change: "+8%", icon: ShoppingCart },
  { label: "Clientes nuevos", value: "12", change: "+4%", icon: Users },
  { label: "Stock critico", value: "7", change: "-3%", icon: Warehouse },
];

const quickActions = [
  { label: "Nuevo producto", description: "Alta rapida con imagen", icon: Package },
  { label: "Nueva categoria", description: "Nombre e imagen obligatoria", icon: ArrowUpRight },
  { label: "Emitir remito", description: "PDF listo para imprimir", icon: FileText },
];

const recentOrders = [
  { id: "TK-1042", customer: "Lucia Benitez", total: "$ 245.300", status: "Confirmado" },
  { id: "TK-1041", customer: "Diego Pereira", total: "$ 89.999", status: "En preparacion" },
  { id: "TK-1040", customer: "Tomas Rios", total: "$ 540.000", status: "Despachado" },
  { id: "TK-1039", customer: "Valeria Soto", total: "$ 129.500", status: "Confirmado" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-10">
      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-3xl bg-white/10 border border-white/10 px-6 py-5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{stat.label}</p>
                  <h3 className="text-2xl font-semibold mt-2">{stat.value}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-emerald-300 mt-4 tracking-[0.2em] uppercase">{stat.change}</p>
            </div>
          );
        })}
      </section>

      {/* Quick actions */}
      <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Accesos directos</p>
          <h2 className="text-2xl font-semibold mt-2">Gestion rapida</h2>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold mt-3">{action.label}</h3>
                  <p className="text-xs text-white/50 mt-1">{action.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Resumen</p>
          <h2 className="text-2xl font-semibold mt-2">Operacion del dia</h2>
          <div className="mt-6 space-y-4 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Pedidos pendientes</span>
              <span className="text-white">6</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Stock bajo</span>
              <span className="text-white">7</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Remitos a emitir</span>
              <span className="text-white">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pagos pendientes</span>
              <span className="text-white">$ 420.000</span>
            </div>
          </div>
        </div>
      </section>

      {/* Orders */}
      <section className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pedidos recientes</p>
            <h2 className="text-2xl font-semibold mt-2">Ultimas ventas</h2>
          </div>
          <button className="text-xs uppercase tracking-[0.3em] text-cyan-300 hover:text-white transition">
            Ver todo
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{order.id}</p>
                <p className="text-xs text-white/50">{order.customer}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white/70">{order.total}</span>
                <span className="px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] bg-cyan-500/15 text-cyan-200">
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
