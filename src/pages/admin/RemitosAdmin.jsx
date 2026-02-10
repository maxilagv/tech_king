import React, { useMemo, useState } from "react";
import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/api/firebase";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { generateRemitoPdf } from "@/utils/remito";
import { getNextCounter } from "@/utils/counters";

export default function RemitosAdmin() {
  const { orders, loading } = useOrders();
  const { customers } = useCustomers();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((cust) => [cust.id, cust])),
    [customers]
  );

  const eligibleOrders = orders.filter(
    (order) => order.status === "confirmado" || order.status === "despachado"
  );

  const handleGenerate = async (order) => {
    setError("");
    setMessage("");
    try {
      if (order.remitoNumero) {
        setMessage(`Este pedido ya tiene remito #${order.remitoNumero}.`);
        return;
      }
      const numero = await getNextCounter("remito");
      const customer = order.customerSnapshot || customerMap[order.customerId] || {};
      const remitoRef = doc(collection(db, "remitos"));

      await setDoc(remitoRef, {
        numero,
        orderId: order.id,
        customerId: order.customerId,
        total: Number(order.total || 0),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "orders", order.id), {
        remitoId: remitoRef.id,
        remitoNumero: numero,
        updatedAt: serverTimestamp(),
      });

      generateRemitoPdf({ numero, order, customer });
      setMessage(`Remito #${numero} generado.`);
    } catch (err) {
      setError(err.message || "No se pudo generar el remito.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Remitos</p>
          <h2 className="text-2xl font-semibold mt-2">Generar remito</h2>
        </div>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando pedidos...</div>
        ) : eligibleOrders.length === 0 ? (
          <div className="py-12 text-sm text-white/50">No hay pedidos confirmados.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {eligibleOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">Pedido #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-white/50">
                    {order.customerSnapshot
                      ? `${order.customerSnapshot.nombre} ${order.customerSnapshot.apellido}`
                      : customerMap[order.customerId]?.nombre || order.customerId}
                  </p>
                  <p className="text-xs text-white/50">
                    Total ${Number(order.total || 0).toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerate(order)}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold uppercase tracking-[0.2em] ${
                    order.remitoNumero
                      ? "bg-white/10 text-white/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020]"
                  }`}
                  disabled={Boolean(order.remitoNumero)}
                >
                  {order.remitoNumero ? `Remito #${order.remitoNumero}` : "Generar PDF"}
                </button>
              </div>
            ))}
          </div>
        )}
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
