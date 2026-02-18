import React, { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "@/api/firebase";
import { useOrders } from "@/hooks/useOrders";
import { usePurchaseCosts } from "@/hooks/usePurchaseCosts";
import { useFinance } from "@/hooks/useFinance";
import { computeFinanceMetrics } from "@/utils/financeMetrics";

const periodOptions = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Anio" },
  { value: "custom", label: "Rango" },
];

const pieColors = ["#22d3ee", "#60a5fa", "#34d399", "#f59e0b", "#f87171", "#c084fc"];

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatStatus(status) {
  const map = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    despachado: "Despachado",
    cancelado: "Cancelado",
    sin_estado: "Sin estado",
  };
  return map[status] || status;
}

export default function FinanceAdmin() {
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { costs, loading: costsLoading, error: costsError } = usePurchaseCosts();
  const { entries, loading: financeLoading, error: financeError } = useFinance();

  const [form, setForm] = useState({ tipo: "ingreso", monto: "", detalle: "" });
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cleaning, setCleaning] = useState(false);

  const loading = ordersLoading || costsLoading || financeLoading;
  const dataError = ordersError || costsError || financeError;

  const metrics = useMemo(
    () =>
      computeFinanceMetrics({
        orders,
        entries,
        costs,
        period,
        customStartInput: customStart,
        customEndInput: customEnd,
      }),
    [orders, entries, costs, period, customStart, customEnd]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!form.monto || Number.isNaN(Number(form.monto))) {
      setError("Monto invalido.");
      return;
    }
    try {
      await addDoc(collection(db, "finance"), {
        tipo: form.tipo,
        monto: Number(form.monto),
        detalle: form.detalle || "",
        categoria: "manual",
        createdAt: serverTimestamp(),
      });
      setMessage("Movimiento registrado.");
      setForm({ tipo: "ingreso", monto: "", detalle: "" });
    } catch (err) {
      setError(err.message || "No se pudo registrar el movimiento.");
    }
  };

  const deleteCollection = async (collectionName) => {
    const snapshot = await getDocs(collection(db, collectionName));
    const docs = snapshot.docs;
    let deleted = 0;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);
      docs.slice(i, i + 500).forEach((docSnap) => {
        batch.delete(docSnap.ref);
        deleted += 1;
      });
      await batch.commit();
    }
    return deleted;
  };

  const handleCleanFinance = async () => {
    setError("");
    setMessage("");
    const confirm = window.prompt('Escribi "LIMPIAR" para borrar TODA la finanza.');
    if (confirm !== "LIMPIAR") return;
    setCleaning(true);
    try {
      const deleted = await deleteCollection("finance");
      setMessage(`Finanzas limpias. Documentos eliminados: ${deleted}.`);
    } catch (err) {
      setError(err.message || "No se pudo limpiar finanzas.");
    } finally {
      setCleaning(false);
    }
  };

  const handleResetDemo = async () => {
    setError("");
    setMessage("");
    const confirm = window.prompt(
      'Esto borra pedidos, finanzas, remitos, counters y movimientos. Escribi "RESET" para continuar.'
    );
    if (confirm !== "RESET") return;
    setCleaning(true);
    try {
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      for (const orderDoc of ordersSnapshot.docs) {
        const order = orderDoc.data();
        if (!order.stockApplied) continue;
        await runTransaction(db, async (tx) => {
          for (const item of order.items || []) {
            const productRef = doc(db, "products", item.productId);
            const productSnap = await tx.get(productRef);
            if (!productSnap.exists()) continue;
            const data = productSnap.data();
            const current = data.stockActual ?? 0;
            tx.update(productRef, {
              stockActual: current + Number(item.cantidad || 0),
              updatedAt: serverTimestamp(),
            });
          }
        });
      }

      const deletedFinance = await deleteCollection("finance");
      const deletedStock = await deleteCollection("stock_movements");
      const deletedAdjustments = await deleteCollection("order_adjustments");
      const deletedRemitos = await deleteCollection("remitos");
      const deletedOrders = await deleteCollection("orders");
      const deletedCounters = await deleteCollection("counters");

      setMessage(
        `Reset completo. Orders: ${deletedOrders}, Finanzas: ${deletedFinance}, Stock: ${deletedStock}, Ajustes: ${deletedAdjustments}, Remitos: ${deletedRemitos}, Counters: ${deletedCounters}.`
      );
    } catch (err) {
      setError(err.message || "No se pudo resetear el entorno.");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Finanzas avanzadas</p>
            <h2 className="text-2xl font-semibold mt-2">Caja, ventas, costos y margen</h2>
            <p className="text-sm text-white/60 mt-2">Periodo: {metrics.rangeLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] ${
                  period === opt.value ? "bg-cyan-500 text-[#0B1020]" : "bg-white/10 text-white/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {period === "custom" && (
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Desde</span>
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Hasta</span>
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Ingresos (caja)</p>
            <p className="text-xl font-semibold mt-2">{formatCurrency(metrics.totals.ingresos)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Egresos (caja)</p>
            <p className="text-xl font-semibold mt-2">{formatCurrency(metrics.totals.egresos)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Neto de caja</p>
            <p className="text-xl font-semibold mt-2">{formatCurrency(metrics.totals.netoCaja)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Ventas brutas</p>
            <p className="text-xl font-semibold mt-2">{formatCurrency(metrics.totals.ventasBrutas)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Costo de ventas</p>
            <p className="text-xl font-semibold mt-2">{formatCurrency(metrics.totals.costoVentas)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Ganancia bruta</p>
            <p className="text-xl font-semibold mt-2">{formatCurrency(metrics.totals.gananciaBruta)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Margen bruto</p>
            <p className="text-xl font-semibold mt-2">{formatPercent(metrics.totals.margenBrutoPct)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Ticket promedio</p>
            <p className="text-xl font-semibold mt-2">{formatCurrency(metrics.totals.ticketPromedio)}</p>
          </div>
        </div>

        {!metrics.validRange ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            El rango personalizado es invalido. Verifica las fechas.
          </div>
        ) : loading ? (
          <div className="py-10 text-sm text-white/50">Cargando metricas...</div>
        ) : (
          <div className="grid xl:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Tendencia comercial</p>
              <h3 className="text-lg font-semibold mt-2">Ventas, costos y ganancia</h3>
              <div className="h-80 mt-4">
                {metrics.trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-white/50">
                    No hay datos para este periodo.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={metrics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip
                        contentStyle={{
                          background: "#0B1020",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                      <Bar dataKey="ventas" name="Ventas" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                      <Bar
                        dataKey="costoVentas"
                        name="Costo"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        type="monotone"
                        dataKey="gananciaBruta"
                        name="Ganancia"
                        stroke="#34d399"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Flujo de caja</p>
              <h3 className="text-lg font-semibold mt-2">Ingresos vs egresos</h3>
              <div className="h-80 mt-4">
                {metrics.trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-white/50">
                    No hay datos para este periodo.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.trendData}>
                      <defs>
                        <linearGradient id="cashIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cashOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip
                        contentStyle={{
                          background: "#0B1020",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#22d3ee" fill="url(#cashIn)" />
                      <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#f87171" fill="url(#cashOut)" />
                      <Line
                        type="monotone"
                        dataKey="netoCaja"
                        name="Neto"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Canales de venta</p>
              <h3 className="text-lg font-semibold mt-2">Rendimiento por fuente</h3>
              <div className="h-72 mt-4">
                {metrics.sourceData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-white/50">
                    No hay ventas en el periodo.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.sourceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="source" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip
                        contentStyle={{
                          background: "#0B1020",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                      <Bar dataKey="ventas" name="Ventas" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                      <Bar
                        dataKey="gananciaBruta"
                        name="Ganancia"
                        fill="#34d399"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Estado de pedidos</p>
              <h3 className="text-lg font-semibold mt-2">Distribucion operacional</h3>
              <div className="h-72 mt-4">
                {metrics.statusData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-white/50">
                    No hay pedidos en el periodo.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.statusData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ status, percent }) =>
                          `${formatStatus(status)} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {metrics.statusData.map((entry, index) => (
                          <Cell key={`${entry.status}-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, formatStatus(name)]}
                        contentStyle={{
                          background: "#0B1020",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Pedidos totales</p>
            <p className="text-xl font-semibold mt-2">{metrics.totals.pedidosTotales}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Pedidos confirmados</p>
            <p className="text-xl font-semibold mt-2">{metrics.totals.pedidosConfirmados}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Pedidos cancelados</p>
            <p className="text-xl font-semibold mt-2">{metrics.totals.cancelados}</p>
          </div>
        </div>

        {dataError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {dataError}
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Top productos</p>
          <h2 className="text-2xl font-semibold mt-2">Ranking por ventas y margen</h2>
        </div>
        {metrics.topProducts.length === 0 ? (
          <div className="py-8 text-sm text-white/50">No hay productos para mostrar en este periodo.</div>
        ) : (
          <div className="space-y-3">
            {metrics.topProducts.map((product) => (
              <div
                key={product.productId}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold">{product.nombre}</p>
                  <p className="text-xs text-white/50">Unidades: {product.unidades}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-white/70">
                  <span>Ventas {formatCurrency(product.ventas)}</span>
                  <span>Costo {formatCurrency(product.costoVentas)}</span>
                  <span>Ganancia {formatCurrency(product.gananciaBruta)}</span>
                  <span>Margen {formatPercent(product.margenPct)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Movimiento manual</p>
          <h2 className="text-2xl font-semibold mt-2">Registrar ingreso/egreso</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Tipo</span>
            <select
              value={form.tipo}
              onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Monto</span>
            <input
              type="number"
              value={form.monto}
              onChange={(event) => setForm((prev) => ({ ...prev, monto: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              min="0"
              step="0.01"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Detalle</span>
            <input
              type="text"
              value={form.detalle}
              onChange={(event) => setForm((prev) => ({ ...prev, detalle: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-sm font-semibold tracking-[0.2em] uppercase"
        >
          Guardar movimiento
        </button>
      </form>

      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Modo pruebas</p>
          <h2 className="text-2xl font-semibold mt-2">Limpiar datos</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="button"
            onClick={handleCleanFinance}
            disabled={cleaning}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/70 hover:bg-white/10 transition disabled:opacity-60"
          >
            Limpiar finanzas
          </button>
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={cleaning}
            className="flex-1 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-red-200 hover:bg-red-500/20 transition disabled:opacity-60"
          >
            Reset pruebas completo
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
