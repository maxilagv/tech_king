import React, { useMemo } from "react";
import {
  BadgeDollarSign,
  FileText,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";

function getDateFromTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  return null;
}

function isToday(ts) {
  const date = getDateFromTimestamp(ts);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function AdminDashboard() {
  const { orders, loading: ordersLoading } = useOrders();
  const { customers, loading: customersLoading } = useCustomers();
  const { products, loading: productsLoading } = useProducts();

  const stats = useMemo(() => {
    const ventasHoy = orders
      .filter((order) => isToday(order.createdAt))
      .filter((order) => order.status === "confirmado" || order.status === "despachado")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const pedidos = orders.length;
    const clientesHoy = customers.filter((customer) => isToday(customer.createdAt)).length;
    const stockCritico = products.filter((product) => (product.stockActual ?? 0) <= 5).length;
    return { ventasHoy, pedidos, clientesHoy, stockCritico };
  }, [orders, customers, products]);

  const resumen = useMemo(() => {
    const pendientes = orders.filter((order) => order.status === "pendiente").length;
    const stockBajo = products.filter((product) => (product.stockActual ?? 0) <= 5).length;
    const remitosPendientes = orders.filter(
      (order) =>
        (order.status === "confirmado" || order.status === "despachado") && !order.remitoNumero
    ).length;
    const pagosPendientes = orders
      .filter((order) => order.status === "pendiente")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { pendientes, stockBajo, remitosPendientes, pagosPendientes };
  }, [orders, products]);

  const recentOrders = useMemo(() => orders.slice(0, 4), [orders]);

  const loading = ordersLoading || customersLoading || productsLoading;

  return (
    <div className="space-y-10">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white/10 border border-white/10 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ventas hoy</p>
              <h3 className="text-2xl font-semibold mt-2">
                ${stats.ventasHoy.toFixed(2)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 border border-white/10 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pedidos</p>
              <h3 className="text-2xl font-semibold mt-2">{stats.pedidos}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 border border-white/10 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Clientes hoy</p>
              <h3 className="text-2xl font-semibold mt-2">{stats.clientesHoy}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 border border-white/10 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Stock critico</p>
              <h3 className="text-2xl font-semibold mt-2">{stats.stockCritico}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Accesos directos</p>
          <h2 className="text-2xl font-semibold mt-2">Gestion rapida</h2>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mt-3">Nuevo producto</h3>
              <p className="text-xs text-white/50 mt-1">Alta rapida con imagen</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mt-3">Emitir remito</h3>
              <p className="text-xs text-white/50 mt-1">PDF listo para imprimir</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-200">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mt-3">Nuevo pedido</h3>
              <p className="text-xs text-white/50 mt-1">Venta manual en local</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Resumen</p>
          <h2 className="text-2xl font-semibold mt-2">Operacion del dia</h2>
          <div className="mt-6 space-y-4 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Pedidos pendientes</span>
              <span className="text-white">{resumen.pendientes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Stock bajo</span>
              <span className="text-white">{resumen.stockBajo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Remitos por emitir</span>
              <span className="text-white">{resumen.remitosPendientes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pagos pendientes</span>
              <span className="text-white">${resumen.pagosPendientes.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pedidos recientes</p>
            <h2 className="text-2xl font-semibold mt-2">Ultimas ventas</h2>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando datos...</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-sm text-white/50">No hay pedidos registrados.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-white/50">
                    {order.customerSnapshot
                      ? `${order.customerSnapshot.nombre || ""} ${order.customerSnapshot.apellido || ""}`.trim()
                      : order.customerId}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-white/70">
                    ${Number(order.total || 0).toFixed(2)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] bg-cyan-500/15 text-cyan-200">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
