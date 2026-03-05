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
import ImageUploadField from "@/components/admin/ImageUploadField";
import { useLandingHeroes } from "@/hooks/useLandingHeroes";
import { BRAND_CLOUDINARY_ROOT } from "@/constants/brand";

const emptyForm = {
  titulo: "",
  subtitulo: "",
  descripcion: "",
  badge: "",
  ctaLabel: "",
  ctaUrl: "/products",
  imagen: "",
  orden: "",
  activo: true,
};

export default function LandingAdmin() {
  const { heroes, loading } = useLandingHeroes();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setError("");
  };

  const handleEdit = (hero) => {
    setEditingId(hero.id);
    setForm({
      titulo: hero.titulo || "",
      subtitulo: hero.subtitulo || "",
      descripcion: hero.descripcion || "",
      badge: hero.badge || "",
      ctaLabel: hero.ctaLabel || "",
      ctaUrl: hero.ctaUrl || "/products",
      imagen: hero.imagen || "",
      orden: hero.orden ?? "",
      activo: hero.activo !== false,
    });
    setError("");
    setMessage("");
  };

  const validateForm = () => {
    if (!form.titulo.trim()) return "El titulo es obligatorio.";
    if (!form.descripcion.trim()) return "La descripcion es obligatoria.";
    if (!form.ctaLabel.trim()) return "El texto del boton es obligatorio.";
    if (!form.ctaUrl.trim()) return "La URL del boton es obligatoria.";
    if (!form.imagen) return "La imagen es obligatoria.";
    const orderValue = Number(form.orden || 0);
    if (!Number.isFinite(orderValue) || orderValue < 0) {
      return "El orden debe ser un numero mayor o igual a 0.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const validation = validateForm();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    const payload = {
      titulo: form.titulo.trim(),
      subtitulo: form.subtitulo.trim(),
      descripcion: form.descripcion.trim(),
      badge: form.badge.trim(),
      ctaLabel: form.ctaLabel.trim(),
      ctaUrl: form.ctaUrl.trim(),
      imagen: form.imagen,
      orden: Number(form.orden || 0),
      activo: Boolean(form.activo),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "landing_heroes", editingId), payload);
        setMessage("Slide de hero actualizado.");
      } else {
        await addDoc(collection(db, "landing_heroes"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setMessage("Slide de hero creado.");
      }
      resetForm();
    } catch (submitError) {
      setError(submitError?.message || "No se pudo guardar el slide.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (heroId) => {
    const ok = window.confirm("Eliminar este slide del hero?");
    if (!ok) return;
    setMessage("");
    setError("");
    try {
      await deleteDoc(doc(db, "landing_heroes", heroId));
      setMessage("Slide eliminado.");
      if (editingId === heroId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError?.message || "No se pudo eliminar el slide.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Landing</p>
          <h2 className="text-2xl font-semibold mt-2">
            {editingId ? "Editar slide" : "Nuevo slide"}
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Gestiona los heroes principales de la home.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Titulo</span>
            <input
              type="text"
              value={form.titulo}
              onChange={(event) => handleChange("titulo", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Subtitulo</span>
            <input
              type="text"
              value={form.subtitulo}
              onChange={(event) => handleChange("subtitulo", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Descripcion</span>
            <textarea
              value={form.descripcion}
              onChange={(event) => handleChange("descripcion", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none min-h-[90px]"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Badge</span>
            <input
              type="text"
              value={form.badge}
              onChange={(event) => handleChange("badge", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                Texto boton
              </span>
              <input
                type="text"
                value={form.ctaLabel}
                onChange={(event) => handleChange("ctaLabel", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                URL boton
              </span>
              <input
                type="text"
                value={form.ctaUrl}
                onChange={(event) => handleChange("ctaUrl", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                placeholder="/products"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Orden</span>
              <input
                type="number"
                min="0"
                value={form.orden}
                onChange={(event) => handleChange("orden", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="flex items-center gap-3 mt-7">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => handleChange("activo", event.target.checked)}
                className="w-4 h-4 accent-violet-400"
              />
              <span className="text-sm text-white/70">Activo</span>
            </label>
          </div>
        </div>

        <ImageUploadField
          label="Imagen del hero"
          value={form.imagen}
          onChange={(value) => handleChange("imagen", value)}
          folder={`${BRAND_CLOUDINARY_ROOT}/landing`}
        />

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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-violet-400 to-fuchsia-500 text-[#120b2f] py-3 text-sm font-semibold tracking-[0.2em] uppercase disabled:opacity-60"
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
          <h2 className="text-2xl font-semibold mt-2">Slides del hero</h2>
        </div>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando slides...</div>
        ) : heroes.length === 0 ? (
          <div className="py-12 text-sm text-white/50">
            No hay slides cargados. Crea el primero desde el formulario.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {heroes.map((hero) => (
              <div
                key={hero.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-14 rounded-xl overflow-hidden bg-white/10">
                    {hero.imagen && (
                      <img src={hero.imagen} alt={hero.titulo} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{hero.titulo}</p>
                    <p className="text-xs text-white/50">{hero.subtitulo || "Sin subtitulo"}</p>
                    <p className="text-[11px] text-white/40 mt-1">Orden {Number(hero.orden || 0)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                      hero.activo !== false
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {hero.activo !== false ? "Activo" : "Inactivo"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEdit(hero)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(hero.id)}
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
