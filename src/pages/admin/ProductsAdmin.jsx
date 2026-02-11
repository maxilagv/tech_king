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
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import ProductImagesField from "@/components/admin/ProductImagesField";

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  categorySlug: "",
  imagenes: [],
  destacado: false,
  stockActual: "",
  marca: "",
  activo: true,
};

export default function ProductsAdmin() {
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");

  const categoryOptions = useMemo(
    () => categories.filter((cat) => cat.activo !== false),
    [categories]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      precio: product.precio ?? "",
      categorySlug: product.categorySlug || "",
      imagenes: product.imagenes || [],
      destacado: product.destacado ?? false,
      stockActual: product.stockActual ?? "",
      marca: product.marca || "",
      activo: product.activo ?? true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (!form.categorySlug) {
      setFormError("La categoria es obligatoria.");
      return;
    }
    if (form.imagenes.length === 0) {
      setFormError("Debes subir al menos una imagen.");
      return;
    }
    if (form.precio === "" || Number.isNaN(Number(form.precio))) {
      setFormError("El precio es obligatorio.");
      return;
    }

    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || "",
      precio: Number(form.precio),
      categorySlug: form.categorySlug,
      imagenes: form.imagenes,
      destacado: Boolean(form.destacado),
      stockActual: form.stockActual === "" ? 0 : Number(form.stockActual),
      marca: form.marca.trim() || "",
      activo: Boolean(form.activo),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), payload);
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    const ok = window.confirm("Eliminar este producto?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (err) {
      setFormError(err.message || "No se pudo borrar el producto.");
    }
  };

  const filtered = products.filter((product) => {
    const text = `${product.nombre || ""} ${product.marca || ""}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const categoryMap = Object.fromEntries(
    categories.map((cat) => [cat.slug || cat.id, cat.nombre])
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">ABM</p>
          <h2 className="text-2xl font-semibold mt-2">
            {editingId ? "Editar producto" : "Nuevo producto"}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Imagen obligatoria, precio y stock controlado.
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
              placeholder="iPhone 15 Pro Max"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Categoria</span>
            <select
              value={form.categorySlug}
              onChange={(event) => handleChange("categorySlug", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              required
            >
              <option value="">Seleccionar...</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.slug || cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Descripcion</span>
            <textarea
              value={form.descripcion}
              onChange={(event) => handleChange("descripcion", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/30 min-h-[90px]"
              placeholder="Descripcion corta"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Precio</span>
              <input
                type="number"
                value={form.precio}
                onChange={(event) => handleChange("precio", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                placeholder="1299"
                min="0"
                step="0.01"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Stock</span>
              <input
                type="number"
                value={form.stockActual}
                onChange={(event) => handleChange("stockActual", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                placeholder="10"
                min="0"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Marca</span>
            <input
              type="text"
              value={form.marca}
              onChange={(event) => handleChange("marca", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/30"
              placeholder="Apple"
            />
          </label>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.destacado}
                onChange={(event) => handleChange("destacado", event.target.checked)}
                className="w-4 h-4 accent-cyan-400"
              />
              <span className="text-sm text-white/70">Destacado</span>
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
          </div>
        </div>

        <ProductImagesField
          images={form.imagenes}
          onChange={(value) => handleChange("imagenes", value)}
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

      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Listado</p>
            <h2 className="text-2xl font-semibold mt-2">Productos</h2>
          </div>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto..."
            className="w-full md:w-64 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-white/30"
          />
        </div>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando productos...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-sm text-white/50">No hay productos cargados.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10">
                    {product.imagenes?.[0] ? (
                      <img
                        src={product.imagenes[0]}
                        alt={product.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{product.nombre}</p>
                    <p className="text-xs text-white/50 uppercase tracking-[0.2em]">
                      {categoryMap[product.categorySlug] || product.categorySlug}
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      ${Number(product.precio || 0).toFixed(2)} - Stock {product.stockActual ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {product.destacado && (
                    <span className="px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] bg-cyan-500/15 text-cyan-200">
                      Destacado
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
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
