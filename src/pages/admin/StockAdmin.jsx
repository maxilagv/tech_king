import React, { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/api/firebase";
import { useProducts } from "@/hooks/useProducts";

export default function StockAdmin() {
  const { products } = useProducts();
  const [form, setForm] = useState({
    productId: "",
    tipo: "ingreso",
    cantidad: 1,
    motivo: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!form.productId) {
      setError("Selecciona un producto.");
      return;
    }
    if (!form.cantidad || Number(form.cantidad) <= 0) {
      setError("Cantidad invalida.");
      return;
    }

    try {
      await runTransaction(db, async (tx) => {
        const productRef = doc(db, "products", form.productId);
        const productSnap = await tx.get(productRef);
        if (!productSnap.exists()) {
          throw new Error("Producto no encontrado.");
        }
        const data = productSnap.data();
        const current = data.stockActual ?? 0;
        const delta = form.tipo === "ingreso" ? Number(form.cantidad) : -Number(form.cantidad);
        const next = current + delta;
        if (next < 0) {
          throw new Error("Stock insuficiente.");
        }
        tx.update(productRef, {
          stockActual: next,
          updatedAt: serverTimestamp(),
        });
        tx.set(doc(collection(db, "stock_movements")), {
          productId: form.productId,
          tipo: form.tipo,
          cantidad: Number(form.cantidad),
          motivo: form.motivo || "",
          createdAt: serverTimestamp(),
        });
      });
      setMessage("Stock actualizado.");
      setForm({ productId: "", tipo: "ingreso", cantidad: 1, motivo: "" });
    } catch (err) {
      setError(err.message || "No se pudo actualizar el stock.");
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Stock</p>
          <h2 className="text-2xl font-semibold mt-2">Movimiento de stock</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Producto</span>
            <select
              value={form.productId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, productId: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            >
              <option value="">Seleccionar...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nombre}
                </option>
              ))}
            </select>
          </label>
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
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Cantidad</span>
            <input
              type="number"
              min="1"
              value={form.cantidad}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cantidad: Number(event.target.value) }))
              }
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Motivo</span>
            <input
              type="text"
              value={form.motivo}
              onChange={(event) => setForm((prev) => ({ ...prev, motivo: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              placeholder="Ajuste, compra proveedor, etc."
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-sm font-semibold tracking-[0.2em] uppercase"
        >
          Registrar movimiento
        </button>
      </form>

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
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Stock actual</p>
          <h2 className="text-2xl font-semibold mt-2">Productos</h2>
        </div>
        <div className="mt-6 space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{product.nombre}</p>
                <p className="text-xs text-white/50">{product.marca || "Marca no definida"}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                  product.stockActual <= 5
                    ? "bg-red-500/15 text-red-200"
                    : "bg-emerald-500/15 text-emerald-200"
                }`}
              >
                {product.stockActual ?? 0} unidades
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
