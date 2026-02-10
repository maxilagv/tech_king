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
import { db } from "@/api/firebase";
import { useFinance } from "@/hooks/useFinance";
import { useOrders } from "@/hooks/useOrders";

export default function FinanceAdmin() {
  const { entries, loading } = useFinance();
  const { orders } = useOrders();
  const [form, setForm] = useState({ tipo: "ingreso", monto: "", detalle: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cleaning, setCleaning] = useState(false);

  const totals = useMemo(() => {
    const confirmed = orders.filter((order) => order.status === "confirmado");
    const totalVentas = confirmed.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const ingresos = entries
      .filter((entry) => entry.tipo === "ingreso")
      .reduce((sum, entry) => sum + Number(entry.monto || 0), 0);
    const egresos = entries
      .filter((entry) => entry.tipo === "egreso")
      .reduce((sum, entry) => sum + Number(entry.monto || 0), 0);
    return { totalVentas, ingresos, egresos };
  }, [orders, entries]);

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
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white/10 border border-white/10 p-5 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ventas confirmadas</p>
          <h3 className="text-2xl font-semibold mt-2">${totals.totalVentas.toFixed(2)}</h3>
        </div>
        <div className="rounded-3xl bg-white/10 border border-white/10 p-5 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ingresos manuales</p>
          <h3 className="text-2xl font-semibold mt-2">${totals.ingresos.toFixed(2)}</h3>
        </div>
        <div className="rounded-3xl bg-white/10 border border-white/10 p-5 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Egresos</p>
          <h3 className="text-2xl font-semibold mt-2">${totals.egresos.toFixed(2)}</h3>
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
          <p className="text-sm text-white/50 mt-2">
            Usa estas opciones para borrar datos generados en pruebas.
          </p>
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

      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Historial</p>
          <h2 className="text-2xl font-semibold mt-2">Movimientos</h2>
        </div>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando movimientos...</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-sm text-white/50">No hay movimientos.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{entry.detalle || "Movimiento"}</p>
                  <p className="text-xs text-white/50">{entry.referencia || "Sin referencia"}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                    entry.tipo === "ingreso"
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-red-500/15 text-red-200"
                  }`}
                >
                  ${Number(entry.monto || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
