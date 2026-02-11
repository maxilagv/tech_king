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
import { useSuppliers } from "@/hooks/useSuppliers";

const emptyForm = {
  nombre: "",
  contacto: "",
  telefono: "",
  email: "",
  direccion: "",
  notas: "",
  activo: true,
};

export default function SuppliersAdmin() {
  const { suppliers, loading } = useSuppliers();
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

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setForm({
      nombre: supplier.nombre || "",
      contacto: supplier.contacto || "",
      telefono: supplier.telefono || "",
      email: supplier.email || "",
      direccion: supplier.direccion || "",
      notas: supplier.notas || "",
      activo: supplier.activo ?? true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      contacto: form.contacto.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      direccion: form.direccion.trim(),
      notas: form.notas.trim(),
      activo: Boolean(form.activo),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "suppliers", editingId), payload);
      } else {
        await addDoc(collection(db, "suppliers"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || "No se pudo guardar el proveedor.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplierId) => {
    const ok = window.confirm("Eliminar este proveedor?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "suppliers", supplierId));
    } catch (err) {
      setFormError(err.message || "No se pudo borrar el proveedor.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Proveedores</p>
          <h2 className="text-2xl font-semibold mt-2">
            {editingId ? "Editar proveedor" : "Nuevo proveedor"}
          </h2>
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
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Contacto</span>
            <input
              type="text"
              value={form.contacto}
              onChange={(event) => handleChange("contacto", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Telefono</span>
            <input
              type="text"
              value={form.telefono}
              onChange={(event) => handleChange("telefono", event.target.value)}
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
          <span className="text-xs uppercase tracking-[0.25em] text-white/60">Notas</span>
          <textarea
            value={form.notas}
            onChange={(event) => handleChange("notas", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none min-h-[90px]"
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(event) => handleChange("activo", event.target.checked)}
            className="w-4 h-4 accent-cyan-400"
          />
          <span className="text-sm text-white/70">Activo</span>
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
          <h2 className="text-2xl font-semibold mt-2">Proveedores</h2>
        </div>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando proveedores...</div>
        ) : suppliers.length === 0 ? (
          <div className="py-12 text-sm text-white/50">No hay proveedores.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{supplier.nombre}</p>
                  <p className="text-xs text-white/50">{supplier.contacto || "Sin contacto"}</p>
                  <p className="text-xs text-white/50">
                    {supplier.telefono || "-"} - {supplier.email || "Sin email"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(supplier)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(supplier.id)}
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
