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
    const validItems = manualOrder.items.filter((item) => item.productId);
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
        const orderItems = validItems.map((item) => {
          const product = productMap[item.productId];
          return {
            productId: item.productId,
            nombre: product?.nombre || "Producto",
            precio: Number(product?.precio || 0),
            cantidad: Number(item.cantidad || 1),
          };
        });

        for (const item of orderItems) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await tx.get(productRef);
          if (!productSnap.exists()) {
            throw new Error("Producto no encontrado.");
          }
          const data = productSnap.data();
          const currentStock = data.stockActual ?? 0;
          if (currentStock < item.cantidad) {
            throw new Error(`Stock insuficiente para ${data.nombre}`);
          }
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

        tx.set(doc(collection(db, "finance")), {
          tipo: "ingreso",
          monto: Number(manualTotal.toFixed(2)),
          referencia: orderRef.id,
          detalle: "Venta local",
          createdAt: serverTimestamp(),
        });

        tx.set(orderRef, {
          customerId: manualOrder.customerId,
          items: orderItems,
          total: Number(manualTotal.toFixed(2)),
          status: "confirmado",
          source: "local",
          stockApplied: true,
          financeApplied: true,
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
      const items = current.items || [];
      for (const item of items) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await tx.get(productRef);
        if (!productSnap.exists()) continue;
        const data = productSnap.data();
        const currentStock = data.stockActual ?? 0;
        const nextStock = currentStock - item.cantidad;
        if (nextStock < 0) {
          throw new Error(`Stock insuficiente para ${data.nombre}`);
        }
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
      }

      tx.set(doc(collection(db, "finance")), {
        tipo: "ingreso",
        monto: Number(current.total || 0),
        referencia: order.id,
        detalle: "Venta web",
        createdAt: serverTimestamp(),
      });

      tx.update(orderRef, {
        status: nextStatus,
        stockApplied: true,
        financeApplied: true,
        updatedAt: serverTimestamp(),
      });
    });
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
                  </div>
                </div>
                <div className="text-xs text-white/50">
                  {order.items?.map((item) => (
                    <span key={`${order.id}-${item.productId}`} className="mr-3">
                      {item.nombre} x{item.cantidad}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
