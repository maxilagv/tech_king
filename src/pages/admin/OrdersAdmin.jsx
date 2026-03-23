import React, { useMemo, useState } from "react";
import { collection, doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/api/firebase";
import { useOrders } from "@/hooks/useOrders";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
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

function sanitizeQuantityInput(value) {
  const digits = String(value ?? "").replace(/\D+/g, "");
  if (!digits) return "";
  return digits.replace(/^0+/, "");
}

function normalizeDraftQuantity(value) {
  const qty = toPositiveInt(value);
  return String(qty > 0 ? qty : 1);
}

function createDraftItem() {
  return { productId: "", cantidad: "1" };
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

function getOwnerNotificationMeta(notification) {
  if (!notification) {
    return {
      label: "Aviso dueño sin registro",
      className: "bg-white/10 text-white/60",
    };
  }
  if (notification.status === "sent") {
    return {
      label: "Aviso dueño enviado",
      className: "bg-emerald-500/15 text-emerald-200",
    };
  }
  if (notification.status === "failed") {
    return {
      label: "Aviso dueño fallido",
      className: "bg-red-500/15 text-red-200",
    };
  }
  return {
    label: `Aviso dueño ${notification.status || "pendiente"}`,
    className: "bg-amber-500/15 text-amber-200",
  };
}

export default function OrdersAdmin() {
  const { orders, loading } = useOrders();
  const { notifications } = useOrderNotifications();
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

  const notificationMap = useMemo(
    () =>
      Object.fromEntries(
        notifications.map((notification) => [notification.orderId || notification.id, notification])
      ),
    [notifications]
  );

  const [manualOrder, setManualOrder] = useState({
    customerId: "",
    items: [createDraftItem()],
  });
  const [adjustDraft, setAdjustDraft] = useState({
    orderId: "",
    items: [createDraftItem()],
  });
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  const addItemRow = () => {
    setManualOrder((prev) => ({
      ...prev,
      items: [...prev.items, createDraftItem()],
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
    setAdjustDraft({ orderId, items: [createDraftItem()] });
  };

  const closeAdjustDraft = () => {
    setAdjustDraft({ orderId: "", items: [createDraftItem()] });
  };

  const addAdjustItemRow = () => {
    setAdjustDraft((prev) => ({
      ...prev,
      items: [...prev.items, createDraftItem()],
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
    return sum + Number(product.precio || 0) * toPositiveInt(item.cantidad);
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
        const draftItems = [];

        // Read phase: all product reads first.
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

          draftItems.push({
            productRef,
            currentStock,
            item: {
              productId: row.productId,
              nombre: data.nombre || "Producto",
              precio: Number(data.precio || 0),
              cantidad: quantity,
              costoUnitarioARS: Number(data.costoActual || 0),
            },
          });
        }

        const orderItems = draftItems.map((entry) => entry.item);
        const totals = calculateOrderTotals(orderItems);

        // Write phase: product updates, movements, finance and order.
        for (const entry of draftItems) {
          tx.update(entry.productRef, {
            stockActual: entry.currentStock - entry.item.cantidad,
            updatedAt: serverTimestamp(),
          });

          tx.set(doc(collection(db, "stock_movements")), {
            productId: entry.item.productId,
            tipo: "egreso",
            cantidad: entry.item.cantidad,
            motivo: "venta_local",
            orderId: orderRef.id,
            createdAt: serverTimestamp(),
          });
        }

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

      const productDrafts = [];
      // Read phase: read all products first.
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
        productDrafts.push({
          item,
          productRef,
          data,
          nextStock,
        });
      }

      const enrichedItems = productDrafts.map((draft) => ({
        productId: draft.item.productId,
        nombre: draft.item.nombre || draft.data.nombre || "Producto",
        precio: Number(draft.item.precio || draft.data.precio || 0),
        cantidad: draft.item.cantidad,
        costoUnitarioARS:
          draft.item.costoUnitarioARS === null || draft.item.costoUnitarioARS === undefined
            ? Number(draft.data.costoActual || 0)
            : Number(draft.item.costoUnitarioARS || 0),
      }));

      const totals = calculateOrderTotals(enrichedItems);

      // Write phase.
      for (const draft of productDrafts) {
        tx.update(draft.productRef, {
          stockActual: draft.nextStock,
          updatedAt: serverTimestamp(),
        });

        tx.set(doc(collection(db, "stock_movements")), {
          productId: draft.item.productId,
          tipo: "egreso",
          cantidad: draft.item.cantidad,
          motivo: "venta_web",
          orderId: order.id,
          createdAt: serverTimestamp(),
        });
      }

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
        const productDrafts = [];

        // Read phase.
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

          if (current.stockApplied && currentStock < quantityToAdd) {
            throw new Error(`Stock insuficiente para ${data.nombre || "producto"}`);
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

          productDrafts.push({
            productRef,
            productId: row.productId,
            quantityToAdd,
            currentStock,
          });
        }

        const mergedItems = Array.from(itemsMap.values());
        const previousTotal = roundMoney(Number(current.total || 0));
        const totals = calculateOrderTotals(mergedItems);
        const deltaTotal = roundMoney(totals.revenue - previousTotal);

        // Write phase.
        if (current.stockApplied) {
          for (const draft of productDrafts) {
            tx.update(draft.productRef, {
              stockActual: draft.currentStock - draft.quantityToAdd,
              updatedAt: serverTimestamp(),
            });
            tx.set(doc(collection(db, "stock_movements")), {
              productId: draft.productId,
              tipo: "egreso",
              cantidad: draft.quantityToAdd,
              motivo: "ajuste_pedido",
              orderId,
              createdAt: serverTimestamp(),
            });
          }
        }

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

        const items = normalizeOrderItems(current.items || []);
        const productDrafts = [];
        if (current.stockApplied) {
          for (const item of items) {
            const productRef = doc(db, "products", item.productId);
            const productSnap = await tx.get(productRef);
            if (!productSnap.exists()) continue;
            const data = productSnap.data();
            const currentStock = Number(data.stockActual ?? 0);
            productDrafts.push({
              item,
              productRef,
              nextStock: currentStock + Number(item.cantidad || 0),
            });
          }
        }

        if (current.stockApplied) {
          for (const draft of productDrafts) {
            tx.update(draft.productRef, {
              stockActual: draft.nextStock,
              updatedAt: serverTimestamp(),
            });
            tx.set(doc(collection(db, "stock_movements")), {
              productId: draft.item.productId,
              tipo: "ingreso",
              cantidad: Number(draft.item.cantidad || 0),
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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={item.cantidad}
                  onChange={(event) =>
                    updateItemRow(index, "cantidad", sanitizeQuantityInput(event.target.value))
                  }
                  onBlur={(event) =>
                    updateItemRow(index, "cantidad", normalizeDraftQuantity(event.target.value))
                  }
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
                {order.source === "web" && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] ${
                        getOwnerNotificationMeta(notificationMap[order.id]).className
                      }`}
                    >
                      {getOwnerNotificationMeta(notificationMap[order.id]).label}
                    </span>
                    {notificationMap[order.id]?.lastError && (
                      <span className="text-[11px] text-red-200/80">
                        {notificationMap[order.id].lastError}
                      </span>
                    )}
                  </div>
                )}
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
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.cantidad}
                            onChange={(event) =>
                              updateAdjustItemRow(
                                index,
                                "cantidad",
                                sanitizeQuantityInput(event.target.value)
                              )
                            }
                            onBlur={(event) =>
                              updateAdjustItemRow(
                                index,
                                "cantidad",
                                normalizeDraftQuantity(event.target.value)
                              )
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
