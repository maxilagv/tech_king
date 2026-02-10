import React, { useMemo, useState } from "react";
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
import { useCategories } from "@/hooks/useCategories";
import { slugify } from "@/utils/slugify";
import ImageUploadField from "@/components/admin/ImageUploadField";

const emptyForm = {
  nombre: "",
  descripcion: "",
  imagen: "",
  orden: "",
  activo: true,
};

export default function CategoriesAdmin() {
  const { categories, loading, error } = useCategories();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const derivedSlug = useMemo(() => slugify(form.nombre || ""), [form.nombre]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({
      nombre: category.nombre || "",
      descripcion: category.descripcion || "",
      imagen: category.imagen || "",
      orden: category.orden ?? "",
      activo: category.activo ?? true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (!form.imagen) {
      setFormError("La imagen es obligatoria.");
      return;
    }

    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      slug: derivedSlug,
      descripcion: form.descripcion.trim() || "",
      imagen: form.imagen,
      orden: form.orden === "" ? 999 : Number(form.orden),
      activo: Boolean(form.activo),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "categories", editingId), payload);
      } else {
        await addDoc(collection(db, "categories"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || "No se pudo guardar la categoria.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    const ok = window.confirm("Eliminar esta categoria?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "categories", categoryId));
    } catch (err) {
      setFormError(err.message || "No se pudo borrar la categoria.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1.95fr]">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">ABM</p>
          <h2 className="text-2xl font-semibold mt-2">
            {editingId ? "Editar categoria" : "Nueva categoria"}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Las categorias deben tener nombre e imagen obligatoria.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Nombre</span>
            <input
              type="text"
              value={form.nombre}
              onChange={(event) => handleChange("nombre", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/30"
              placeholder="Smartphones"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Slug</span>
            <input
              type="text"
              value={derivedSlug}
              readOnly
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/60 outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Descripcion</span>
            <textarea
              value={form.descripcion}
              onChange={(event) => handleChange("descripcion", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/30 min-h-[90px]"
              placeholder="Ultima generacion"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Orden</span>
              <input
                type="number"
                value={form.orden}
                onChange={(event) => handleChange("orden", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                placeholder="10"
                min="0"
              />
            </label>
            <label className="flex items-center gap-3 mt-7">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => handleChange("activo", event.target.checked)}
                className="w-4 h-4 accent-cyan-400"
              />
              <span className="text-sm text-white/70">Activa</span>
            </label>
          </div>
        </div>

        <ImageUploadField
          label="Imagen"
          value={form.imagen}
          onChange={(value) => handleChange("imagen", value)}
          folder="techking/categories"
        />

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

      {/* List */}
      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Listado</p>
            <h2 className="text-2xl font-semibold mt-2">Categorias</h2>
          </div>
          <span className="text-xs uppercase tracking-[0.25em] text-white/40">
            {categories.length} items
          </span>
        </div>

        {loading && (
          <div className="py-12 text-sm text-white/50">Cargando categorias...</div>
        )}
        {error && (
          <div className="py-12 text-sm text-red-200">{error}</div>
        )}

        {!loading && categories.length === 0 && (
          <div className="py-12 text-sm text-white/50">
            No hay categorias. Crea la primera desde el formulario.
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10">
                  {category.imagen ? (
                    <img src={category.imagen} alt={category.nombre} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-semibold">{category.nombre}</p>
                  <p className="text-xs text-white/50 uppercase tracking-[0.2em]">{category.slug}</p>
                  {category.descripcion && (
                    <p className="text-xs text-white/50 mt-1">{category.descripcion}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                    category.activo ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-white/50"
                  }`}
                >
                  {category.activo ? "Activa" : "Inactiva"}
                </span>
                <button
                  type="button"
                  onClick={() => handleEdit(category)}
                  className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category.id)}
                  className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition text-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
