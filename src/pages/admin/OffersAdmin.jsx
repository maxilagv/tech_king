import React, { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Pencil, Trash2 } from "lucide-react";
import { db } from "@/api/firebase";
import { useOffers } from "@/hooks/useOffers";
import { useProducts } from "@/hooks/useProducts";
import ProductImagesField from "@/components/admin/ProductImagesField";
import { isOfferEnabled, toDate } from "@/utils/offers";

const emptyForm = {
  titulo: "",
  descripcion: "",
  tipo: "fecha",
  activa: true,
  prioridad: 0,
  productIds: [],
  bannerImages: [],
  descuentoPct: "",
  precioOferta: "",
  minUnidades: "",
  startsAt: "",
  endsAt: "",
};

function dateToInput(value) {
  const date = toDate(value);
  if (!date) return "";
  const pad = (num) => String(num).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function inputToDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatOfferType(tipo) {
  return tipo === "volumen" ? "Volumen" : "Fecha";
}

export default function OffersAdmin() {
  const { offers, loading } = useOffers();
  const { products } = useProducts();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          { id: product.id, nombre: product.nombre || "Producto", imagen: product.imagenes?.[0] || "" },
        ])
      ),
    [products]
  );

  const selectableProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const text = `${product.nombre || ""} ${product.marca || ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [products, query]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleProduct = (productId) => {
    setForm((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  };

  const handleEdit = (offer) => {
    setEditingId(offer.id);
    setForm({
      titulo: offer.titulo || "",
      descripcion: offer.descripcion || "",
      tipo: offer.tipo || "fecha",
      activa: offer.activa !== false,
      prioridad: Number(offer.prioridad || 0),
      productIds: Array.isArray(offer.productIds) ? offer.productIds : [],
      bannerImages: Array.isArray(offer.bannerImages) ? offer.bannerImages : [],
      descuentoPct:
        offer.descuentoPct === undefined || offer.descuentoPct === null ? "" : offer.descuentoPct,
      precioOferta:
        offer.precioOferta === undefined || offer.precioOferta === null ? "" : offer.precioOferta,
      minUnidades:
        offer.minUnidades === undefined || offer.minUnidades === null ? "" : offer.minUnidades,
      startsAt: dateToInput(offer.startsAt),
      endsAt: dateToInput(offer.endsAt),
    });
    setFormError("");
    setMessage("");
  };

  const validate = () => {
    if (!form.titulo.trim()) return "El titulo es obligatorio.";
    if (!form.productIds.length) return "Debes seleccionar al menos un producto.";

    const hasPct = form.descuentoPct !== "" && !Number.isNaN(Number(form.descuentoPct));
    const hasPrice = form.precioOferta !== "" && !Number.isNaN(Number(form.precioOferta));
    if (!hasPct && !hasPrice) return "Debes indicar descuento % o precio oferta.";
    if (hasPct) {
      const pct = Number(form.descuentoPct);
      if (pct <= 0 || pct > 100) return "El descuento % debe estar entre 0 y 100.";
    }
    if (hasPrice) {
      const price = Number(form.precioOferta);
      if (price < 0) return "El precio oferta no puede ser negativo.";
    }

    if (form.tipo === "fecha") {
      const start = inputToDate(form.startsAt);
      const end = inputToDate(form.endsAt);
      if (!start || !end) return "Debes completar inicio y fin para oferta por fecha.";
      if (end <= start) return "La fecha fin debe ser mayor a la fecha inicio.";
    }

    if (form.tipo === "volumen") {
      const min = Number(form.minUnidades);
      if (!Number.isFinite(min) || min < 1) return "Minimo de unidades invalido.";
    }

    return "";
  };

  const buildPayload = () => {
    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || "",
      tipo: form.tipo,
      activa: Boolean(form.activa),
      prioridad: Number(form.prioridad || 0),
      productIds: Array.from(new Set(form.productIds.map((id) => String(id).trim()).filter(Boolean))),
      bannerImages: (form.bannerImages || []).filter(Boolean),
      updatedAt: serverTimestamp(),
    };

    if (form.descuentoPct !== "" && !Number.isNaN(Number(form.descuentoPct))) {
      payload.descuentoPct = Number(form.descuentoPct);
    }
    if (form.precioOferta !== "" && !Number.isNaN(Number(form.precioOferta))) {
      payload.precioOferta = Number(form.precioOferta);
    }

    if (form.tipo === "fecha") {
      const start = inputToDate(form.startsAt);
      const end = inputToDate(form.endsAt);
      payload.startsAt = Timestamp.fromDate(start);
      payload.endsAt = Timestamp.fromDate(end);
    }

    if (form.tipo === "volumen") {
      payload.minUnidades = Math.max(1, Math.floor(Number(form.minUnidades || 1)));
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setMessage("");

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateDoc(doc(db, "offers", editingId), payload);
        setMessage("Oferta actualizada.");
      } else {
        await addDoc(collection(db, "offers"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setMessage("Oferta creada.");
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || "No se pudo guardar la oferta.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (offerId) => {
    const ok = window.confirm("Eliminar esta oferta?");
    if (!ok) return;
    setFormError("");
    setMessage("");
    try {
      await deleteDoc(doc(db, "offers", offerId));
      setMessage("Oferta eliminada.");
      if (editingId === offerId) {
        resetForm();
      }
    } catch (err) {
      setFormError(err.message || "No se pudo eliminar la oferta.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1.85fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Promociones</p>
          <h2 className="text-2xl font-semibold mt-2">{editingId ? "Editar oferta" : "Nueva oferta"}</h2>
          <p className="text-sm text-white/50 mt-1">Descuento por fecha o por volumen.</p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Titulo</span>
            <input
              type="text"
              value={form.titulo}
              onChange={(event) => handleChange("titulo", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              placeholder="Semana gamer"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.25em] text-white/60">Descripcion</span>
            <textarea
              value={form.descripcion}
              onChange={(event) => handleChange("descripcion", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none min-h-[84px]"
              placeholder="Descripcion breve de la promo"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Tipo</span>
              <select
                value={form.tipo}
                onChange={(event) => handleChange("tipo", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
              >
                <option value="fecha">Fecha</option>
                <option value="volumen">Volumen</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Prioridad</span>
              <input
                type="number"
                value={form.prioridad}
                onChange={(event) => handleChange("prioridad", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                min="0"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Descuento %</span>
              <input
                type="number"
                value={form.descuentoPct}
                onChange={(event) => handleChange("descuentoPct", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                min="0"
                max="100"
                step="0.01"
                placeholder="10"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Precio oferta</span>
              <input
                type="number"
                value={form.precioOferta}
                onChange={(event) => handleChange("precioOferta", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                min="0"
                step="0.01"
                placeholder="199.99"
              />
            </label>
          </div>

          {form.tipo === "fecha" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">Inicio</span>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => handleChange("startsAt", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.25em] text-white/60">Fin</span>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => handleChange("endsAt", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>
          )}

          {form.tipo === "volumen" && (
            <label className="block">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60">Min unidades</span>
              <input
                type="number"
                value={form.minUnidades}
                onChange={(event) => handleChange("minUnidades", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                min="1"
                step="1"
                placeholder="3"
              />
            </label>
          )}

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(event) => handleChange("activa", event.target.checked)}
              className="w-4 h-4 accent-cyan-400"
            />
            <span className="text-sm text-white/70">Oferta activa</span>
          </label>
        </div>

        <ProductImagesField
          images={form.bannerImages}
          onChange={(value) => handleChange("bannerImages", value)}
          folder="techking/offers"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              Productos ({form.productIds.length})
            </p>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto..."
              className="w-48 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
            {selectableProducts.length === 0 ? (
              <p className="text-xs text-white/50">No hay productos para seleccionar.</p>
            ) : (
              selectableProducts.map((product) => (
                <label
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/10"
                >
                  <input
                    type="checkbox"
                    checked={form.productIds.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                  <span className="text-sm text-white/80">{product.nombre}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {formError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {formError}
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Listado</p>
            <h2 className="text-2xl font-semibold mt-2">Ofertas</h2>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">{offers.length} items</span>
        </div>

        {loading ? (
          <div className="py-12 text-sm text-white/50">Cargando ofertas...</div>
        ) : offers.length === 0 ? (
          <div className="py-12 text-sm text-white/50">No hay ofertas cargadas.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {offers.map((offer) => {
              const activeNow = isOfferEnabled(offer, new Date());
              const productsText = (offer.productIds || [])
                .slice(0, 3)
                .map((id) => productMap.get(id)?.nombre || id)
                .join(", ");
              const remaining = Math.max(0, (offer.productIds || []).length - 3);
              return (
                <div
                  key={offer.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{offer.titulo}</p>
                      <p className="text-xs text-white/50 mt-1">{offer.descripcion || "Sin descripcion"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                          activeNow
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {activeNow ? "Activa" : "Inactiva"}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] bg-cyan-500/15 text-cyan-200">
                        {formatOfferType(offer.tipo)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-white/60">
                    Productos: {productsText}
                    {remaining > 0 ? ` +${remaining} mas` : ""}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-xs text-white/50 space-y-1">
                      {offer.descuentoPct !== undefined && offer.descuentoPct !== null && (
                        <p>Descuento: {Number(offer.descuentoPct)}%</p>
                      )}
                      {offer.precioOferta !== undefined && offer.precioOferta !== null && (
                        <p>Precio oferta: ${Number(offer.precioOferta).toFixed(2)}</p>
                      )}
                      {offer.tipo === "volumen" && (
                        <p>Min unidades: {Math.max(1, Number(offer.minUnidades || 1))}</p>
                      )}
                      {offer.tipo === "fecha" && (
                        <p>
                          Ventana: {toDate(offer.startsAt)?.toLocaleString() || "-"} a{" "}
                          {toDate(offer.endsAt)?.toLocaleString() || "-"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(offer)}
                        className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(offer.id)}
                        className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition text-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
