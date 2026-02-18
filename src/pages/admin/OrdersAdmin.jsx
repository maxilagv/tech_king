import React, { useMemo, useState } from "react";
import { collection, doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/api/firebase";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";

const statusOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "despachado", label: "Despachado" },
  { value: "cancelado", label: "Cancelado" },
];

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function toPositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  const qty = Math.floor(parsed);
  return qty > 0 ? qty : 0;
}

function normalizeDraftItems(items) {
  const map = new Map();
  for (const item of items || []) {
    const productId = String(item.productId || "").trim();
    const cantidad = toPositiveInt(item.cantidad);
    if (!productId || cantidad <= 0) continue;
    map.set(productId, (map.get(productId) || 0) + cantidad);
  }
  return Array.from(map.entries()).map(([productId, cantidad]) => ({ productId, cantidad }));
}

function normalizeOrderItems(items) {
  const map = new Map();
  for (const item of items || []) {
    const productId = String(item.productId || "").trim();
    const cantidad = toPositiveInt(item.cantidad);
    if (!productId || cantidad <= 0) continue;

    const current = map.get(productId);
    if (current) {
      current.cantidad += cantidad;
      continue;
    }

    map.set(productId, {
      productId,
      nombre: item.nombre || "",
      precio: Number(item.precio || 0),
      cantidad,
      costoUnitarioARS:
        item.costoUnitarioARS === undefined || item.costoUnitarioARS === null
          ? null
          : Number(item.costoUnitarioARS),
    });
  }
  return Array.from(map.values());
}

function calculateOrderTotals(items) {
  const revenue = roundMoney(
    (items || []).reduce(
      (sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0),
      0
    )
  );
  const cost = roundMoney(
    (items || []).reduce(
      (sum, item) => sum + Number(item.costoUnitarioARS || 0) * Number(item.cantidad || 0),
      0
    )
  );
  const grossProfit = roundMoney(revenue - cost);
  const marginPct = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(2)) : 0;
  return { revenue, cost, grossProfit, marginPct };
}

export default function OrdersAdmin() {
  const { orders, loading } = useOrders();
  const { customers } = useCustomers();
  const { products } = useProducts();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const customerMap = useMemo(
    () =>
      Object.fromEntries(
        customers.map((customer) => [
          customer.id,
          `${customer.nombre || ""} ${customer.apellido || ""}`.trim() || customer.email,
        ])
      ),
    [customers]
  );

  const productMap = useMemo(
    () =>
      Object.fromEntries(
        products.map((product) => [
          product.id,
          {
            nombre: product.nombre,
            precio: product.precio,
            stockActual: product.stockActual ?? 0,
          },
        ])
      ),
    [products]
  );

  const [manualOrder, setManualOrder] = useState({
    customerId: "",
    items: [{ productId: "", cantidad: 1 }],
  });
  const [adjustDraft, setAdjustDraft] = useState({
    orderId: "",
    items: [{ productId: "", cantidad: 1 }],
  });
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  const addItemRow = () => {
    setManualOrder((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", cantidad: 1 }],
    }));
  };

  const updateItemRow = (index, key, value) => {
    setManualOrder((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const removeItemRow = (index) => {
    setManualOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const openAdjustDraft = (orderId) => {
    setAdjustDraft({ orderId, items: [{ productId: "", cantidad: 1 }] });
  };

  const closeAdjustDraft = () => {
    setAdjustDraft({ orderId: "", items: [{ productId: "", cantidad: 1 }] });
  };

  const addAdjustItemRow = () => {
    setAdjustDraft((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", cantidad: 1 }],
    }));
  };

  const updateAdjustItemRow = (index, key, value) => {
    setAdjustDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const removeAdjustItemRow = (index) => {
    setAdjustDraft((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const manualTotal = manualOrder.items.reduce((sum, item) => {
    const product = productMap[item.productId];
    if (!product) return sum;
    return sum + Number(product.precio || 0) * Number(item.cantidad || 0);
  }, 0);

  const createManualOrder = async () => {
    setError("");
    setMessage("");
    if (!manualOrder.customerId) {
      setError("Selecciona un cliente.");
      return;
    }
    const validItems = normalizeDraftItems(manualOrder.items);
    if (validItems.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }

    try {
      const selectedCustomer = customers.find((cust) => cust.id === manualOrder.customerId);
      const customerSnapshot = selectedCustomer
        ? {
            nombre: selectedCustomer.nombre || "",
            apellido: selectedCustomer.apellido || "",
            dni: selectedCustomer.dni || "",
            direccion: selectedCustomer.direccion || "",
            telefono: selectedCustomer.telefono || "",
            email: selectedCustomer.email || "",
          }
        : null;

      await runTransaction(db, async (tx) => {
        const orderRef = doc(collection(db, "orders"));
        const orderItems = [];

        for (const row of validItems) {
          const productRef = doc(db, "products", row.productId);
          const productSnap = await tx.get(productRef);
          if (!productSnap.exists()) {
            throw new Error("Producto no encontrado.");
          }
          const data = productSnap.data();
          const currentStock = Number(data.stockActual ?? 0);
          const quantity = Number(row.cantidad || 0);
          if (currentStock < quantity) {
            throw new Error(`Stock insuficiente para ${data.nombre || "producto"}`);
          }

          const unitPrice = Number(data.precio || 0);
          const unitCost = Number(data.costoActual || 0);
          const item = {
            productId: row.productId,
            nombre: data.nombre || "Producto",
            precio: unitPrice,
            cantidad: quantity,
            costoUnitarioARS: unitCost,
          };
          orderItems.push(item);

          tx.update(productRef, {
            stockActual: currentStock - item.cantidad,
            updatedAt: serverTimestamp(),
          });

          tx.set(doc(collection(db, "stock_movements")), {
            productId: item.productId,
            tipo: "egreso",
            cantidad: item.cantidad,
            motivo: "venta_local",
            orderId: orderRef.id,
            createdAt: serverTimestamp(),
          });
        }

        const totals = calculateOrderTotals(orderItems);

        tx.set(doc(collection(db, "finance")), {
          tipo: "ingreso",
          monto: totals.revenue,
          referencia: orderRef.id,
          orderId: orderRef.id,
          categoria: "venta",
          source: "local",
          detalle: "Venta local",
          createdAt: serverTimestamp(),
        });

        tx.set(orderRef, {
          customerId: manualOrder.customerId,
          items: orderItems,
          total: totals.revenue,
          status: "confirmado",
          source: "local",
          stockApplied: true,
          financeApplied: true,
          financialSummary: {
            revenue: totals.revenue,
            cost: totals.cost,
            grossProfit: totals.grossProfit,
            marginPct: totals.marginPct,
          },
          customerSnapshot,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      setMessage("Pedido manual creado y stock actualizado.");
      setManualOrder({ customerId: "", items: [{ productId: "", cantidad: 1 }] });
    } catch (err) {
      setError(err.message || "No se pudo crear el pedido.");
    }
  };

  const applyOrderEffects = async (order, nextStatus = "confirmado") => {
    await runTransaction(db, async (tx) => {
      const orderRef = doc(db, "orders", order.id);
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error("Pedido no encontrado.");
      }
      const current = orderSnap.data();
      if (current.stockApplied && current.financeApplied) {
        return;
      }
      const items = normalizeOrderItems(current.items);
      if (items.length === 0) {
        throw new Error("El pedido no tiene items validos.");
      }

      const enrichedItems = [];
      for (const item of items) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await tx.get(productRef);
        if (!productSnap.exists()) {
          throw new Error("Producto no encontrado en pedido.");
        }
        const data = productSnap.data();
        const currentStock = Number(data.stockActual ?? 0);
        const nextStock = currentStock - item.cantidad;
        if (nextStock < 0) {
          throw new Error(`Stock insuficiente para ${data.nombre}`);
        }
        const unitPrice = Number(item.precio || data.precio || 0);
        const unitCost =
          item.costoUnitarioARS === null || item.costoUnitarioARS === undefined
            ? Number(data.costoActual || 0)
            : Number(item.costoUnitarioARS || 0);

        tx.update(productRef, {
          stockActual: nextStock,
          updatedAt: serverTimestamp(),
        });

        tx.set(doc(collection(db, "stock_movements")), {
          productId: item.productId,
          tipo: "egreso",
          cantidad: item.cantidad,
          motivo: "venta_web",
          orderId: order.id,
          createdAt: serverTimestamp(),
        });

        enrichedItems.push({
          productId: item.productId,
          nombre: item.nombre || data.nombre || "Producto",
          precio: unitPrice,
          cantidad: item.cantidad,
          costoUnitarioARS: unitCost,
        });
      }

      const totals = calculateOrderTotals(enrichedItems);

      tx.set(doc(collection(db, "finance")), {
        tipo: "ingreso",
        monto: totals.revenue,
        referencia: order.id,
        orderId: order.id,
        categoria: "venta",
        source: current.source || "web",
        detalle: "Venta web",
        createdAt: serverTimestamp(),
      });

      tx.update(orderRef, {
        items: enrichedItems,
        total: totals.revenue,
        status: nextStatus,
        stockApplied: true,
        financeApplied: true,
        financialSummary: {
          revenue: totals.revenue,
          cost: totals.cost,
          grossProfit: totals.grossProfit,
          marginPct: totals.marginPct,
        },
        updatedAt: serverTimestamp(),
      });
    });
  };

  const applyOrderAdjustment = async (orderId) => {
    setError("");
    setMessage("");
    const validItems = normalizeDraftItems(adjustDraft.items);
    if (validItems.length === 0) {
      setError("Agrega al menos un producto para el ajuste.");
      return;
    }

    setSavingAdjustment(true);
    try {
      await runTransaction(db, async (tx) => {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) {
          throw new Error("Pedido no encontrado.");
        }
        const current = orderSnap.data();
        if (current.status === "cancelado") {
          throw new Error("No se puede ajustar un pedido cancelado.");
        }

        const itemsMap = new Map(
          normalizeOrderItems(current.items).map((item) => [item.productId, { ...item }])
        );
        const adjustmentItems = [];

        for (const row of validItems) {
          const productRef = doc(db, "products", row.productId);
          const productSnap = await tx.get(productRef);
          if (!productSnap.exists()) {
            throw new Error("Producto no encontrado.");
          }
          const data = productSnap.data();
          const currentStock = Number(data.stockActual ?? 0);
          const existing = itemsMap.get(row.productId);
          const quantityToAdd = Number(row.cantidad || 0);

          if (current.stockApplied) {
            if (currentStock < quantityToAdd) {
              throw new Error(`Stock insuficiente para ${data.nombre || "producto"}`);
            }
            tx.update(productRef, {
              stockActual: currentStock - quantityToAdd,
              updatedAt: serverTimestamp(),
            });
            tx.set(doc(collection(db, "stock_movements")), {
              productId: row.productId,
              tipo: "egreso",
              cantidad: quantityToAdd,
              motivo: "ajuste_pedido",
              orderId,
              createdAt: serverTimestamp(),
            });
          }

          const nextLine = {
            productId: row.productId,
            nombre: existing?.nombre || data.nombre || "Producto",
            precio: Number(existing?.precio || data.precio || 0),
            cantidad: Number(existing?.cantidad || 0) + quantityToAdd,
            costoUnitarioARS:
              existing?.costoUnitarioARS === null || existing?.costoUnitarioARS === undefined
                ? Number(data.costoActual || 0)
                : Number(existing.costoUnitarioARS || 0),
          };
          itemsMap.set(row.productId, nextLine);

          adjustmentItems.push({
            productId: row.productId,
            nombre: nextLine.nombre,
            cantidad: quantityToAdd,
            precio: nextLine.precio,
            costoUnitarioARS: nextLine.costoUnitarioARS,
          });
        }

        const mergedItems = Array.from(itemsMap.values());
        const previousTotal = roundMoney(Number(current.total || 0));
        const totals = calculateOrderTotals(mergedItems);
        const deltaTotal = roundMoney(totals.revenue - previousTotal);

        if (current.financeApplied && deltaTotal > 0) {
          tx.set(doc(collection(db, "finance")), {
            tipo: "ingreso",
            monto: deltaTotal,
            referencia: orderId,
            orderId,
            categoria: "venta_ajuste",
            source: current.source || "web",
            detalle: "Ajuste de pedido (items agregados)",
            createdAt: serverTimestamp(),
          });
        }

        tx.set(doc(collection(db, "order_adjustments")), {
          orderId,
          previousTotal,
          nextTotal: totals.revenue,
          deltaTotal,
          addedItems: adjustmentItems,
          stockAppliedAtAdjustment: Boolean(current.stockApplied),
          financeAppliedAtAdjustment: Boolean(current.financeApplied),
          createdAt: serverTimestamp(),
        });

        tx.update(orderRef, {
          items: mergedItems,
          total: totals.revenue,
          financialSummary: {
            revenue: totals.revenue,
            cost: totals.cost,
            grossProfit: totals.grossProfit,
            marginPct: totals.marginPct,
          },
          hasAdjustments: true,
          lastAdjustmentAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      setMessage("Pedido ajustado correctamente.");
      closeAdjustDraft();
    } catch (err) {
      setError(err.message || "No se pudo aplicar el ajuste.");
    } finally {
      setSavingAdjustment(false);
    }
  };

  const cancelOrder = async (order) => {
    setError("");
    setMessage("");
    try {
      await runTransaction(db, async (tx) => {
        const orderRef = doc(db, "orders", order.id);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) {
          throw new Error("Pedido no encontrado.");
        }
        const current = orderSnap.data();
        if (current.status === "cancelado") {
          return;
        }

        const items = current.items || [];
        if (current.stockApplied) {
          for (const item of items) {
            const productRef = doc(db, "products", item.productId);
            const productSnap = await tx.get(productRef);
            if (!productSnap.exists()) continue;
            const data = productSnap.data();
            const currentStock = data.stockActual ?? 0;
            tx.update(productRef, {
              stockActual: currentStock + Number(item.cantidad || 0),
              updatedAt: serverTimestamp(),
            });
            tx.set(doc(collection(db, "stock_movements")), {
              productId: item.productId,
              tipo: "ingreso",
              cantidad: Number(item.cantidad || 0),
              motivo: "cancelacion",
              orderId: order.id,
              createdAt: serverTimestamp(),
            });
          }
        }

        if (current.financeApplied) {
          tx.set(doc(collection(db, "finance")), {
            tipo: "egreso",
            monto: Number(current.total || 0),
            referencia: order.id,
            orderId: order.id,
            categoria: "cancelacion_pedido",
            source: current.source || "web",
            detalle: "Cancelacion de pedido",
            createdAt: serverTimestamp(),
          });
        }

        tx.update(orderRef, {
          status: "cancelado",
          stockApplied: false,
          financeApplied: false,
          updatedAt: serverTimestamp(),
        });
      });
      setMessage("Pedido cancelado y stock revertido.");
    } catch (err) {
      setError(err.message || "No se pudo cancelar el pedido.");
    }
  };

  const handleStatusChange = async (order, nextStatus) => {
    setError("");
    setMessage("");
    try {
      if (nextStatus === "cancelado") {
        await cancelOrder(order);
        return;
      }
      if ((nextStatus === "confirmado" || nextStatus === "despachado") && !order.stockApplied) {
        await applyOrderEffects(order, nextStatus);
      } else {
        await updateDoc(doc(db, "orders", order.id), {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
      }
      setMessage("Pedido actualizado.");
    } catch (err) {
      setError(err.message || "No se pudo actualizar el pedido.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Venta local</p>
          <h2 className="text-2xl font-semibold mt-2">Crear pedido manual</h2>
        </div>

        <div className="grid gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Cliente</span>
            <select
              value={manualOrder.customerId}
              onChange={(event) =>
                setManualOrder((prev) => ({ ...prev, customerId: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            >
              <option value="">Seleccionar cliente...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.nombre} {customer.apellido} {customer.email ? `(${customer.email})` : ""}
                </option>
              ))}
            </select>
          </label>

          {manualOrder.items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="grid md:grid-cols-[1.8fr_0.6fr_auto] gap-3 items-end">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">Producto</span>
                <select
                  value={item.productId}
                  onChange={(event) => updateItemRow(index, "productId", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                >
                  <option value="">Seleccionar producto...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">Cantidad</span>
                <input
                  type="number"
                  min="1"
                  value={item.cantidad}
                  onChange={(event) => updateItemRow(index, "cantidad", Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => removeItemRow(index)}
                className="px-3 py-2 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                Quitar
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addItemRow}
              className="px-4 py-2 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              Agregar producto
            </button>
            <span className="text-sm text-white/70">Total ${manualTotal.toFixed(2)}</span>
          </div>

          <button
            type="button"
            onClick={createManualOrder}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-sm font-semibold tracking-[0.2em] uppercase"
          >
            Crear pedido
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
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pedidos</p>
          <h2 className="text-2xl font-semibold mt-2">Listado de pedidos</h2>
        </div>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando pedidos...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-sm text-white/50">No hay pedidos registrados.</div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-white/50">
                      {order.customerSnapshot
                        ? `${order.customerSnapshot.nombre || ""} ${order.customerSnapshot.apellido || ""}`.trim()
                        : customerMap[order.customerId] || order.customerId}
                    </p>
                    <p className="text-xs text-white/50 uppercase tracking-[0.2em]">
                      {order.source || "web"}
                    </p>
                    {order.hasAdjustments && (
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                        Ajustado
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/70">${Number(order.total || 0).toFixed(2)}</span>
                    <select
                      value={order.status}
                      onChange={(event) => handleStatusChange(order, event.target.value)}
                      className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] outline-none"
                      disabled={order.status === "cancelado"}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {order.status !== "cancelado" && (
                      <button
                        type="button"
                        onClick={() => cancelOrder(order)}
                        className="px-3 py-2 rounded-2xl border border-red-500/40 text-red-200 text-xs uppercase tracking-[0.2em] hover:bg-red-500/10 transition"
                      >
                        Cancelar
                      </button>
                    )}
                    {order.status !== "cancelado" && (
                      <button
                        type="button"
                        onClick={() =>
                          adjustDraft.orderId === order.id
                            ? closeAdjustDraft()
                            : openAdjustDraft(order.id)
                        }
                        className="px-3 py-2 rounded-2xl border border-cyan-400/40 text-cyan-200 text-xs uppercase tracking-[0.2em] hover:bg-cyan-500/10 transition"
                      >
                        Agregar items
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-white/50">
                  {order.items?.map((item) => (
                    <span key={`${order.id}-${item.productId}`} className="mr-3">
                      {item.nombre} x{item.cantidad}
                    </span>
                  ))}
                </div>

                {adjustDraft.orderId === order.id && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4 space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">
                      Ajuste de pedido
                    </p>
                    {adjustDraft.items.map((item, index) => (
                      <div
                        key={`${order.id}-${index}`}
                        className="grid md:grid-cols-[1.8fr_0.6fr_auto] gap-3 items-end"
                      >
                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                            Producto
                          </span>
                          <select
                            value={item.productId}
                            onChange={(event) =>
                              updateAdjustItemRow(index, "productId", event.target.value)
                            }
                            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                          >
                            <option value="">Seleccionar producto...</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.nombre} (stock {Number(product.stockActual ?? 0)})
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                            Cantidad
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(event) =>
                              updateAdjustItemRow(index, "cantidad", Number(event.target.value))
                            }
                            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeAdjustItemRow(index)}
                          className="px-3 py-2 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <div className="flex flex-col md:flex-row gap-3">
                      <button
                        type="button"
                        onClick={addAdjustItemRow}
                        className="px-4 py-2 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition"
                      >
                        Agregar fila
                      </button>
                      <button
                        type="button"
                        onClick={() => applyOrderAdjustment(order.id)}
                        disabled={savingAdjustment}
                        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] text-xs uppercase tracking-[0.2em] font-semibold disabled:opacity-60"
                      >
                        {savingAdjustment ? "Aplicando..." : "Aplicar ajuste"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
