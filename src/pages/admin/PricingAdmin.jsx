import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  TrendingUp,
} from "lucide-react";
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
  PRICE_BATCH_MODE_DELTA,
  PRICE_BATCH_MODE_MARGIN,
  PRICE_BATCH_MODE_PERCENT,
  PRICE_BATCH_STATUS_APPLIED,
  PRICE_BATCH_STATUS_ROLLED_BACK,
} from "@/utils/pricingEngine";

// ─── Constantes ───────────────────────────────────────────────────────────────
const CLIENT_APPLY_LIMIT = 200;

const STEPS_META = [
  { id: 1, label: "¿Qué hacer?" },
  { id: 2, label: "Productos" },
  { id: 3, label: "Precios finales" },
  { id: 4, label: "Confirmar" },
];

const MODES = [
  {
    id: PRICE_BATCH_MODE_PERCENT,
    Icon: TrendingUp,
    title: "Subir o bajar un porcentaje",
    desc: 'Ej: "Subo todos los precios un 15%"',
    hasSign: true,
    unit: "%",
    placeholder: "15",
  },
  {
    id: PRICE_BATCH_MODE_DELTA,
    Icon: Plus,
    title: "Sumar o restar un monto fijo",
    desc: 'Ej: "A todos les sumo $500"',
    hasSign: true,
    unit: "$",
    placeholder: "500",
  },
  {
    id: PRICE_BATCH_MODE_MARGIN,
    Icon: BadgeDollarSign,
    title: "Calcular desde el costo de compra",
    desc: 'Ej: "Costo + 40% de ganancia"',
    hasSign: false,
    unit: "% ganancia",
    placeholder: "40",
  },
];

const ROUNDING_PRESETS = [
  { id: "0", label: "Precio exacto", note: "Sin redondeo", example: "$1.237,50" },
  { id: "50", label: "Terminar en $50", note: "Múltiplos de $50", example: "$1.250 / $1.300" },
  {
    id: "100",
    label: "Terminar en $100",
    note: "La más usada",
    example: "$1.200 / $1.300",
    recommended: true,
  },
  {
    id: "1000",
    label: "Terminar en $1.000",
    note: "Para precios grandes",
    example: "$1.000 / $2.000",
  },
];

const ROUNDING_DIRS = [
  { id: "up", label: "Hacia arriba", note: "Siempre redondear para arriba", recommended: true },
  { id: "nearest", label: "Al más cercano", note: "El múltiplo más próximo" },
  { id: "down", label: "Hacia abajo", note: "Siempre redondear para abajo" },
];

// ─── Helpers puros ────────────────────────────────────────────────────────────
function fmtCurrency(value) {
  return Number(value || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtDateTime(value) {
  if (!value) return "-";
  if (typeof value.toDate === "function") return value.toDate().toLocaleString("es-AR");
  if (typeof value.seconds === "number")
    return new Date(value.seconds * 1000).toLocaleString("es-AR");
  return "-";
}

function getValueHint(mode, sign, valueStr) {
  const val = parseFloat(valueStr) || 0;
  if (val === 0) return "";
  const samplePrice = 10000;
  const sampleCost = 5000;
  if (mode === PRICE_BATCH_MODE_PERCENT) {
    const result = samplePrice * (sign === "+" ? 1 + val / 100 : 1 - val / 100);
    return `Precio de ${fmtCurrency(samplePrice)} → ${fmtCurrency(result)}`;
  }
  if (mode === PRICE_BATCH_MODE_DELTA) {
    const delta = sign === "+" ? val : -val;
    return `Precio de ${fmtCurrency(samplePrice)} → ${fmtCurrency(samplePrice + delta)}`;
  }
  if (mode === PRICE_BATCH_MODE_MARGIN) {
    return `Costo ${fmtCurrency(sampleCost)} → precio ${fmtCurrency(sampleCost * (1 + val / 100))}`;
  }
  return "";
}

function getSummaryAction(mode, sign, valueStr) {
  const val = parseFloat(valueStr) || 0;
  if (mode === PRICE_BATCH_MODE_PERCENT) {
    return sign === "+" ? `Subir ${val}% los precios` : `Bajar ${val}% los precios`;
  }
  if (mode === PRICE_BATCH_MODE_DELTA) {
    return sign === "+"
      ? `Sumar ${fmtCurrency(val)} a cada precio`
      : `Restar ${fmtCurrency(val)} de cada precio`;
  }
  return `Precio = costo + ${val}% de ganancia`;
}

function getSummaryScope(scope, categorySlug, brandQuery, excludeLocked, categories) {
  let base;
  if (scope === "all") base = "todos los productos";
  else if (scope === "active") base = "solo los productos en venta";
  else if (scope === "category") {
    const cat = categories.find((c) => (c.slug || c.id) === categorySlug);
    base = `categoría: ${cat?.nombre || categorySlug}`;
  } else {
    base = `marca: ${brandQuery}`;
  }
  if (excludeLocked) base += " · sin tocar precios fijos";
  return base;
}

function getSummaryRounding(roundingPreset, roundingDir) {
  if (roundingPreset === "0") return "Precio exacto (sin redondeo)";
  const preset = ROUNDING_PRESETS.find((p) => p.id === roundingPreset);
  const dir = ROUNDING_DIRS.find((d) => d.id === roundingDir);
  return `${preset?.label || "$" + roundingPreset}, ${dir?.label?.toLowerCase() || ""}`;
}

function getBatchDescription(batch) {
  const mode = batch.mode;
  const val = batch.value;
  if (mode === PRICE_BATCH_MODE_PERCENT)
    return val >= 0 ? `+${val}%` : `${val}%`;
  if (mode === PRICE_BATCH_MODE_DELTA)
    return val >= 0 ? `+${fmtCurrency(val)}` : fmtCurrency(val);
  if (mode === PRICE_BATCH_MODE_MARGIN)
    return `Costo +${val}% ganancia`;
  return "";
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PricingAdmin() {
  const { user } = useAuth();
  const { businessConfig } = useBusinessConfig();
  const { pricingConfig } = usePricingConfig();
  const { products } = useProducts();
  const { offers } = useOffers();
  const { categories } = useCategories();
  const { batches, loading: batchesLoading } = usePriceBatches();

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState(PRICE_BATCH_MODE_PERCENT);
  const [sign, setSign] = useState("+");
  const [valueStr, setValueStr] = useState("");
  const [scope, setScope] = useState("active");
  const [categorySlug, setCategorySlug] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [excludeLocked, setExcludeLocked] = useState(true);
  const [roundingPreset, setRoundingPreset] = useState("100");
  const [roundingDir, setRoundingDir] = useState("up");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");

  // ── Business config form ──────────────────────────────────────────────────
  const [businessForm, setBusinessForm] = useState(() => buildBusinessForm(businessConfig));
  const [showBizConfig, setShowBizConfig] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setBusinessForm(buildBusinessForm(businessConfig));
  }, [businessConfig]);

  // ── Draft desde el wizard ──────────────────────────────────────────────────
  const wizardDraft = useMemo(() => {
    const rawVal = parseFloat(valueStr) || 0;
    const signedVal =
      mode === PRICE_BATCH_MODE_MARGIN ? rawVal : sign === "-" ? -rawVal : rawVal;
    return {
      label: label.trim() || "Remarcación general",
      mode,
      value: signedVal,
      roundingStep: parseInt(roundingPreset, 10) || 0,
      roundingMode: roundingDir,
      notes: notes.trim(),
      filters: {
        activeOnly: scope !== "all",
        excludeLocked,
        categorySlug: scope === "category" ? categorySlug : "",
        brandQuery: scope === "brand" ? brandQuery.toLowerCase().trim() : "",
      },
    };
  }, [mode, sign, valueStr, scope, categorySlug, brandQuery, excludeLocked, roundingPreset, roundingDir, label, notes]);

  // ── Preview en tiempo real ────────────────────────────────────────────────
  const preview = useMemo(
    () => buildPriceBatchPreview({ products, offers, draft: wizardDraft, pricingConfig }),
    [products, offers, wizardDraft, pricingConfig]
  );

  const valueHint = useMemo(() => getValueHint(mode, sign, valueStr), [mode, sign, valueStr]);
  const activeModeData = MODES.find((m) => m.id === mode);

  // ── Validación por paso ───────────────────────────────────────────────────
  function canGoNext() {
    if (step === 1) return parseFloat(valueStr) > 0;
    if (step === 2) return scope !== "category" || categorySlug !== "";
    return true;
  }

  // ── Reset wizard ──────────────────────────────────────────────────────────
  function resetWizard() {
    setStep(1);
    setMode(PRICE_BATCH_MODE_PERCENT);
    setSign("+");
    setValueStr("");
    setScope("active");
    setCategorySlug("");
    setBrandQuery("");
    setExcludeLocked(true);
    setRoundingPreset("100");
    setRoundingDir("up");
    setLabel("");
    setNotes("");
  }

  // ── Aplicar remarcación ───────────────────────────────────────────────────
  const applyBatch = async () => {
    setMessage("");
    setError("");
    if (preview.readyItems.length === 0) {
      setError("No hay precios para actualizar con la configuración actual.");
      return;
    }
    if (preview.readyItems.length > CLIENT_APPLY_LIMIT) {
      setError(`Solo se pueden actualizar hasta ${CLIENT_APPLY_LIMIT} productos a la vez.`);
      return;
    }
    if (!window.confirm(`¿Confirmás actualizar ${preview.readyItems.length} precios?`)) return;

    setSaving("batch");
    try {
      const batchRef = doc(collection(db, "price_batches"));
      const wb = writeBatch(db);
      wb.set(batchRef, {
        label: wizardDraft.label,
        mode: wizardDraft.mode,
        value: Number(wizardDraft.value || 0),
        roundingStep: Number(wizardDraft.roundingStep || 0),
        roundingMode: wizardDraft.roundingMode,
        notes: wizardDraft.notes,
        filters: wizardDraft.filters,
        summary: preview.summary,
        status: PRICE_BATCH_STATUS_APPLIED,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || "system",
        appliedAt: serverTimestamp(),
        appliedBy: user?.uid || "system",
      });
      for (const item of preview.readyItems) {
        wb.set(
          doc(collection(db, "price_batches", batchRef.id, "items"), item.productId),
          {
            productId: item.productId,
            nombre: item.nombre,
            currentPrice: item.currentPrice,
            nextPrice: item.nextPrice,
            delta: item.delta,
            deltaPct: item.deltaPct,
            fixedPriceOfferTitles: item.fixedPriceOffers.map((o) => o.titulo || o.id || "Oferta"),
            createdAt: serverTimestamp(),
          }
        );
        wb.update(doc(db, "products", item.productId), {
          precio: item.nextPrice,
          lastPriceBatchId: batchRef.id,
          lastPriceUpdatedAt: serverTimestamp(),
          lastPriceUpdatedBy: user?.uid || "system",
          updatedAt: serverTimestamp(),
        });
      }
      await wb.commit();
      resetWizard();
      setMessage(`Listo. ${preview.readyItems.length} precios actualizados correctamente.`);
    } catch (err) {
      setError(err.message || "No se pudo aplicar la remarcación.");
    } finally {
      setSaving("");
    }
  };

  // ── Deshacer remarcación ──────────────────────────────────────────────────
  const rollbackBatch = async (batchItem) => {
    setMessage("");
    setError("");
    const snapshot = await getDocs(collection(db, "price_batches", batchItem.id, "items"));
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (items.length === 0) {
      setError("Este historial no tiene los precios anteriores guardados.");
      return;
    }
    if (items.length > CLIENT_APPLY_LIMIT) {
      setError(`Solo se pueden deshacer hasta ${CLIENT_APPLY_LIMIT} productos a la vez.`);
      return;
    }
    if (
      !window.confirm(
        `¿Deshacer la remarcación "${batchItem.label || batchItem.id}"?\nEsto restaurará los precios anteriores.`
      )
    )
      return;

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
      setMessage(`La remarcación "${batchItem.label}" fue deshecha. Precios anteriores restaurados.`);
    } catch (err) {
      setError(err.message || "No se pudo deshacer la remarcación.");
    } finally {
      setSaving("");
    }
  };

  // ── Guardar datos del negocio ─────────────────────────────────────────────
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
      setMessage("Datos del negocio actualizados.");
    } catch (err) {
      setError(err.message || "No se pudo guardar.");
    } finally {
      setSaving("");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Gestión de precios</p>
        <h1 className="text-3xl font-semibold mt-1">Actualizar precios</h1>
        <p className="text-sm text-white/40 mt-1">
          Subí, bajá o ajustá precios de varios productos a la vez — con previsualización antes de confirmar.
        </p>
      </div>

      {/* ── Mensajes ── */}
      {message && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          <Check className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          WIZARD CARD
      ══════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 space-y-8">

        {/* ── Indicador de pasos ── */}
        <div className="flex items-center">
          {STEPS_META.map((s, idx) => (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex items-center gap-2 ${s.id < step ? "cursor-pointer" : "cursor-default"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    step > s.id
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : step === s.id
                      ? "bg-white border-white text-[#0B1020]"
                      : "border-white/20 text-white/30"
                  }`}
                >
                  {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    step === s.id
                      ? "text-white"
                      : step > s.id
                      ? "text-emerald-400"
                      : "text-white/30"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {idx < STEPS_META.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 transition-colors ${
                    step > s.id ? "bg-emerald-500/40" : "bg-white/10"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ════════════════════════════════════
            PASO 1 — ¿Qué querés hacer?
        ════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">¿Qué querés hacer con los precios?</h2>
              <p className="text-sm text-white/40 mt-1">Elegí cómo calcular los nuevos precios.</p>
            </div>

            {/* Tarjetas de modo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODES.map((m) => {
                const Icon = m.Icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id);
                      setSign("+");
                      setValueStr("");
                    }}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-cyan-400/60 bg-cyan-400/10 shadow-lg shadow-cyan-400/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                        isSelected ? "bg-cyan-400/20" : "bg-white/10"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isSelected ? "text-cyan-300" : "text-white/50"}`}
                      />
                    </div>
                    <p className={`text-sm font-semibold mb-1 ${isSelected ? "text-white" : "text-white/80"}`}>
                      {m.title}
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed">{m.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Input de valor */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <p className="text-sm font-medium text-white/70">
                {mode === PRICE_BATCH_MODE_PERCENT && "¿Cuánto porcentaje querés mover?"}
                {mode === PRICE_BATCH_MODE_DELTA && "¿Cuánto monto fijo querés sumar o restar?"}
                {mode === PRICE_BATCH_MODE_MARGIN && "¿Cuánto margen de ganancia sobre el costo?"}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle +/- */}
                {activeModeData?.hasSign && (
                  <div className="flex rounded-xl overflow-hidden border border-white/15">
                    <button
                      type="button"
                      onClick={() => setSign("+")}
                      className={`w-12 h-12 text-lg font-bold transition-colors ${
                        sign === "+"
                          ? "bg-emerald-500 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setSign("-")}
                      className={`w-12 h-12 text-lg font-bold transition-colors ${
                        sign === "-"
                          ? "bg-rose-500 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      −
                    </button>
                  </div>
                )}

                {/* Input */}
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valueStr}
                    onChange={(e) => setValueStr(e.target.value)}
                    placeholder={activeModeData?.placeholder || "0"}
                    className="w-40 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-lg font-semibold text-white outline-none focus:border-cyan-400/60 pr-14"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 pointer-events-none">
                    {activeModeData?.unit}
                  </span>
                </div>
              </div>

              {/* Hint dinámico */}
              {valueHint && (
                <div className="flex items-center gap-2 text-sm text-cyan-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  {valueHint}
                </div>
              )}

              {/* Advertencia modo margen */}
              {mode === PRICE_BATCH_MODE_MARGIN && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                  <p className="text-xs text-amber-200 leading-relaxed">
                    <strong>Atención:</strong> Este modo solo actualiza los productos que tienen el
                    costo de compra cargado. Los que no tienen costo registrado quedarán sin cambios.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            PASO 2 — ¿A qué productos?
        ════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">¿A cuáles productos aplicar?</h2>
              <p className="text-sm text-white/40 mt-1">
                Podés aplicar a todo el catálogo o filtrar por categoría o marca.
              </p>
            </div>

            {/* Opciones de alcance */}
            <div className="space-y-3">
              {[
                { id: "all", label: "A todos los productos", note: "Activos e inactivos" },
                { id: "active", label: "Solo los que están en venta", note: "Solo productos activos" },
                { id: "category", label: "Solo una categoría", note: "Elegís cuál a continuación" },
                { id: "brand", label: "Solo una marca específica", note: "Escribís el nombre a continuación" },
              ].map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    scope === option.id
                      ? "border-cyan-400/60 bg-cyan-400/10"
                      : "border-white/10 bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      scope === option.id ? "border-cyan-400" : "border-white/30"
                    }`}
                  >
                    {scope === option.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="scope"
                    value={option.id}
                    checked={scope === option.id}
                    onChange={() => setScope(option.id)}
                    className="sr-only"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{option.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{option.note}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Dropdown de categoría */}
            {scope === "category" && (
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">— Elegí una categoría —</option>
                {categories
                  .filter((c) => c.activo !== false)
                  .map((cat) => (
                    <option key={cat.id} value={cat.slug || cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
              </select>
            )}

            {/* Input de marca */}
            {scope === "brand" && (
              <input
                type="text"
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder='Ej: Samsung, Apple, Xiaomi...'
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              />
            )}

            {/* Precio fijo */}
            <div className="border-t border-white/10 pt-4">
              <label
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  excludeLocked
                    ? "border-violet-400/40 bg-violet-400/8"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    excludeLocked ? "border-violet-400 bg-violet-400" : "border-white/30"
                  }`}
                >
                  {excludeLocked && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={excludeLocked}
                  onChange={(e) => setExcludeLocked(e.target.checked)}
                  className="sr-only"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    No tocar los productos con precio fijo
                  </p>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                    Son los que marcaste individualmente como "precio especial" o "precio bloqueado"
                    en el módulo de productos.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            PASO 3 — ¿Cómo terminan los precios?
        ════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">¿Cómo querés que terminen los precios?</h2>
              <p className="text-sm text-white/40 mt-1">
                El redondeo hace que los precios queden prolijos, sin centavos ni números raros.
              </p>
            </div>

            {/* Presets de redondeo */}
            <div className="space-y-3">
              {ROUNDING_PRESETS.map((preset) => (
                <label
                  key={preset.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    roundingPreset === preset.id
                      ? "border-cyan-400/60 bg-cyan-400/10"
                      : "border-white/10 bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      roundingPreset === preset.id ? "border-cyan-400" : "border-white/30"
                    }`}
                  >
                    {roundingPreset === preset.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="rounding"
                    value={preset.id}
                    checked={roundingPreset === preset.id}
                    onChange={() => setRoundingPreset(preset.id)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{preset.label}</span>
                      {preset.recommended && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-[10px] text-cyan-300 uppercase tracking-[0.1em]">
                          Recomendada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                      {preset.note} · Ej: {preset.example}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Dirección de redondeo */}
            {roundingPreset !== "0" && (
              <div className="space-y-3">
                <p className="text-sm text-white/60 font-medium">
                  Cuando el número no cierra exacto:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ROUNDING_DIRS.map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => setRoundingDir(dir.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        roundingDir === dir.id
                          ? "border-cyan-400/60 bg-cyan-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{dir.label}</p>
                      <p className="text-xs text-white/40 mt-1">{dir.note}</p>
                      {dir.recommended && roundingDir === dir.id && (
                        <span className="mt-2 inline-block px-2 py-0.5 rounded-full bg-cyan-400/20 text-[10px] text-cyan-300 uppercase tracking-[0.1em]">
                          Recomendado
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            PASO 4 — Confirmar
        ════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Revisá antes de confirmar</h2>
              <p className="text-sm text-white/40 mt-1">
                Verificá que todo esté bien. Este cambio se puede deshacer desde el historial.
              </p>
            </div>

            {/* Resumen de configuración */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">
                Resumen de la remarcación
              </p>
              {[
                {
                  label: "Qué vas a hacer",
                  value: getSummaryAction(mode, sign, valueStr),
                },
                {
                  label: "A qué productos",
                  value: getSummaryScope(scope, categorySlug, brandQuery, excludeLocked, categories),
                },
                {
                  label: "Redondeo",
                  value: getSummaryRounding(roundingPreset, roundingDir),
                },
              ].map((row) => (
                <div key={row.label} className="flex gap-3 text-sm">
                  <span className="text-white/40 w-32 shrink-0">{row.label}</span>
                  <span className="text-white font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.15em] text-emerald-300/60">
                  Van a cambiar
                </p>
                <p className="text-3xl font-bold text-emerald-300 mt-1">
                  {preview.summary.changedCount}
                </p>
                <p className="text-xs text-white/30 mt-0.5">productos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.15em] text-white/40">Sin cambio</p>
                <p className="text-3xl font-bold text-white/50 mt-1">
                  {preview.summary.noopCount}
                </p>
                <p className="text-xs text-white/30 mt-0.5">ya tienen ese precio</p>
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.15em] text-violet-300/60">
                  No se tocan
                </p>
                <p className="text-3xl font-bold text-violet-300 mt-1">
                  {preview.summary.lockedCount}
                </p>
                <p className="text-xs text-white/30 mt-0.5">precio fijo</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.15em] text-cyan-300/60">
                  Diferencia total
                </p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    preview.summary.totalDelta >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {preview.summary.totalDelta >= 0 ? "+" : ""}
                  {fmtCurrency(preview.summary.totalDelta)}
                </p>
                <p className="text-xs text-white/30 mt-0.5">en el catálogo</p>
              </div>
            </div>

            {/* Antes / Después */}
            {preview.summary.changedCount > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-4">
                  Impacto en el catálogo (productos que cambian)
                </p>
                <div className="grid grid-cols-3 gap-4 text-center items-center">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Precio actual</p>
                    <p className="text-lg font-semibold text-white/60">
                      {fmtCurrency(preview.summary.totalCurrent)}
                    </p>
                  </div>
                  <div className="text-white/20 text-2xl">→</div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Precio nuevo</p>
                    <p className="text-xl font-bold text-white">
                      {fmtCurrency(preview.summary.totalNext)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Advertencia ofertas de precio fijo */}
            {preview.summary.fixedPriceOfferWarnings > 0 && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                ⚠️ {preview.summary.fixedPriceOfferWarnings} producto(s) tienen ofertas de precio
                fijo activas. Esos precios pueden quedar por debajo de la oferta activa.
              </div>
            )}

            {/* Sin resultados */}
            {preview.readyItems.length === 0 && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-5 text-center">
                <p className="text-sm text-amber-200 font-medium">
                  No hay precios para actualizar con esta configuración.
                </p>
                <p className="text-xs text-amber-200/60 mt-1">
                  Revisá el valor ingresado y los filtros de productos.
                </p>
              </div>
            )}

            {/* Nombre de la remarcación */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">
                Nombre de esta remarcación{" "}
                <span className="text-white/30">(para el historial)</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder='Ej: "Subida dólar marzo 2026"'
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/40">Nota interna (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Algo que quieras recordar sobre este ajuste..."
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none resize-none"
              />
            </div>

            {/* Lista preview de cambios */}
            {preview.readyItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-[0.2em]">
                  Primeros {Math.min(10, preview.readyItems.length)} de{" "}
                  {preview.readyItems.length} productos que van a cambiar
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 p-3">
                  {preview.readyItems.slice(0, 10).map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.nombre}</p>
                        {item.marca && (
                          <p className="text-xs text-white/40">{item.marca}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-white/40 line-through">
                          {fmtCurrency(item.currentPrice)}
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            item.nextPrice > item.currentPrice
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }`}
                        >
                          {fmtCurrency(item.nextPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Navegación ── */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-[#0B1020] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 transition-all"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={applyBatch}
              disabled={saving === "batch" || preview.readyItems.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-7 py-3 text-sm font-bold text-[#0B1020] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 transition-all shadow-lg shadow-emerald-500/20"
            >
              {saving === "batch" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar y actualizar precios
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          HISTORIAL — "Mis remarcaciones"
      ══════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Historial</p>
          <h2 className="text-2xl font-semibold mt-1">Mis remarcaciones</h2>
          <p className="text-sm text-white/40 mt-1">
            Cada remarcación se puede deshacer — los precios anteriores quedan guardados.
          </p>
        </div>

        {batchesLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando historial...
          </div>
        ) : batches.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/30">
            Todavía no hay remarcaciones registradas. Cuando apliques una aparecerá acá.
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batchItem) => {
              const isApplied = batchItem.status === PRICE_BATCH_STATUS_APPLIED;
              const isRolledBack = batchItem.status === PRICE_BATCH_STATUS_ROLLED_BACK;
              const changedCount = batchItem.summary?.changedCount || 0;
              const totalDelta = batchItem.summary?.totalDelta || 0;

              return (
                <div
                  key={batchItem.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-[0.15em] font-semibold ${
                            isApplied
                              ? "bg-emerald-500/15 text-emerald-300"
                              : isRolledBack
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {isApplied ? "Aplicada" : isRolledBack ? "Deshecha" : batchItem.status}
                        </span>
                        <h3 className="text-sm font-semibold text-white">
                          {batchItem.label || "Remarcación sin nombre"}
                        </h3>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">
                        {fmtDateTime(batchItem.createdAt)}
                        {" · "}
                        {changedCount} producto{changedCount !== 1 ? "s" : ""} cambiados
                        {" · "}
                        {getBatchDescription(batchItem)}
                      </p>
                      {totalDelta !== 0 && (
                        <p
                          className={`text-xs font-medium ${
                            totalDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          Impacto: {totalDelta >= 0 ? "+" : ""}
                          {fmtCurrency(totalDelta)} en el catálogo
                        </p>
                      )}
                      {batchItem.notes && (
                        <p className="text-xs text-white/40 italic">"{batchItem.notes}"</p>
                      )}
                    </div>

                    {isApplied && (
                      <button
                        type="button"
                        onClick={() => rollbackBatch(batchItem)}
                        disabled={saving === batchItem.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-50 transition-all shrink-0"
                      >
                        {saving === batchItem.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Deshaciendo...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            Deshacer remarcación
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          AJUSTES DEL NEGOCIO (colapsable)
      ══════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBizConfig((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 md:px-8 py-5 text-left hover:bg-white/5 transition-colors"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Configuración</p>
            <h2 className="text-lg font-semibold mt-0.5">Datos del negocio</h2>
          </div>
          {showBizConfig ? (
            <ChevronUp className="w-5 h-5 text-white/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40" />
          )}
        </button>

        {showBizConfig && (
          <div className="px-6 md:px-8 pb-8 space-y-4 border-t border-white/10 pt-6">
            <p className="text-sm text-white/40">
              Teléfono, email, dirección y datos de WhatsApp que aparecen en la tienda.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-white/40 uppercase tracking-[0.15em]">
                  Teléfono visible
                </label>
                <input
                  value={businessForm.phoneDisplay}
                  onChange={(e) =>
                    setBusinessForm((prev) => ({ ...prev, phoneDisplay: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40 uppercase tracking-[0.15em]">
                  WhatsApp (solo números)
                </label>
                <input
                  value={businessForm.whatsappDigits}
                  onChange={(e) =>
                    setBusinessForm((prev) => ({ ...prev, whatsappDigits: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  placeholder="5491112345678"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40 uppercase tracking-[0.15em]">Email</label>
                <input
                  value={businessForm.supportEmail}
                  onChange={(e) =>
                    setBusinessForm((prev) => ({ ...prev, supportEmail: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  placeholder="soporte@nexastore.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40 uppercase tracking-[0.15em]">
                  Dirección
                </label>
                <input
                  value={businessForm.address}
                  onChange={(e) =>
                    setBusinessForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Av. Corrientes 2332"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-[0.15em]">
                Google Maps URL (embed)
              </label>
              <input
                value={businessForm.mapsEmbedUrl}
                onChange={(e) =>
                  setBusinessForm((prev) => ({ ...prev, mapsEmbedUrl: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                placeholder="https://www.google.com/maps?q=..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-[0.15em]">
                Mensaje de WhatsApp (plantilla)
              </label>
              <textarea
                value={businessForm.whatsappMessageTemplate}
                onChange={(e) =>
                  setBusinessForm((prev) => ({
                    ...prev,
                    whatsappMessageTemplate: e.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none resize-none"
              />
            </div>
            <button
              type="button"
              onClick={saveBusiness}
              disabled={saving === "business"}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-[#0B1020] disabled:opacity-60 hover:brightness-105 transition-all"
            >
              {saving === "business" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar datos del negocio
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
