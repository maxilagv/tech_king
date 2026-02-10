import React, { useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Pencil, Trash2 } from "lucide-react";
import { db } from "@/api/firebase";
import { useCustomers } from "@/hooks/useCustomers";

const emptyForm = {
  nombre: "",
  apellido: "",
  dni: "",
  direccion: "",
  telefono: "",
  email: "",
};

export default function CustomersAdmin() {
  const { customers, loading } = useCustomers();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setForm({
      nombre: customer.nombre || "",
      apellido: customer.apellido || "",
      dni: customer.dni || "",
      direccion: customer.direccion || "",
      telefono: customer.telefono || "",
      email: customer.email || "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.nombre.trim() || !form.apellido.trim()) {
      setFormError("Nombre y apellido son obligatorios.");
      return;
    }

    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      dni: form.dni.trim(),
      direccion: form.direccion.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      tipo: "manual",
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "customers", editingId), payload);
      } else {
        await addDoc(collection(db, "customers"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || "No se pudo guardar el cliente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customerId) => {
    const ok = window.confirm("Eliminar este cliente?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "customers", customerId));
    } catch (err) {
      setFormError(err.message || "No se pudo borrar el cliente.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Clientes</p>
          <h2 className="text-2xl font-semibold mt-2">
            {editingId ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Registro manual para ventas en el local.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Nombre</span>
            <input
              type="text"
              value={form.nombre}
              onChange={(event) => handleChange("nombre", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Apellido</span>
            <input
              type="text"
              value={form.apellido}
              onChange={(event) => handleChange("apellido", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">DNI</span>
            <input
              type="text"
              value={form.dni}
              onChange={(event) => handleChange("dni", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Telefono</span>
            <input
              type="text"
              value={form.telefono}
              onChange={(event) => handleChange("telefono", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.25em] text-white/60">Direccion</span>
          <input
            type="text"
            value={form.direccion}
            onChange={(event) => handleChange("direccion", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.25em] text-white/60">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
          />
        </label>

        {formError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {formError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-sm font-semibold tracking-[0.2em] uppercase hover:opacity-90 transition disabled:opacity-60"
          >
            {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-3 rounded-2xl border border-white/15 text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Listado</p>
          <h2 className="text-2xl font-semibold mt-2">Clientes</h2>
        </div>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando clientes...</div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-sm text-white/50">No hay clientes cargados.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {customer.nombre} {customer.apellido}
                  </p>
                  <p className="text-xs text-white/50">{customer.email || "Sin email"}</p>
                  <p className="text-xs text-white/50">
                    {customer.telefono || "-"} · {customer.dni || "DNI no informado"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(customer)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition text-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
