import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { RotateCcw, Save } from "lucide-react";
import { db } from "@/api/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessConfig } from "@/hooks/useBusinessConfig";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
import { usePriceBatches } from "@/hooks/usePriceBatches";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { useProducts } from "@/hooks/useProducts";
import { normalizeBusinessConfig } from "@/utils/businessConfig";
import {
  buildPriceBatchPreview,
  normalizePricingConfig,
  PRICE_BATCH_MODES,
  PRICE_BATCH_MODE_PERCENT,
  PRICE_BATCH_STATUS_APPLIED,
  PRICE_BATCH_STATUS_ROLLED_BACK,
  PRICE_ROUNDING_MODES,
} from "@/utils/pricingEngine";

const CLIENT_APPLY_LIMIT = 200;

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  if (typeof value.toDate === "function") return value.toDate().toLocaleString("es-AR");
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000).toLocaleString("es-AR");
  return "-";
}

function buildBusinessForm(config) {
  const safe = normalizeBusinessConfig(config);
  return {
    supportEmail: safe.supportEmail,
    phoneDisplay: safe.phoneDisplay,
    phoneE164: safe.phoneE164,
    whatsappDigits: safe.whatsappDigits,
    whatsappMessageTemplate: safe.whatsappMessageTemplate,
    address: safe.address,
    mapsEmbedUrl: safe.mapsEmbedUrl,
  };
}

function buildPricingForm(config) {
  const safe = normalizePricingConfig(config);
  return {
    roundingStep: String(safe.roundingStep),
    roundingMode: safe.roundingMode,
    defaultActiveOnly: safe.defaultActiveOnly,
    defaultExcludeLocked: safe.defaultExcludeLocked,
  };
}

function buildBatchForm(config) {
  const safe = normalizePricingConfig(config);
  return {
    label: "",
    mode: PRICE_BATCH_MODE_PERCENT,
    value: "",
    roundingStep: String(safe.roundingStep),
    roundingMode: safe.roundingMode,
    notes: "",
    activeOnly: safe.defaultActiveOnly,
    excludeLocked: safe.defaultExcludeLocked,
    categorySlug: "",
    brandQuery: "",
  };
}

function toDraft(form, pricingConfig) {
  const safe = normalizePricingConfig(pricingConfig);
  return {
    label: String(form.label || "").trim() || "Remarcacion general",
    mode: form.mode,
    value: form.value === "" ? 0 : Number(form.value),
    roundingStep: form.roundingStep === "" ? safe.roundingStep : Number(form.roundingStep),
    roundingMode: form.roundingMode || safe.roundingMode,
    notes: String(form.notes || "").trim(),
    filters: {
      activeOnly: Boolean(form.activeOnly),
      excludeLocked: Boolean(form.excludeLocked),
      categorySlug: String(form.categorySlug || "").trim(),
      brandQuery: String(form.brandQuery || "").trim(),
    },
  };
}

function statusMeta(status) {
  if (status === PRICE_BATCH_STATUS_APPLIED) {
    return "bg-emerald-500/15 text-emerald-200";
  }
  if (status === PRICE_BATCH_STATUS_ROLLED_BACK) {
    return "bg-amber-500/15 text-amber-200";
  }
  return "bg-white/10 text-white/60";
}

export default function PricingAdmin() {
  const { user } = useAuth();
  const { businessConfig } = useBusinessConfig();
  const { pricingConfig } = usePricingConfig();
  const { products } = useProducts();
  const { offers } = useOffers();
  const { categories } = useCategories();
  const { batches, loading: batchesLoading } = usePriceBatches();
  const [businessForm, setBusinessForm] = useState(() => buildBusinessForm(businessConfig));
  const [pricingForm, setPricingForm] = useState(() => buildPricingForm(pricingConfig));
  const [batchForm, setBatchForm] = useState(() => buildBatchForm(pricingConfig));
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setBusinessForm(buildBusinessForm(businessConfig));
  }, [businessConfig]);

  useEffect(() => {
    setPricingForm(buildPricingForm(pricingConfig));
    setBatchForm((prev) => ({
      ...prev,
      roundingStep: prev.roundingStep || String(pricingConfig.roundingStep),
      roundingMode: prev.roundingMode || pricingConfig.roundingMode,
    }));
  }, [pricingConfig]);

  const draft = useMemo(() => toDraft(batchForm, pricingConfig), [batchForm, pricingConfig]);
  const preview = useMemo(
    () => buildPriceBatchPreview({ products, offers, draft, pricingConfig }),
    [products, offers, draft, pricingConfig]
  );

  const saveBusiness = async () => {
    setMessage("");
    setError("");
    setSaving("business");
    try {
      await setDoc(
        doc(db, "config", "business"),
        {
          ...normalizeBusinessConfig(businessForm),
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || "system",
        },
        { merge: true }
      );
      setMessage("Contacto comercial actualizado.");
    } catch (err) {
      setError(err.message || "No se pudo guardar el contacto.");
    } finally {
      setSaving("");
    }
  };

  const savePricing = async () => {
    setMessage("");
    setError("");
    setSaving("pricing");
    try {
      await setDoc(
        doc(db, "config", "pricing"),
        {
          ...normalizePricingConfig({
            roundingStep: Number(pricingForm.roundingStep || 0),
            roundingMode: pricingForm.roundingMode,
            defaultActiveOnly: pricingForm.defaultActiveOnly,
            defaultExcludeLocked: pricingForm.defaultExcludeLocked,
          }),
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || "system",
        },
        { merge: true }
      );
      setMessage("Politica de pricing actualizada.");
    } catch (err) {
      setError(err.message || "No se pudo guardar la politica.");
    } finally {
      setSaving("");
    }
  };

  const applyBatch = async () => {
    setMessage("");
    setError("");
    if (preview.readyItems.length === 0) {
      setError("La simulacion no genero cambios.");
      return;
    }
    if (preview.readyItems.length > CLIENT_APPLY_LIMIT) {
      setError(`La UI solo aplica hasta ${CLIENT_APPLY_LIMIT} productos. Usa el script para lotes grandes.`);
      return;
    }
    if (!window.confirm(`Aplicar ${preview.readyItems.length} cambios con la etiqueta "${preview.draft.label}"?`)) {
      return;
    }

    setSaving("batch");
    try {
      const batchRef = doc(collection(db, "price_batches"));
      const wb = writeBatch(db);
      wb.set(batchRef, {
        label: preview.draft.label,
        mode: preview.draft.mode,
        value: Number(preview.draft.value || 0),
        roundingStep: Number(preview.draft.roundingStep || 0),
        roundingMode: preview.draft.roundingMode,
        notes: preview.draft.notes,
        filters: preview.draft.filters,
        summary: preview.summary,
        status: PRICE_BATCH_STATUS_APPLIED,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || "system",
        appliedAt: serverTimestamp(),
        appliedBy: user?.uid || "system",
      });
      for (const item of preview.readyItems) {
        wb.set(doc(collection(db, "price_batches", batchRef.id, "items"), item.productId), {
          productId: item.productId,
          nombre: item.nombre,
          currentPrice: item.currentPrice,
          nextPrice: item.nextPrice,
          delta: item.delta,
          deltaPct: item.deltaPct,
          fixedPriceOfferTitles: item.fixedPriceOffers.map((offer) => offer.titulo || offer.id || "Oferta"),
          createdAt: serverTimestamp(),
        });
        wb.update(doc(db, "products", item.productId), {
          precio: item.nextPrice,
          lastPriceBatchId: batchRef.id,
          lastPriceUpdatedAt: serverTimestamp(),
          lastPriceUpdatedBy: user?.uid || "system",
          updatedAt: serverTimestamp(),
        });
      }
      await wb.commit();
      setBatchForm(buildBatchForm(pricingConfig));
      setMessage(`Remarcacion aplicada en ${preview.readyItems.length} productos.`);
    } catch (err) {
      setError(err.message || "No se pudo aplicar el lote.");
    } finally {
      setSaving("");
    }
  };

  const rollbackBatch = async (batchItem) => {
    setMessage("");
    setError("");
    const snapshot = await getDocs(collection(db, "price_batches", batchItem.id, "items"));
    const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    if (items.length === 0) {
      setError("Ese lote no tiene items guardados.");
      return;
    }
    if (items.length > CLIENT_APPLY_LIMIT) {
      setError(`La UI solo revierte hasta ${CLIENT_APPLY_LIMIT} productos. Usa el script para este rollback.`);
      return;
    }
    if (!window.confirm(`Revertir el lote "${batchItem.label || batchItem.id}"?`)) {
      return;
    }

    setSaving(batchItem.id);
    try {
      const wb = writeBatch(db);
      for (const item of items) {
        wb.update(doc(db, "products", item.productId), {
          precio: Number(item.currentPrice || 0),
          lastPriceBatchId: batchItem.id,
          lastPriceUpdatedAt: serverTimestamp(),
          lastPriceUpdatedBy: user?.uid || "system",
          updatedAt: serverTimestamp(),
        });
      }
      wb.update(doc(db, "price_batches", batchItem.id), {
        status: PRICE_BATCH_STATUS_ROLLED_BACK,
        rolledBackAt: serverTimestamp(),
        rolledBackBy: user?.uid || "system",
        updatedAt: serverTimestamp(),
      });
      await wb.commit();
      setMessage(`Lote ${batchItem.label || batchItem.id} revertido.`);
    } catch (err) {
      setError(err.message || "No se pudo revertir el lote.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Contacto</p>
            <h2 className="text-2xl font-semibold mt-2">Configuracion comercial</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={businessForm.phoneDisplay} onChange={(event) => setBusinessForm((prev) => ({ ...prev, phoneDisplay: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Telefono visible" />
            <input value={businessForm.phoneE164} onChange={(event) => setBusinessForm((prev) => ({ ...prev, phoneE164: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Telefono E.164" />
            <input value={businessForm.whatsappDigits} onChange={(event) => setBusinessForm((prev) => ({ ...prev, whatsappDigits: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="WhatsApp digitos" />
            <input value={businessForm.supportEmail} onChange={(event) => setBusinessForm((prev) => ({ ...prev, supportEmail: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Email soporte" />
          </div>
          <input value={businessForm.address} onChange={(event) => setBusinessForm((prev) => ({ ...prev, address: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Direccion" />
          <input value={businessForm.mapsEmbedUrl} onChange={(event) => setBusinessForm((prev) => ({ ...prev, mapsEmbedUrl: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Google Maps embed URL" />
          <textarea value={businessForm.whatsappMessageTemplate} onChange={(event) => setBusinessForm((prev) => ({ ...prev, whatsappMessageTemplate: event.target.value }))} className="min-h-[100px] rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Template de WhatsApp" />
          <button type="button" onClick={saveBusiness} disabled={saving === "business"} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0B1020] disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving === "business" ? "Guardando..." : "Guardar contacto"}
          </button>
        </div>

        <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pricing</p>
            <h2 className="text-2xl font-semibold mt-2">Politica por defecto</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input type="number" min="0.01" step="0.01" value={pricingForm.roundingStep} onChange={(event) => setPricingForm((prev) => ({ ...prev, roundingStep: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Paso de redondeo" />
            <select value={pricingForm.roundingMode} onChange={(event) => setPricingForm((prev) => ({ ...prev, roundingMode: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none">
              {PRICE_ROUNDING_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input type="checkbox" checked={pricingForm.defaultActiveOnly} onChange={(event) => setPricingForm((prev) => ({ ...prev, defaultActiveOnly: event.target.checked }))} className="accent-cyan-400" />
            Filtrar activos por defecto
          </label>
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input type="checkbox" checked={pricingForm.defaultExcludeLocked} onChange={(event) => setPricingForm((prev) => ({ ...prev, defaultExcludeLocked: event.target.checked }))} className="accent-cyan-400" />
            Excluir precios bloqueados por defecto
          </label>
          <button type="button" onClick={savePricing} disabled={saving === "pricing"} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0B1020] disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving === "pricing" ? "Guardando..." : "Guardar politica"}
          </button>
          <p className="text-xs text-white/50">
            La UI aplica lotes chicos de forma atomica. Para lotes grandes, usa `node scripts/repriceProducts.js` y `node scripts/rollbackPriceBatch.js`.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Batch</p>
          <h2 className="text-2xl font-semibold mt-2">Simular remarcacion</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input value={batchForm.label} onChange={(event) => setBatchForm((prev) => ({ ...prev, label: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Etiqueta" />
          <select value={batchForm.mode} onChange={(event) => setBatchForm((prev) => ({ ...prev, mode: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none">
            {PRICE_BATCH_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>
          <input type="number" step="0.01" value={batchForm.value} onChange={(event) => setBatchForm((prev) => ({ ...prev, value: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Valor" />
          <input type="number" min="0.01" step="0.01" value={batchForm.roundingStep} onChange={(event) => setBatchForm((prev) => ({ ...prev, roundingStep: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Paso de redondeo" />
          <select value={batchForm.roundingMode} onChange={(event) => setBatchForm((prev) => ({ ...prev, roundingMode: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none">
            {PRICE_ROUNDING_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>
          <select value={batchForm.categorySlug} onChange={(event) => setBatchForm((prev) => ({ ...prev, categorySlug: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none">
            <option value="">Todas las categorias</option>
            {categories.filter((category) => category.activo !== false).map((category) => (
              <option key={category.id} value={category.slug || category.id}>{category.nombre}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <input value={batchForm.brandQuery} onChange={(event) => setBatchForm((prev) => ({ ...prev, brandQuery: event.target.value }))} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Filtrar por marca" />
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <input type="checkbox" checked={batchForm.activeOnly} onChange={(event) => setBatchForm((prev) => ({ ...prev, activeOnly: event.target.checked }))} className="accent-cyan-400" />
            Solo activos
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <input type="checkbox" checked={batchForm.excludeLocked} onChange={(event) => setBatchForm((prev) => ({ ...prev, excludeLocked: event.target.checked }))} className="accent-cyan-400" />
            Excluir bloqueados
          </label>
        </div>
        <textarea value={batchForm.notes} onChange={(event) => setBatchForm((prev) => ({ ...prev, notes: event.target.value }))} className="min-h-[80px] rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Notas internas" />

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Coinciden</p>
            <p className="text-xl font-semibold mt-1">{preview.summary.matchedCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Cambian</p>
            <p className="text-xl font-semibold mt-1">{preview.summary.changedCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Bloqueados</p>
            <p className="text-xl font-semibold mt-1">{preview.summary.lockedCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Impacto</p>
            <p className="text-lg font-semibold mt-1">{formatCurrency(preview.summary.totalDelta)}</p>
          </div>
        </div>

        {preview.summary.fixedPriceOfferWarnings > 0 && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {preview.summary.fixedPriceOfferWarnings} producto(s) tienen ofertas de precio fijo activas.
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={applyBatch} disabled={saving === "batch" || preview.readyItems.length === 0} className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0B1020] disabled:opacity-60">
            {saving === "batch" ? "Aplicando..." : "Aplicar lote"}
          </button>
          <button type="button" onClick={() => setBatchForm(buildBatchForm(pricingConfig))} className="rounded-2xl border border-white/15 px-5 py-3 text-sm uppercase tracking-[0.2em] text-white/70 hover:bg-white/10">
            Resetear
          </button>
        </div>

        <div className="space-y-3">
          {preview.items.slice(0, 12).map((item) => (
            <div key={`${item.productId}-${item.status}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{item.nombre}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                    {item.categorySlug || "sin categoria"} {item.marca ? `- ${item.marca}` : ""}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] ${
                  item.status === "ready" ? "bg-emerald-500/15 text-emerald-200" : item.status === "noop" ? "bg-white/10 text-white/60" : "bg-amber-500/15 text-amber-200"
                }`}>
                  {item.status === "ready" ? "Cambia" : item.status === "noop" ? "Sin cambio" : item.status === "skipped_locked" ? "Bloqueado" : "Sin costo"}
                </span>
              </div>
              <p className="mt-2 text-sm">
                {formatCurrency(item.currentPrice)} → <span className="font-semibold">{formatCurrency(item.nextPrice)}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur-xl space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Historial</p>
          <h2 className="text-2xl font-semibold mt-2">Lotes aplicados</h2>
        </div>
        {batchesLoading ? (
          <div className="py-10 text-sm text-white/50">Cargando historial...</div>
        ) : batches.length === 0 ? (
          <div className="py-10 text-sm text-white/50">Todavia no hay remarcaciones registradas.</div>
        ) : (
          <div className="space-y-3">
            {batches.map((batchItem) => (
              <div key={batchItem.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{batchItem.label || "Lote sin nombre"}</p>
                    <p className="text-xs text-white/50">
                      {formatDateTime(batchItem.createdAt)} · {batchItem.summary?.changedCount || 0} cambios · impacto {formatCurrency(batchItem.summary?.totalDelta || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] ${statusMeta(batchItem.status)}`}>
                      {batchItem.status === PRICE_BATCH_STATUS_ROLLED_BACK ? "Revertido" : "Aplicado"}
                    </span>
                    {batchItem.status === PRICE_BATCH_STATUS_APPLIED && (
                      <button type="button" onClick={() => rollbackBatch(batchItem)} disabled={saving === batchItem.id} className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 px-3 py-2 text-xs uppercase tracking-[0.2em] text-amber-100 hover:bg-amber-500/10 disabled:opacity-60">
                        <RotateCcw className="w-3.5 h-3.5" />
                        {saving === batchItem.id ? "Revirtiendo..." : "Rollback"}
                      </button>
                    )}
                  </div>
                </div>
                {batchItem.notes && <p className="mt-3 text-sm text-white/60">{batchItem.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}
      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    </div>
  );
}
