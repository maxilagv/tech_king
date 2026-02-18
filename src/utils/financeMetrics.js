const SALE_STATUSES = new Set(["confirmado", "despachado"]);

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function toDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getDateFromTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  if (ts instanceof Date) return ts;
  if (typeof ts === "string" || typeof ts === "number") {
    const parsed = new Date(ts);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function parseDateInput(input) {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getFinanceRange(period, customStartInput, customEndInput) {
  const now = new Date();
  if (period === "today") {
    return { start: startOfDay(now), end: endOfDay(now) };
  }
  if (period === "week") {
    const weekday = now.getDay();
    const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    return { start: startOfDay(monday), end: endOfDay(now) };
  }
  if (period === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: startOfDay(monthStart), end: endOfDay(now) };
  }
  if (period === "quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
    return { start: startOfDay(quarterStart), end: endOfDay(now) };
  }
  if (period === "year") {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    return { start: startOfDay(yearStart), end: endOfDay(now) };
  }
  if (period === "custom") {
    const start = parseDateInput(customStartInput);
    const end = parseDateInput(customEndInput);
    if (!start || !end || start > end) return { start: null, end: null };
    return { start: startOfDay(start), end: endOfDay(end) };
  }
  return { start: null, end: null };
}

function buildDateKeys(start, end) {
  if (!start || !end || start > end) return [];
  const keys = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function withinRange(date, start, end) {
  if (!date || !start || !end) return false;
  return date >= start && date <= end;
}

function normalizeOrderSource(source) {
  if (!source) return "sin_fuente";
  return String(source).toLowerCase();
}

function buildCostHistoryMap(costs) {
  const map = new Map();
  for (const cost of costs || []) {
    const productId = String(cost.productId || "").trim();
    if (!productId) continue;
    const date = getDateFromTimestamp(cost.fechaCompra || cost.createdAt);
    if (!date) continue;
    const unitCost = Number(cost.costoUnitarioARS || 0);
    if (!map.has(productId)) map.set(productId, []);
    map.get(productId).push({ date, unitCost });
  }

  for (const [productId, history] of map.entries()) {
    history.sort((a, b) => a.date - b.date);
    map.set(productId, history);
  }

  return map;
}

function getUnitCostFromHistory(history, targetDate) {
  if (!history || history.length === 0) return 0;
  let left = 0;
  let right = history.length - 1;
  let best = -1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    if (history[middle].date <= targetDate) {
      best = middle;
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  if (best >= 0) return Number(history[best].unitCost || 0);
  return Number(history[history.length - 1]?.unitCost || 0);
}

function computeOrderFinancials(order, costHistoryMap) {
  const orderDate = getDateFromTimestamp(order.createdAt);
  const items = Array.isArray(order.items) ? order.items : [];
  let revenue = 0;
  let cost = 0;

  for (const item of items) {
    const productId = String(item.productId || "").trim();
    const qty = Number(item.cantidad || 0);
    if (!productId || qty <= 0) continue;

    const unitPrice = Number(item.precio || 0);
    const snapshotCost =
      item.costoUnitarioARS === undefined || item.costoUnitarioARS === null
        ? null
        : Number(item.costoUnitarioARS || 0);
    const fallbackCost = getUnitCostFromHistory(costHistoryMap.get(productId), orderDate);
    const unitCost = snapshotCost === null ? fallbackCost : snapshotCost;

    revenue += unitPrice * qty;
    cost += unitCost * qty;
  }

  if (revenue === 0) {
    revenue = Number(order.financialSummary?.revenue || order.total || 0);
  }
  if (cost === 0) {
    cost = Number(order.financialSummary?.cost || 0);
  }

  const roundedRevenue = roundMoney(revenue);
  const roundedCost = roundMoney(cost);
  const profit = roundMoney(roundedRevenue - roundedCost);

  return {
    revenue: roundedRevenue,
    cost: roundedCost,
    profit,
    marginPct: roundedRevenue > 0 ? Number(((profit / roundedRevenue) * 100).toFixed(2)) : 0,
  };
}

export function computeFinanceMetrics({
  orders = [],
  entries = [],
  costs = [],
  period,
  customStartInput,
  customEndInput,
}) {
  const { start, end } = getFinanceRange(period, customStartInput, customEndInput);
  if (!start || !end) {
    return {
      validRange: false,
      rangeLabel: "Rango invalido",
      totals: {
        ingresos: 0,
        egresos: 0,
        netoCaja: 0,
        ventasBrutas: 0,
        costoVentas: 0,
        gananciaBruta: 0,
        margenBrutoPct: 0,
        ticketPromedio: 0,
        pedidosConfirmados: 0,
        pedidosTotales: 0,
        cancelados: 0,
      },
      trendData: [],
      sourceData: [],
      topProducts: [],
      statusData: [],
    };
  }

  const costHistoryMap = buildCostHistoryMap(costs);
  const dateKeys = buildDateKeys(start, end);
  const dailyCash = new Map();
  const dailySales = new Map();

  let ingresos = 0;
  let egresos = 0;

  for (const entry of entries || []) {
    const date = getDateFromTimestamp(entry.createdAt);
    if (!withinRange(date, start, end)) continue;
    const key = toDateKey(date);
    if (!dailyCash.has(key)) {
      dailyCash.set(key, { ingresos: 0, egresos: 0 });
    }

    const amount = Number(entry.monto || 0);
    const type = String(entry.tipo || "").toLowerCase();
    if (type === "ingreso") {
      ingresos += amount;
      dailyCash.get(key).ingresos += amount;
    } else {
      egresos += amount;
      dailyCash.get(key).egresos += amount;
    }
  }

  const sourceMap = new Map();
  const productMap = new Map();
  const statusMap = new Map();
  let pedidosTotales = 0;
  let pedidosConfirmados = 0;

  for (const order of orders || []) {
    const date = getDateFromTimestamp(order.createdAt);
    if (!withinRange(date, start, end)) continue;

    pedidosTotales += 1;
    const status = String(order.status || "sin_estado").toLowerCase();
    statusMap.set(status, (statusMap.get(status) || 0) + 1);

    if (!SALE_STATUSES.has(status)) continue;
    pedidosConfirmados += 1;

    const orderFinancials = computeOrderFinancials(order, costHistoryMap);
    const key = toDateKey(date);
    if (!dailySales.has(key)) {
      dailySales.set(key, { ventas: 0, costoVentas: 0, gananciaBruta: 0, pedidos: 0 });
    }
    const day = dailySales.get(key);
    day.ventas += orderFinancials.revenue;
    day.costoVentas += orderFinancials.cost;
    day.gananciaBruta += orderFinancials.profit;
    day.pedidos += 1;

    const source = normalizeOrderSource(order.source);
    if (!sourceMap.has(source)) {
      sourceMap.set(source, { source, ventas: 0, costoVentas: 0, gananciaBruta: 0, pedidos: 0 });
    }
    const sourceRow = sourceMap.get(source);
    sourceRow.ventas += orderFinancials.revenue;
    sourceRow.costoVentas += orderFinancials.cost;
    sourceRow.gananciaBruta += orderFinancials.profit;
    sourceRow.pedidos += 1;

    for (const item of order.items || []) {
      const productId = String(item.productId || "").trim();
      const qty = Number(item.cantidad || 0);
      if (!productId || qty <= 0) continue;

      const unitPrice = Number(item.precio || 0);
      const snapshotCost =
        item.costoUnitarioARS === undefined || item.costoUnitarioARS === null
          ? null
          : Number(item.costoUnitarioARS || 0);
      const fallbackCost = getUnitCostFromHistory(costHistoryMap.get(productId), date);
      const unitCost = snapshotCost === null ? fallbackCost : snapshotCost;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          nombre: item.nombre || "Producto",
          unidades: 0,
          ventas: 0,
          costoVentas: 0,
          gananciaBruta: 0,
        });
      }
      const product = productMap.get(productId);
      product.unidades += qty;
      product.ventas += unitPrice * qty;
      product.costoVentas += unitCost * qty;
      product.gananciaBruta += unitPrice * qty - unitCost * qty;
      if (!product.nombre && item.nombre) product.nombre = item.nombre;
    }
  }

  const ventasBrutas = roundMoney(
    Array.from(dailySales.values()).reduce((sum, day) => sum + day.ventas, 0)
  );
  const costoVentas = roundMoney(
    Array.from(dailySales.values()).reduce((sum, day) => sum + day.costoVentas, 0)
  );
  const gananciaBruta = roundMoney(ventasBrutas - costoVentas);
  const netoCaja = roundMoney(ingresos - egresos);

  const trendData = dateKeys.map((key) => {
    const cash = dailyCash.get(key) || { ingresos: 0, egresos: 0 };
    const sales = dailySales.get(key) || {
      ventas: 0,
      costoVentas: 0,
      gananciaBruta: 0,
      pedidos: 0,
    };
    const ingresosDia = roundMoney(cash.ingresos);
    const egresosDia = roundMoney(cash.egresos);
    return {
      date: key,
      ingresos: ingresosDia,
      egresos: egresosDia,
      netoCaja: roundMoney(ingresosDia - egresosDia),
      ventas: roundMoney(sales.ventas),
      costoVentas: roundMoney(sales.costoVentas),
      gananciaBruta: roundMoney(sales.gananciaBruta),
      pedidos: sales.pedidos,
    };
  });

  const sourceData = Array.from(sourceMap.values())
    .map((row) => ({
      source: row.source,
      ventas: roundMoney(row.ventas),
      costoVentas: roundMoney(row.costoVentas),
      gananciaBruta: roundMoney(row.gananciaBruta),
      pedidos: row.pedidos,
      margenPct: row.ventas > 0 ? Number(((row.gananciaBruta / row.ventas) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.ventas - a.ventas);

  const topProducts = Array.from(productMap.values())
    .map((product) => ({
      productId: product.productId,
      nombre: product.nombre || "Producto",
      unidades: product.unidades,
      ventas: roundMoney(product.ventas),
      costoVentas: roundMoney(product.costoVentas),
      gananciaBruta: roundMoney(product.gananciaBruta),
      margenPct:
        product.ventas > 0 ? Number(((product.gananciaBruta / product.ventas) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 8);

  const statusData = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const totals = {
    ingresos: roundMoney(ingresos),
    egresos: roundMoney(egresos),
    netoCaja,
    ventasBrutas,
    costoVentas,
    gananciaBruta,
    margenBrutoPct:
      ventasBrutas > 0 ? Number(((gananciaBruta / ventasBrutas) * 100).toFixed(2)) : 0,
    ticketPromedio: pedidosConfirmados > 0 ? roundMoney(ventasBrutas / pedidosConfirmados) : 0,
    pedidosConfirmados,
    pedidosTotales,
    cancelados: statusMap.get("cancelado") || 0,
  };

  const rangeLabel = `${toDateKey(start)} a ${toDateKey(end)}`;

  return {
    validRange: true,
    rangeLabel,
    totals,
    trendData,
    sourceData,
    topProducts,
    statusData,
  };
}
