import { getAdminDb, AdminFieldValue } from "./lib/firebaseAdminApp.js";
import { PRICE_BATCH_STATUS_ROLLED_BACK } from "../src/utils/pricingEngine.js";

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const batchId = String(args.batchId || args.batch || "").trim();
  const apply = toBoolean(args.apply, false);
  const actor = String(args.actor || "script").trim();

  if (!batchId) {
    console.error("Uso: node scripts/rollbackPriceBatch.js --batchId=<id> [--apply=true]");
    process.exit(1);
  }

  const db = getAdminDb();
  const batchRef = db.collection("price_batches").doc(batchId);
  const batchSnapshot = await batchRef.get();
  if (!batchSnapshot.exists) {
    console.error(`No existe el batch ${batchId}`);
    process.exit(1);
  }

  const itemsSnapshot = await batchRef.collection("items").get();
  const items = itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  console.log(`Productos a restaurar: ${items.length}`);

  if (!apply) {
    console.log("Dry run completado. Agrega --apply=true para ejecutar.");
    process.exit(0);
  }

  for (const group of chunk(items)) {
    const batch = db.batch();
    for (const item of group) {
      batch.update(db.collection("products").doc(item.productId), {
        precio: Number(item.currentPrice || 0),
        lastPriceBatchId: batchId,
        lastPriceUpdatedAt: AdminFieldValue.serverTimestamp(),
        lastPriceUpdatedBy: actor,
        updatedAt: AdminFieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  await batchRef.update({
    status: PRICE_BATCH_STATUS_ROLLED_BACK,
    rolledBackAt: AdminFieldValue.serverTimestamp(),
    rolledBackBy: actor,
    updatedAt: AdminFieldValue.serverTimestamp(),
  });

  console.log(`Batch revertido: ${batchId}`);
}

main().catch((error) => {
  console.error("Error revirtiendo batch:", error);
  process.exit(1);
});
