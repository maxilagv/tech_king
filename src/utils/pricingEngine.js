import { isOfferEnabled } from "./offers.js";

export const PRICE_BATCH_MODE_PERCENT = "percent";
export const PRICE_BATCH_MODE_FACTOR = "factor";
export const PRICE_BATCH_MODE_DELTA = "delta";
export const PRICE_BATCH_MODE_MARGIN = "margin";

export const PRICE_BATCH_MODES = Object.freeze([
  { value: PRICE_BATCH_MODE_PERCENT, label: "Porcentaje" },
  { value: PRICE_BATCH_MODE_FACTOR, label: "Factor" },
  { value: PRICE_BATCH_MODE_DELTA, label: "Delta fijo" },
  { value: PRICE_BATCH_MODE_MARGIN, label: "Costo + margen" },
]);

export const PRICE_ROUNDING_MODE_NEAREST = "nearest";
export const PRICE_ROUNDING_MODE_UP = "up";
export const PRICE_ROUNDING_MODE_DOWN = "down";

export const PRICE_ROUNDING_MODES = Object.freeze([
  { value: PRICE_ROUNDING_MODE_NEAREST, label: "Al mas cercano" },
  { value: PRICE_ROUNDING_MODE_UP, label: "Siempre hacia arriba" },
  { value: PRICE_ROUNDING_MODE_DOWN, label: "Siempre hacia abajo" },
]);

export const PRICE_BATCH_STATUS_APPLIED = "applied";
export const PRICE_BATCH_STATUS_ROLLED_BACK = "rolled_back";

const DEFAULT_PRICING_CONFIG = Object.freeze({
  roundingStep: 100,
  roundingMode: PRICE_ROUNDING_MODE_NEAREST,
  defaultActiveOnly: true,
  defaultExcludeLocked: true,
});

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function cleanString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizePricingConfig(raw = {}) {
  const roundingStep = toNumber(raw.roundingStep, DEFAULT_PRICING_CONFIG.roundingStep);
  const roundingMode = PRICE_ROUNDING_MODES.some((mode) => mode.value === raw.roundingMode)
    ? raw.roundingMode
    : DEFAULT_PRICING_CONFIG.roundingMode;

  return {
    roundingStep: roundingStep > 0 ? roundingStep : DEFAULT_PRICING_CONFIG.roundingStep,
    roundingMode,
    defaultActiveOnly: normalizeBoolean(raw.defaultActiveOnly, DEFAULT_PRICING_CONFIG.defaultActiveOnly),
    defaultExcludeLocked: normalizeBoolean(
      raw.defaultExcludeLocked,
      DEFAULT_PRICING_CONFIG.defaultExcludeLocked
    ),
  };
}

export function applyRounding(value, { roundingStep, roundingMode }) {
  const safeValue = Math.max(0, toNumber(value, 0));
  const safeStep = toNumber(roundingStep, DEFAULT_PRICING_CONFIG.roundingStep);
  if (!(safeStep > 0)) {
    return Number(safeValue.toFixed(2));
  }

  const units = safeValue / safeStep;
  let roundedUnits = units;
  if (roundingMode === PRICE_ROUNDING_MODE_UP) {
    roundedUnits = Math.ceil(units);
  } else if (roundingMode === PRICE_ROUNDING_MODE_DOWN) {
    roundedUnits = Math.floor(units);
  } else {
    roundedUnits = Math.round(units);
  }

  return Number((roundedUnits * safeStep).toFixed(2));
}

function normalizeMode(value) {
  return PRICE_BATCH_MODES.some((mode) => mode.value === value)
    ? value
    : PRICE_BATCH_MODE_PERCENT;
}

function normalizeRoundingMode(value, fallback) {
  return PRICE_ROUNDING_MODES.some((mode) => mode.value === value)
    ? value
    : fallback;
}

export function normalizePriceBatchDraft(raw = {}, pricingConfig = DEFAULT_PRICING_CONFIG) {
  const safeConfig = normalizePricingConfig(pricingConfig);
  return {
    label: cleanString(raw.label, "Remarcacion general"),
    mode: normalizeMode(raw.mode),
    value: toNumber(raw.value, 0),
    roundingStep: toNumber(raw.roundingStep, safeConfig.roundingStep),
    roundingMode: normalizeRoundingMode(raw.roundingMode, safeConfig.roundingMode),
    notes: cleanString(raw.notes),
    filters: {
      activeOnly: normalizeBoolean(raw.filters?.activeOnly, safeConfig.defaultActiveOnly),
      excludeLocked: normalizeBoolean(
        raw.filters?.excludeLocked,
        safeConfig.defaultExcludeLocked
      ),
      categorySlug: cleanString(raw.filters?.categorySlug),
      brandQuery: cleanString(raw.filters?.brandQuery).toLowerCase(),
    },
  };
}

function normalizeOfferProductIds(value) {
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id || "").trim()).filter(Boolean);
}

function offerAppliesToProduct(offer, productId) {
  if (!productId) return false;
  return normalizeOfferProductIds(offer?.productIds).includes(String(productId));
}

function getFixedPriceOffers(product, offers = [], now = new Date()) {
  const productId = String(product?.id || "").trim();
  if (!productId) return [];

  return (offers || []).filter((offer) => {
    if (!offerAppliesToProduct(offer, productId)) return false;
    if (!isOfferEnabled(offer, now)) return false;
    return Number.isFinite(Number(offer.precioOferta));
  });
}

function matchesBaseFilters(product, filters) {
  if (filters.activeOnly && product?.activo === false) return false;
  if (filters.categorySlug && String(product?.categorySlug || "") !== filters.categorySlug) {
    return false;
  }
  if (filters.brandQuery) {
    const brandText = String(product?.marca || "").toLowerCase();
    if (!brandText.includes(filters.brandQuery)) return false;
  }
  return true;
}

function computeBaseTargetPrice(product, draft) {
  const currentPrice = Math.max(0, toNumber(product?.precio, 0));
  const value = toNumber(draft.value, 0);

  if (draft.mode === PRICE_BATCH_MODE_FACTOR) {
    return currentPrice * value;
  }

  if (draft.mode === PRICE_BATCH_MODE_DELTA) {
    return currentPrice + value;
  }

  if (draft.mode === PRICE_BATCH_MODE_MARGIN) {
    const cost = toNumber(product?.costoActual, Number.NaN);
    if (!Number.isFinite(cost) || cost < 0) {
      return { skippedReason: "missing_cost", currentPrice };
    }
    return cost * (1 + value / 100);
  }

  return currentPrice * (1 + value / 100);
}

export function buildPriceBatchPreview({
  products = [],
  offers = [],
  draft = {},
  pricingConfig = DEFAULT_PRICING_CONFIG,
  now = new Date(),
} = {}) {
  const safeConfig = normalizePricingConfig(pricingConfig);
  const safeDraft = normalizePriceBatchDraft(draft, safeConfig);
  const items = [];

  for (const product of products || []) {
    if (!matchesBaseFilters(product, safeDraft.filters)) continue;

    const currentPrice = Math.max(0, toNumber(product?.precio, 0));
    const fixedOffers = getFixedPriceOffers(product, offers, now);
    const baseTarget = computeBaseTargetPrice(product, safeDraft);

    if (safeDraft.filters.excludeLocked && product?.priceLocked === true) {
      items.push({
        productId: String(product.id || ""),
        nombre: String(product.nombre || "Producto"),
        marca: String(product.marca || ""),
        categorySlug: String(product.categorySlug || ""),
        currentPrice,
        nextPrice: currentPrice,
        delta: 0,
        deltaPct: 0,
        priceLocked: true,
        fixedPriceOffers: fixedOffers,
        status: "skipped_locked",
      });
      continue;
    }

    if (typeof baseTarget === "object" && baseTarget?.skippedReason === "missing_cost") {
      items.push({
        productId: String(product.id || ""),
        nombre: String(product.nombre || "Producto"),
        marca: String(product.marca || ""),
        categorySlug: String(product.categorySlug || ""),
        currentPrice,
        nextPrice: currentPrice,
        delta: 0,
        deltaPct: 0,
        priceLocked: Boolean(product?.priceLocked),
        fixedPriceOffers: fixedOffers,
        status: "skipped_missing_cost",
      });
      continue;
    }

    const nextPrice = applyRounding(baseTarget, {
      roundingStep: safeDraft.roundingStep,
      roundingMode: safeDraft.roundingMode,
    });
    const delta = Number((nextPrice - currentPrice).toFixed(2));
    const deltaPct =
      currentPrice > 0 ? Number((((nextPrice - currentPrice) / currentPrice) * 100).toFixed(2)) : 0;
    const status = Math.abs(delta) < 0.01 ? "noop" : "ready";

    items.push({
      productId: String(product.id || ""),
      nombre: String(product.nombre || "Producto"),
      marca: String(product.marca || ""),
      categorySlug: String(product.categorySlug || ""),
      currentPrice,
      nextPrice,
      delta,
      deltaPct,
      priceLocked: Boolean(product?.priceLocked),
      fixedPriceOffers: fixedOffers,
      status,
    });
  }

  const summary = items.reduce(
    (acc, item) => {
      acc.matchedCount += 1;
      if (item.status === "ready") {
        acc.changedCount += 1;
        acc.totalCurrent += item.currentPrice;
        acc.totalNext += item.nextPrice;
      } else if (item.status === "noop") {
        acc.noopCount += 1;
      } else if (item.status === "skipped_locked") {
        acc.lockedCount += 1;
      } else if (item.status === "skipped_missing_cost") {
        acc.missingCostCount += 1;
      }
      if ((item.fixedPriceOffers || []).length > 0) {
        acc.fixedPriceOfferWarnings += 1;
      }
      return acc;
    },
    {
      matchedCount: 0,
      changedCount: 0,
      noopCount: 0,
      lockedCount: 0,
      missingCostCount: 0,
      fixedPriceOfferWarnings: 0,
      totalCurrent: 0,
      totalNext: 0,
    }
  );

  summary.totalCurrent = Number(summary.totalCurrent.toFixed(2));
  summary.totalNext = Number(summary.totalNext.toFixed(2));
  summary.totalDelta = Number((summary.totalNext - summary.totalCurrent).toFixed(2));

  return {
    draft: safeDraft,
    items,
    summary,
    readyItems: items.filter((item) => item.status === "ready"),
  };
}
