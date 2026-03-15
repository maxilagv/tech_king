import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getProductPricing } from "@/utils/offers";
import { normalizeBusinessConfig } from "@/utils/businessConfig";
import {
  BRAND_LOGO_URL,
  BRAND_NAME,
} from "@/constants/brand";

const PRIMARY_RGB = [86, 63, 156];
const DARK_RGB = [24, 15, 56];
const BORDER_RGB = [216, 205, 244];
const SOFT_ROW_RGB = [248, 245, 255];

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });
}

function normalizeCategory(categorySlug, categoryMap) {
  return categoryMap[categorySlug] || categorySlug || "Sin categoria";
}

async function fetchImageDataUrl(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getImageType(dataUrl) {
  return String(dataUrl || "").includes("image/png") ? "PNG" : "JPEG";
}

let brandLogoCache;
async function getBrandLogoDataUrl() {
  if (brandLogoCache !== undefined) return brandLogoCache;
  brandLogoCache = await fetchImageDataUrl(BRAND_LOGO_URL);
  return brandLogoCache;
}

function drawHeader(doc, { title, subtitle, logoDataUrl, businessConfig }) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;

  doc.setFillColor(...DARK_RGB);
  doc.roundedRect(margin, 10, pageW - margin * 2, 30, 3, 3, "F");

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, getImageType(logoDataUrl), margin + 3, 14, 12, 12);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(BRAND_NAME, margin + 18, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.6);
  doc.text(
    `${businessConfig.supportEmail}  |  ${businessConfig.phoneDisplay}`,
    margin + 18,
    25
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(title, pageW - margin - 2, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.6);
  doc.text(subtitle, pageW - margin - 2, 24, { align: "right" });
  doc.text(new Date().toLocaleString("es-AR"), pageW - margin - 2, 30, { align: "right" });

  return 46;
}

function drawFooter(doc, page, totalPages) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;

  doc.setDrawColor(...BORDER_RGB);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

  doc.setTextColor(110, 95, 152);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`${BRAND_NAME} - Catalogo comercial`, margin, pageH - 7.6);
  doc.text(`Pagina ${page}/${totalPages}`, pageW - margin, pageH - 7.6, { align: "right" });
}

function trimLines(doc, text, maxWidth, maxLines) {
  const split = doc.splitTextToSize(String(text || ""), maxWidth);
  if (split.length <= maxLines) return split;
  const clipped = split.slice(0, maxLines);
  const lastIndex = clipped.length - 1;
  const lastLine = String(clipped[lastIndex] || "");
  clipped[lastIndex] = `${lastLine.slice(0, Math.max(0, lastLine.length - 3))}...`;
  return clipped;
}

function sortProductsByCategory(products, categoryMap) {
  return [...products].sort((a, b) => {
    const categoryA = String(
      normalizeCategory(a.categorySlug || a.categoryId || a.category, categoryMap)
    );
    const categoryB = String(
      normalizeCategory(b.categorySlug || b.categoryId || b.category, categoryMap)
    );

    const categoryCompare = categoryA.localeCompare(categoryB, "es", {
      sensitivity: "base",
    });
    if (categoryCompare !== 0) return categoryCompare;

    return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", {
      sensitivity: "base",
    });
  });
}

function drawImageContain(doc, imageData, x, y, maxW, maxH) {
  try {
    const props = doc.getImageProperties(imageData);
    const ratio = Math.min(maxW / props.width, maxH / props.height);
    const drawW = props.width * ratio;
    const drawH = props.height * ratio;
    const drawX = x + (maxW - drawW) / 2;
    const drawY = y + (maxH - drawH) / 2;
    doc.addImage(
      imageData,
      getImageType(imageData),
      drawX,
      drawY,
      drawW,
      drawH,
      undefined,
      "FAST"
    );
  } catch {
    doc.addImage(imageData, getImageType(imageData), x, y, maxW, maxH, undefined, "FAST");
  }
}

function getCatalogStats(products, offers, categoryMap) {
  const withOffers = products.filter((product) => {
    const pricing = getProductPricing(product, offers, 1);
    return pricing.hasOffer;
  }).length;

  const activeProducts = products.filter((product) => product.activo !== false).length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.stockActual || 0), 0);
  const categoriesCount = new Set(
    products.map((product) => normalizeCategory(product.categorySlug, categoryMap))
  ).size;

  return {
    withOffers,
    activeProducts,
    totalStock,
    categoriesCount,
  };
}

function drawQuickStats(doc, y, stats) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;
  const gap = 3;
  const cardW = (pageW - margin * 2 - gap * 3) / 4;
  const cardH = 16;
  const statsItems = [
    { label: "Activos", value: String(stats.activeProducts) },
    { label: "Categorias", value: String(stats.categoriesCount) },
    { label: "Con oferta", value: String(stats.withOffers) },
    { label: "Stock total", value: String(stats.totalStock) },
  ];

  statsItems.forEach((item, index) => {
    const x = margin + index * (cardW + gap);
    doc.setFillColor(246, 242, 255);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");
    doc.setDrawColor(...BORDER_RGB);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "S");

    doc.setTextColor(97, 79, 149);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.text(item.label, x + 3, y + 5.6);

    doc.setTextColor(36, 26, 68);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.2);
    doc.text(item.value, x + 3, y + 12.5);
  });

  return y + cardH + 5;
}

function drawSummaryCard(doc, y, stats, businessConfig) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;
  const cardW = pageW - margin * 2;

  doc.setFillColor(244, 240, 255);
  doc.roundedRect(margin, y, cardW, 24, 2, 2, "F");
  doc.setDrawColor(...BORDER_RGB);
  doc.roundedRect(margin, y, cardW, 24, 2, 2, "S");

  doc.setTextColor(53, 39, 103);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.4);
  doc.text("Resumen final del catalogo", margin + 4, y + 6.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.4);
  doc.text(`Productos activos: ${stats.activeProducts}`, margin + 4, y + 12.3);
  doc.text(`Categorias: ${stats.categoriesCount}`, margin + 63, y + 12.3);
  doc.text(`Con oferta: ${stats.withOffers}`, margin + 106, y + 12.3);
  doc.text(`Stock total: ${stats.totalStock}`, margin + 4, y + 18.2);
  doc.text(`Emitido por ${BRAND_NAME} | ${businessConfig.address}`, margin + 4, y + 22.2);
}

export async function exportCatalogTablePdf({
  products = [],
  offers = [],
  categoryMap = {},
  businessConfig: businessConfigOverride,
  filename = "catalogo-nexastore-tabla.pdf",
}) {
  const doc = new jsPDF();
  const orderedProducts = sortProductsByCategory(products, categoryMap);
  const logoDataUrl = await getBrandLogoDataUrl();
  const stats = getCatalogStats(orderedProducts, offers, categoryMap);
  const businessConfig = normalizeBusinessConfig(businessConfigOverride);
  const headerStartY = drawHeader(doc, {
    title: "Catalogo profesional",
    subtitle: "Listado de precios, stock y estado",
    logoDataUrl,
    businessConfig,
  });
  const tableStartY = drawQuickStats(doc, headerStartY + 1, stats);

  const rows = orderedProducts.map((product, index) => {
    const pricing = getProductPricing(product, offers, 1);
    return [
      String(index + 1),
      product.nombre || "Producto",
      normalizeCategory(product.categorySlug, categoryMap),
      product.marca || "-",
      formatMoney(pricing.basePrice),
      pricing.hasOffer ? formatMoney(pricing.finalPrice) : "-",
      String(product.stockActual ?? 0),
      product.activo === false ? "No" : "Si",
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { top: tableStartY, left: 12, right: 12, bottom: 20 },
    head: [["#", "Producto", "Categoria", "Marca", "Precio lista", "Precio oferta", "Stock", "Activo"]],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [35, 25, 60],
      lineColor: [222, 214, 246],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: PRIMARY_RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: SOFT_ROW_RGB,
    },
    columnStyles: {
      0: { cellWidth: 9, halign: "center" },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "right", cellWidth: 28 },
      6: { halign: "center", cellWidth: 16 },
      7: { halign: "center", cellWidth: 16 },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        const nextStart = drawHeader(doc, {
          title: "Catalogo profesional",
          subtitle: "Listado de precios, stock y estado",
          logoDataUrl,
          businessConfig,
        });
        drawQuickStats(doc, nextStart + 1, stats);
      }
    },
  });

  const pageH = doc.internal.pageSize.getHeight();
  let summaryY = (doc.lastAutoTable?.finalY || tableStartY) + 7;
  if (summaryY + 26 > pageH - 16) {
    doc.addPage();
    const nextStart = drawHeader(doc, {
      title: "Catalogo profesional",
      subtitle: "Resumen final",
      logoDataUrl,
      businessConfig,
    });
    summaryY = drawQuickStats(doc, nextStart + 1, stats);
  }
  drawSummaryCard(doc, summaryY, stats, businessConfig);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawFooter(doc, page, totalPages);
  }

  doc.save(filename);
}

function drawCatalogCard(doc, {
  x,
  y,
  w,
  h,
  product,
  pricing,
  categoryLabel,
  imageData,
}) {
  doc.setFillColor(252, 249, 255);
  doc.roundedRect(x, y, w, h, 1.9, 1.9, "F");
  doc.setDrawColor(...BORDER_RGB);
  doc.roundedRect(x, y, w, h, 1.9, 1.9, "S");

  const imageX = x + 1.7;
  const imageY = y + 1.7;
  const imageW = w - 3.4;
  const imageH = 18;

  if (imageData) {
    drawImageContain(doc, imageData, imageX, imageY, imageW, imageH);
  } else {
    doc.setFillColor(236, 232, 247);
    doc.roundedRect(imageX, imageY, imageW, imageH, 1.1, 1.1, "F");
    doc.setTextColor(130, 118, 167);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.text("Sin imagen", x + w / 2, imageY + imageH / 2 + 0.8, { align: "center" });
  }

  if (pricing.hasOffer) {
    doc.setFillColor(250, 221, 187);
    doc.roundedRect(x + w - 14, y + 2.6, 10.5, 4.1, 1.2, 1.2, "F");
    doc.setTextColor(106, 49, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.8);
    doc.text(`-${pricing.discountPctApplied}%`, x + w - 8.8, y + 5.7, { align: "center" });
  }

  doc.setTextColor(93, 72, 152);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.7);
  doc.text(trimLines(doc, String(categoryLabel || "").toUpperCase(), w - 4.4, 1), x + 2.2, y + 22.2);

  doc.setTextColor(34, 25, 62);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.3);
  const productLines = trimLines(doc, product.nombre || "Producto", w - 4.4, 2);
  doc.text(productLines, x + 2.2, y + 25.8);

  const stockValue = Number(product.stockActual ?? 0);
  doc.setFillColor(239, 234, 252);
  doc.roundedRect(x + 2, y + h - 10.5, 16, 4.4, 1.1, 1.1, "F");
  doc.setTextColor(82, 63, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.3);
  doc.text(`Stock ${stockValue}`, x + 3.2, y + h - 7.5);

  doc.setTextColor(35, 26, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.7);
  doc.text(formatMoney(pricing.finalPrice), x + 2.2, y + h - 2.8);

  if (pricing.hasOffer) {
    doc.setTextColor(130, 118, 167);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.2);
    doc.text(formatMoney(pricing.basePrice), x + w - 2.2, y + h - 7.1, { align: "right" });
  }
}

export async function exportCatalogVisualPdf({
  products = [],
  offers = [],
  categoryMap = {},
  businessConfig: businessConfigOverride,
  filename = "catalogo-nexastore-visual.pdf",
}) {
  const doc = new jsPDF();
  const orderedProducts = sortProductsByCategory(products, categoryMap);
  const logoDataUrl = await getBrandLogoDataUrl();
  const businessConfig = normalizeBusinessConfig(businessConfigOverride);
  const imageCache = new Map();

  const getCachedImage = async (url) => {
    if (!url) return null;
    if (imageCache.has(url)) return imageCache.get(url);
    const data = await fetchImageDataUrl(url);
    imageCache.set(url, data);
    return data;
  };

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 8;
  const getVisualStartY = () =>
    drawHeader(doc, {
      title: "Catalogo visual",
      subtitle: "Tarjetas compactas con precio final",
      logoDataUrl,
      businessConfig,
    }) + 1;
  const startY = getVisualStartY();
  const gapX = 3;
  const gapY = 3;
  const columns = 4;
  const cardW = (pageW - marginX * 2 - gapX * (columns - 1)) / columns;
  const cardH = 43;
  const bottomSafe = 15;

  let cursorX = marginX;
  let cursorY = startY;
  let columnIndex = 0;

  for (const product of orderedProducts) {
    if (cursorY + cardH > pageH - bottomSafe) {
      doc.addPage();
      cursorX = marginX;
      cursorY = getVisualStartY();
      columnIndex = 0;
    }

    const pricing = getProductPricing(product, offers, 1);
    const categoryLabel = normalizeCategory(product.categorySlug, categoryMap);
    const imageUrl =
      product.imagenes?.[0] ||
      "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80";
    const imageData = await getCachedImage(imageUrl);

    drawCatalogCard(doc, {
      x: cursorX,
      y: cursorY,
      w: cardW,
      h: cardH,
      product,
      pricing,
      categoryLabel,
      imageData,
    });

    columnIndex += 1;
    if (columnIndex === columns) {
      columnIndex = 0;
      cursorX = marginX;
      cursorY += cardH + gapY;
    } else {
      cursorX += cardW + gapX;
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawFooter(doc, page, totalPages);
  }

  doc.save(filename);
}
