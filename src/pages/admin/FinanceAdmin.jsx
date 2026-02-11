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
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "@/api/firebase";
import { useOrders } from "@/hooks/useOrders";
import { usePurchaseCosts } from "@/hooks/usePurchaseCosts";

const periodOptions = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "custom", label: "Rango" },
];

function getDateFromTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  if (ts instanceof Date) return ts;
  return null;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function getRange(period, customStart, customEnd) {
  const now = new Date();
  if (period === "today") {
    return { start: startOfDay(now), end: endOfDay(now) };
  }
  if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    return { start: startOfDay(start), end: endOfDay(now) };
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: startOfDay(start), end: endOfDay(now) };
  }
  if (period === "custom" && customStart && customEnd) {
    return { start: startOfDay(customStart), end: endOfDay(customEnd) };
  }
  return { start: null, end: null };
}

export default function FinanceAdmin() {
  const { orders } = useOrders();
  const { costs } = usePurchaseCosts();

  const [form, setForm] = useState({ tipo: "ingreso", monto: "", detalle: "" });
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cleaning, setCleaning] = useState(false);

  const costMap = useMemo(() => {
    const map = new Map();
    costs.forEach((cost) => {
      const productId = cost.productId;
      const date = getDateFromTimestamp(cost.fechaCompra || cost.createdAt) || new Date(0);
      const current = map.get(productId);
      if (!current || date > current.date) {
        map.set(productId, {
          date,
          costoUnitarioARS: Number(cost.costoUnitarioARS || 0),
        });
      }
    });
    return map;
  }, [costs]);

  const { chartData, totals } = useMemo(() => {
    const start = customStart ? new Date(customStart) : null;
    const end = customEnd ? new Date(customEnd) : null;
    const { start: rangeStart, end: rangeEnd } = getRange(period, start, end);
    const validStatuses = new Set(["confirmado", "despachado"]);

    const filteredOrders = orders.filter((order) => {
      const date = getDateFromTimestamp(order.createdAt);
      if (!date || !rangeStart || !rangeEnd) return false;
      if (!validStatuses.has(order.status)) return false;
      return date >= rangeStart && date <= rangeEnd;
    });

    const grouped = {};
    let bruto = 0;
    let costoTotal = 0;

    filteredOrders.forEach((order) => {
      const date = getDateFromTimestamp(order.createdAt);
      if (!date) return;
      const key = toDateKey(date);
      if (!grouped[key]) {
        grouped[key] = { date: key, bruto: 0, neto: 0 };
      }

      const orderCost = (order.items || []).reduce((sum, item) => {
        const costInfo = costMap.get(item.productId);
        const costoUnitarioARS = costInfo?.costoUnitarioARS || 0;
        return sum + costoUnitarioARS * Number(item.cantidad || 0);
      }, 0);

      grouped[key].bruto += Number(order.total || 0);
      grouped[key].neto += Number(order.total || 0) - orderCost;
      bruto += Number(order.total || 0);
      costoTotal += orderCost;
    });

    const data = Object.values(grouped).sort((a, b) => (a.date > b.date ? 1 : -1));
    const neto = bruto - costoTotal;

    return {
      chartData: data,
      totals: {
        bruto,
        neto,
        costoTotal,
        pedidos: filteredOrders.length,
      },
    };
  }, [orders, costMap, period, customStart, customEnd]);

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
      const deletedRemitos = await deleteCollection("remitos");
      const deletedOrders = await deleteCollection("orders");
      const deletedCounters = await deleteCollection("counters");

      setMessage(
        `Reset completo. Orders: ${deletedOrders}, Finanzas: ${deletedFinance}, Stock: ${deletedStock}, Remitos: ${deletedRemitos}, Counters: ${deletedCounters}.`
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
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Finanzas</p>
            <h2 className="text-2xl font-semibold mt-2">Bruto vs Neto</h2>
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

        <div className="grid md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Bruto</p>
            <p className="text-xl font-semibold mt-2">${totals.bruto.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Costo</p>
            <p className="text-xl font-semibold mt-2">${totals.costoTotal.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Neto</p>
            <p className="text-xl font-semibold mt-2">${totals.neto.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Pedidos</p>
            <p className="text-xl font-semibold mt-2">{totals.pedidos}</p>
          </div>
        </div>

        <div className="h-80">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-white/50">
              No hay datos para este periodo.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBruto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{ background: "#0B1020", border: "1px solid rgba(255,255,255,0.1)" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Area type="monotone" dataKey="bruto" stroke="#22d3ee" fill="url(#colorBruto)" />
                <Area type="monotone" dataKey="neto" stroke="#60a5fa" fill="url(#colorNeto)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Movimiento</p>
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
