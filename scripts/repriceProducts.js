import { getAdminDb, AdminFieldValue } from "./lib/firebaseAdminApp.js";
import {
  buildPriceBatchPreview,
  normalizePricingConfig,
  PRICE_BATCH_MODE_PERCENT,
  PRICE_BATCH_STATUS_APPLIED,
} from "../src/utils/pricingEngine.js";

function parseArgs(argv) {
  const args = {};
  for (const token of argv) {
    if (!token.startsWith("--")) continue;
    const [key, rawValue] = token.slice(2).split("=");
    args[key] = rawValue === undefined ? true : rawValue;
  }
  return args;
}

function toBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "si"].includes(String(value).toLowerCase());
}

function chunk(items, size = 200) {
  const groups = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = getAdminDb();
  const apply = toBoolean(args.apply, false);
  const actor = String(args.actor || "script").trim();
  const pricingConfig = normalizePricingConfig({
    roundingStep: Number(args.roundingStep || 100),
    roundingMode: args.roundingMode || "nearest",
    defaultActiveOnly: toBoolean(args.activeOnly, true),
    defaultExcludeLocked: toBoolean(args.excludeLocked, true),
  });

  const draft = {
    label: String(args.label || "Remarcacion por script").trim(),
    mode: String(args.mode || PRICE_BATCH_MODE_PERCENT).trim(),
    value: Number(args.value || 0),
    roundingStep: pricingConfig.roundingStep,
    roundingMode: pricingConfig.roundingMode,
    notes: String(args.notes || "").trim(),
    filters: {
      activeOnly: pricingConfig.defaultActiveOnly,
      excludeLocked: pricingConfig.defaultExcludeLocked,
      categorySlug: String(args.categorySlug || "").trim(),
      brandQuery: String(args.brandQuery || "").trim(),
    },
  };

  const [productsSnapshot, offersSnapshot] = await Promise.all([
    db.collection("products").get(),
    db.collection("offers").get(),
  ]);

  const products = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const offers = offersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const preview = buildPriceBatchPreview({ products, offers, draft, pricingConfig });

  console.log(`Coinciden: ${preview.summary.matchedCount}`);
  console.log(`Cambian: ${preview.summary.changedCount}`);
  console.log(`Bloqueados: ${preview.summary.lockedCount}`);
  console.log(`Sin costo: ${preview.summary.missingCostCount}`);
  console.log(`Alertas por precio fijo: ${preview.summary.fixedPriceOfferWarnings}`);
  console.log(`Impacto total: ${formatCurrency(preview.summary.totalDelta)}`);

  if (!apply) {
    console.log("Dry run completado. Agrega --apply=true para ejecutar.");
    process.exit(0);
  }

  if (preview.readyItems.length === 0) {
    console.log("No hay cambios para aplicar.");
    process.exit(0);
  }

  const batchRef = db.collection("price_batches").doc();
  try {
    await batchRef.set({
      label: preview.draft.label,
      mode: preview.draft.mode,
      value: Number(preview.draft.value || 0),
      roundingStep: Number(preview.draft.roundingStep || 0),
      roundingMode: preview.draft.roundingMode,
      notes: preview.draft.notes,
      filters: preview.draft.filters,
      summary: preview.summary,
      status: "applying",
      createdAt: AdminFieldValue.serverTimestamp(),
      createdBy: actor,
    });

    for (const group of chunk(preview.readyItems)) {
      const batch = db.batch();
      for (const item of group) {
        batch.set(batchRef.collection("items").doc(item.productId), {
          productId: item.productId,
          nombre: item.nombre,
          currentPrice: item.currentPrice,
          nextPrice: item.nextPrice,
          delta: item.delta,
          deltaPct: item.deltaPct,
          fixedPriceOfferTitles: item.fixedPriceOffers.map(
            (offer) => offer.titulo || offer.id || "Oferta"
          ),
          createdAt: AdminFieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    for (const group of chunk(preview.readyItems)) {
      const batch = db.batch();
      for (const item of group) {
        batch.update(db.collection("products").doc(item.productId), {
          precio: item.nextPrice,
          lastPriceBatchId: batchRef.id,
          lastPriceUpdatedAt: AdminFieldValue.serverTimestamp(),
          lastPriceUpdatedBy: actor,
          updatedAt: AdminFieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    await batchRef.update({
      status: PRICE_BATCH_STATUS_APPLIED,
      appliedAt: AdminFieldValue.serverTimestamp(),
      appliedBy: actor,
      updatedAt: AdminFieldValue.serverTimestamp(),
    });

    console.log(`Batch aplicado: ${batchRef.id}`);
  } catch (error) {
    await batchRef.set(
      {
        status: "failed",
        errorMessage: error?.message || "Error desconocido",
        updatedAt: AdminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    throw error;
  }
}

main().catch((error) => {
  console.error("Error ejecutando remarcacion:", error);
  process.exit(1);
});
