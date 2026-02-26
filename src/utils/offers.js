const OFFER_TYPE_DATE = "fecha";
const OFFER_TYPE_VOLUME = "volumen";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function hasDiscountPriceFields(offer) {
  const hasPct = Number.isFinite(Number(offer.descuentoPct)) && Number(offer.descuentoPct) > 0;
  const hasFixed = Number.isFinite(Number(offer.precioOferta)) && Number(offer.precioOferta) >= 0;
  return hasPct || hasFixed;
}

export function isOfferDateWindowActive(offer, now = new Date()) {
  if (offer?.tipo !== OFFER_TYPE_DATE) return true;
  const startsAt = toDate(offer.startsAt);
  const endsAt = toDate(offer.endsAt);
  if (!startsAt || !endsAt) return false;
  return now >= startsAt && now <= endsAt;
}

export function isOfferEnabled(offer, now = new Date()) {
  if (!offer || offer.activa === false) return false;
  if (!hasDiscountPriceFields(offer)) return false;
  if (offer.tipo === OFFER_TYPE_DATE) return isOfferDateWindowActive(offer, now);
  if (offer.tipo === OFFER_TYPE_VOLUME) return true;
  return false;
}

function computeCandidateFinalPrice(basePrice, offer) {
  const safeBase = Math.max(0, toNumber(basePrice, 0));
  const fixed = Number.isFinite(Number(offer.precioOferta)) ? Number(offer.precioOferta) : null;
  const pct = Number.isFinite(Number(offer.descuentoPct)) ? Number(offer.descuentoPct) : null;

  const prices = [];
  if (fixed !== null && fixed >= 0) prices.push(fixed);
  if (pct !== null && pct > 0) prices.push(safeBase * (1 - pct / 100));
  if (prices.length === 0) return safeBase;
  const best = Math.min(...prices);
  return Math.max(0, Number(best.toFixed(2)));
}

function computeDiscountPct(basePrice, finalPrice) {
  if (basePrice <= 0 || finalPrice >= basePrice) return 0;
  return Number((((basePrice - finalPrice) / basePrice) * 100).toFixed(2));
}

function getOfferPriority(offer) {
  return toNumber(offer?.prioridad, 0);
}

function normalizeProductIds(value) {
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id || "").trim()).filter(Boolean);
}

function appliesToProduct(offer, productId) {
  if (!productId) return false;
  const ids = normalizeProductIds(offer?.productIds);
  return ids.includes(String(productId));
}

function evaluateOfferForQuantity(offer, basePrice, quantity, now) {
  if (!isOfferEnabled(offer, now)) {
    return { eligible: false, reason: "inactive" };
  }

  if (offer.tipo === OFFER_TYPE_VOLUME) {
    const minUnidades = Math.max(1, Math.floor(toNumber(offer.minUnidades, 1)));
    if (quantity < minUnidades) {
      return { eligible: false, reason: "min_units", minUnidades };
    }
  }

  const finalPrice = computeCandidateFinalPrice(basePrice, offer);
  const discountPctApplied = computeDiscountPct(basePrice, finalPrice);

  return {
    eligible: finalPrice < basePrice,
    finalPrice,
    discountPctApplied,
    minUnidades: offer.tipo === OFFER_TYPE_VOLUME ? Math.max(1, Math.floor(toNumber(offer.minUnidades, 1))) : null,
  };
}

function compareCandidates(a, b) {
  if (a.finalPrice !== b.finalPrice) return a.finalPrice - b.finalPrice;
  const pDiff = getOfferPriority(b.offer) - getOfferPriority(a.offer);
  if (pDiff !== 0) return pDiff;
  const aEnds = toDate(a.offer.endsAt)?.getTime() ?? Number.POSITIVE_INFINITY;
  const bEnds = toDate(b.offer.endsAt)?.getTime() ?? Number.POSITIVE_INFINITY;
  return aEnds - bEnds;
}

export function getProductPricing(product, offers, quantity = 1, now = new Date()) {
  const safeQuantity = Math.max(1, Math.floor(toNumber(quantity, 1)));
  const basePrice = Math.max(0, toNumber(product?.precio, 0));
  const productId = String(product?.id || "").trim();
  const relatedOffers = (offers || []).filter((offer) => appliesToProduct(offer, productId));

  const eligibleCandidates = [];
  const volumeHints = [];

  for (const offer of relatedOffers) {
    const evaluation = evaluateOfferForQuantity(offer, basePrice, safeQuantity, now);
    if (evaluation.eligible) {
      eligibleCandidates.push({
        offer,
        finalPrice: evaluation.finalPrice,
        discountPctApplied: evaluation.discountPctApplied,
        minUnidades: evaluation.minUnidades,
      });
      continue;
    }

    if (evaluation.reason === "min_units") {
      volumeHints.push({
        offer,
        minUnidades: evaluation.minUnidades,
      });
    }
  }

  eligibleCandidates.sort(compareCandidates);
  const best = eligibleCandidates[0] || null;

  volumeHints.sort((a, b) => {
    const pDiff = getOfferPriority(b.offer) - getOfferPriority(a.offer);
    if (pDiff !== 0) return pDiff;
    return a.minUnidades - b.minUnidades;
  });

  const volumeHint = volumeHints[0] || null;
  const finalPrice = best ? best.finalPrice : basePrice;
  const savingsPerUnit = Math.max(0, Number((basePrice - finalPrice).toFixed(2)));
  const savingsTotal = Math.max(0, Number((savingsPerUnit * safeQuantity).toFixed(2)));

  return {
    basePrice,
    finalPrice,
    hasOffer: Boolean(best),
    savingsPerUnit,
    savingsTotal,
    offer: best?.offer || null,
    offerType: best?.offer?.tipo || null,
    offerTitle: best?.offer?.titulo || "",
    discountPctApplied: best?.discountPctApplied || 0,
    minUnidades: best?.minUnidades || null,
    volumeHintMinUnits: volumeHint?.minUnidades || null,
    volumeHintTitle: volumeHint?.offer?.titulo || "",
  };
}

export function getActiveOffersForBanners(offers, now = new Date()) {
  return (offers || [])
    .filter((offer) => isOfferEnabled(offer, now))
    .sort((a, b) => getOfferPriority(b) - getOfferPriority(a));
}

export const offersConstants = {
  OFFER_TYPE_DATE,
  OFFER_TYPE_VOLUME,
};
