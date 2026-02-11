import React, { useMemo, useState } from "react";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/api/firebase";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseCosts } from "@/hooks/usePurchaseCosts";
import { useFxRates } from "@/hooks/useFxRates";
import FxRatesPanel from "@/components/admin/FxRatesPanel";

const emptyForm = {
  productId: "",
  supplierId: "",
  moneda: "ARS",
  costoUnitario: "",
  usdRate: "",
  cantidad: 1,
  nroFactura: "",
  notas: "",
  fechaCompra: "",
  sumarStock: true,
  registrarEgreso: true,
};

export default function PurchaseCostsAdmin() {
  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { costs } = usePurchaseCosts();
  const { rates } = useFxRates();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = products.find((p) => p.id === form.productId);
  const selectedSupplier = suppliers.find((s) => s.id === form.supplierId);

  const autoUsdRate = useMemo(() => {
    if (!rates) return "";
    return rates.usdBlue || rates.usdOficial || "";
  }, [rates]);

  const usdRate = form.moneda === "USD" ? Number(form.usdRate || autoUsdRate || 0) : 1;
  const costoUnitario = Number(form.costoUnitario || 0);
  const costoUnitarioARS = form.moneda === "USD" ? costoUnitario * usdRate : costoUnitario;
  const costoTotalARS = costoUnitarioARS * Number(form.cantidad || 0);

  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product.nombre])),
    [products]
  );
  const supplierMap = useMemo(
    () => Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.nombre])),
    [suppliers]
  );

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.productId) {
      setError("Selecciona un producto.");
      return;
    }
    if (!form.supplierId) {
      setError("Selecciona un proveedor.");
      return;
    }
    if (!form.costoUnitario || Number.isNaN(Number(form.costoUnitario))) {
      setError("Costo unitario invalido.");
      return;
    }
    if (form.moneda === "USD" && (!usdRate || usdRate <= 0)) {
      setError("La cotizacion USD es invalida.");
      return;
    }

    setSaving(true);
    try {
      await runTransaction(db, async (tx) => {
        const costRef = doc(collection(db, "purchase_costs"));
        const productRef = doc(db, "products", form.productId);
        const productSnap = await tx.get(productRef);
        if (!productSnap.exists()) {
          throw new Error("Producto no encontrado.");
        }
        const productData = productSnap.data();
        const currentStock = productData.stockActual ?? 0;
        const quantity = Number(form.cantidad || 0);

        tx.set(costRef, {
          productId: form.productId,
          supplierId: form.supplierId,
          supplierSnapshot: {
            nombre: selectedSupplier?.nombre || "",
            contacto: selectedSupplier?.contacto || "",
          },
          moneda: form.moneda,
          costoUnitario: costoUnitario,
          usdRate: form.moneda === "USD" ? usdRate : 1,
          costoUnitarioARS: Number(costoUnitarioARS.toFixed(2)),
          cantidad: quantity,
          costoTotalARS: Number(costoTotalARS.toFixed(2)),
          nroFactura: form.nroFactura.trim(),
          notas: form.notas.trim(),
          fechaCompra: form.fechaCompra ? new Date(form.fechaCompra) : serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        if (form.sumarStock) {
          tx.update(productRef, {
            stockActual: currentStock + quantity,
            costoActual: Number(costoUnitarioARS.toFixed(2)),
            updatedAt: serverTimestamp(),
          });

          tx.set(doc(collection(db, "stock_movements")), {
            productId: form.productId,
            tipo: "ingreso",
            cantidad: quantity,
            motivo: "compra",
            createdAt: serverTimestamp(),
          });
        } else {
          tx.update(productRef, {
            costoActual: Number(costoUnitarioARS.toFixed(2)),
            updatedAt: serverTimestamp(),
          });
        }

        if (form.registrarEgreso) {
          tx.set(doc(collection(db, "finance")), {
            tipo: "egreso",
            monto: Number(costoTotalARS.toFixed(2)),
            referencia: costRef.id,
            detalle: `Compra ${selectedProduct?.nombre || "producto"}`,
            createdAt: serverTimestamp(),
          });
        }
      });

      setMessage("Costo registrado correctamente.");
      setForm({
        ...emptyForm,
        usdRate: "",
      });
    } catch (err) {
      setError(err.message || "No se pudo registrar el costo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Compras</p>
            <h2 className="text-2xl font-semibold mt-2">Registrar costo de producto</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Producto</span>
              <select
                value={form.productId}
                onChange={(event) => handleChange("productId", event.target.value)}
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
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Proveedor</span>
              <select
                value={form.supplierId}
                onChange={(event) => handleChange("supplierId", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              >
                <option value="">Seleccionar...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Moneda</span>
              <select
                value={form.moneda}
                onChange={(event) => handleChange("moneda", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                Costo unitario
              </span>
              <input
                type="number"
                value={form.costoUnitario}
                onChange={(event) => handleChange("costoUnitario", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                min="0"
                step="0.01"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                Cantidad
              </span>
              <input
                type="number"
                value={form.cantidad}
                onChange={(event) => handleChange("cantidad", Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                min="1"
              />
            </label>
          </div>

          {form.moneda === "USD" && (
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                Cotizacion USD
              </span>
              <input
                type="number"
                value={form.usdRate || autoUsdRate}
                onChange={(event) => handleChange("usdRate", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                min="0"
              />
            </label>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                Fecha compra
              </span>
              <input
                type="date"
                value={form.fechaCompra}
                onChange={(event) => handleChange("fechaCompra", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                Nro factura
              </span>
              <input
                type="text"
                value={form.nroFactura}
                onChange={(event) => handleChange("nroFactura", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Notas</span>
            <textarea
              value={form.notas}
              onChange={(event) => handleChange("notas", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none min-h-[90px]"
            />
          </label>

          <div className="grid md:grid-cols-2 gap-4 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Costo unitario ARS: ${costoUnitarioARS.toFixed(2)}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Total ARS: ${costoTotalARS.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.sumarStock}
                onChange={(event) => handleChange("sumarStock", event.target.checked)}
                className="w-4 h-4 accent-cyan-400"
              />
              <span className="text-sm text-white/70">Sumar stock</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.registrarEgreso}
                onChange={(event) => handleChange("registrarEgreso", event.target.checked)}
                className="w-4 h-4 accent-cyan-400"
              />
              <span className="text-sm text-white/70">Registrar egreso</span>
            </label>
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

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-sm font-semibold tracking-[0.2em] uppercase disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Registrar costo"}
          </button>
        </form>

        <FxRatesPanel />
      </div>

      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Historial</p>
          <h2 className="text-2xl font-semibold mt-2">Ultimos costos registrados</h2>
        </div>

        {costs.length === 0 ? (
          <div className="py-12 text-sm text-white/50">No hay costos registrados.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {costs.slice(0, 8).map((cost) => (
              <div
                key={cost.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {productMap[cost.productId] || cost.productId}
                  </p>
                  <p className="text-xs text-white/50">
                    {cost.supplierSnapshot?.nombre || supplierMap[cost.supplierId] || cost.supplierId}
                  </p>
                </div>
                <div className="text-sm text-white/70">
                  ${Number(cost.costoUnitarioARS || 0).toFixed(2)} ARS - Qty {cost.cantidad}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
