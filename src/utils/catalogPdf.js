import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getProductPricing } from "@/utils/offers";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
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

function drawHeader(doc, title) {
  const now = new Date();
  const dateLabel = now.toLocaleString("es-AR");
  doc.setFillColor(11, 16, 32);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Tech King", 14, 12);
  doc.setFontSize(12);
  doc.text(title, 14, 20);
  doc.setFontSize(9);
  doc.text(dateLabel, doc.internal.pageSize.getWidth() - 14, 20, { align: "right" });
  doc.setTextColor(20, 20, 20);
}

export async function exportCatalogTablePdf({
  products = [],
  offers = [],
  categoryMap = {},
  filename = "catalogo-tech-king-tabla.pdf",
}) {
  const doc = new jsPDF();
  drawHeader(doc, "Catalogo (tabla)");

  const rows = products.map((product) => {
    const pricing = getProductPricing(product, offers, 1);
    return [
      product.nombre || "Producto",
      normalizeCategory(product.categorySlug, categoryMap),
      product.marca || "-",
      formatMoney(pricing.basePrice),
      pricing.hasOffer ? formatMoney(pricing.finalPrice) : "-",
      pricing.hasOffer ? `${pricing.discountPctApplied}%` : "-",
      String(product.stockActual ?? 0),
      product.activo === false ? "No" : "Si",
    ];
  });

  autoTable(doc, {
    startY: 34,
    head: [[
      "Producto",
      "Categoria",
      "Marca",
      "Precio lista",
      "Precio oferta",
      "Desc %",
      "Stock",
      "Activo",
    ]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.3 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [246, 248, 252] },
  });

  doc.save(filename);
}

function drawCardFrame(doc, x, y, w, h) {
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(x, y, w, h, 3, 3, "F");
  doc.setDrawColor(225, 229, 236);
  doc.roundedRect(x, y, w, h, 3, 3, "S");
}

function drawCardText(doc, lines, x, y, maxWidth) {
  let currentY = y;
  for (const line of lines) {
    const split = doc.splitTextToSize(line.text, maxWidth);
    doc.setFontSize(line.size || 9);
    doc.setTextColor(...(line.color || [20, 20, 20]));
    doc.text(split, x, currentY);
    currentY += split.length * (line.lineHeight || 4.2);
  }
  return currentY;
}

export async function exportCatalogVisualPdf({
  products = [],
  offers = [],
  categoryMap = {},
  filename = "catalogo-tech-king-visual.pdf",
}) {
  const doc = new jsPDF();
  drawHeader(doc, "Catalogo visual");

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const startY = 34;
  const gapX = 6;
  const gapY = 6;
  const cardW = (pageW - marginX * 2 - gapX) / 2;
  const cardH = 86;
  const imageW = 36;
  const imageH = 36;

  let cursorX = marginX;
  let cursorY = startY;
  let col = 0;

  for (const product of products) {
    if (cursorY + cardH > pageH - 12) {
      doc.addPage();
      drawHeader(doc, "Catalogo visual");
      cursorY = startY;
      cursorX = marginX;
      col = 0;
    }

    const pricing = getProductPricing(product, offers, 1);
    const imageUrl =
      product.imagenes?.[0] ||
      "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80";

    drawCardFrame(doc, cursorX, cursorY, cardW, cardH);

    const imageData = await fetchImageDataUrl(imageUrl);
    if (imageData) {
      doc.addImage(imageData, "JPEG", cursorX + 3, cursorY + 3, imageW, imageH, undefined, "FAST");
    } else {
      doc.setFillColor(233, 237, 244);
      doc.rect(cursorX + 3, cursorY + 3, imageW, imageH, "F");
      doc.setFontSize(8);
      doc.setTextColor(110, 120, 140);
      doc.text("Sin imagen", cursorX + 3 + imageW / 2, cursorY + 3 + imageH / 2, { align: "center" });
    }

    const textX = cursorX + imageW + 6;
    const textMaxW = cardW - imageW - 10;
    const finalY = drawCardText(
      doc,
      [
        { text: product.nombre || "Producto", size: 10, color: [17, 24, 39], lineHeight: 4.3 },
        {
          text: `${normalizeCategory(product.categorySlug, categoryMap)}${product.marca ? ` - ${product.marca}` : ""}`,
          size: 8,
          color: [90, 100, 120],
          lineHeight: 4,
        },
        { text: `Precio: ${formatMoney(pricing.basePrice)}`, size: 8, color: [25, 25, 25], lineHeight: 4 },
      ],
      textX,
      cursorY + 8,
      textMaxW
    );

    if (pricing.hasOffer) {
      doc.setTextColor(16, 130, 72);
      doc.setFontSize(9);
      doc.text(`Oferta: ${formatMoney(pricing.finalPrice)} (${pricing.discountPctApplied}%)`, textX, finalY + 3);
    }

    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Stock: ${product.stockActual ?? 0}`, textX, cursorY + 47);
    doc.text(`Activo: ${product.activo === false ? "No" : "Si"}`, textX + 28, cursorY + 47);

    col += 1;
    if (col === 2) {
      col = 0;
      cursorX = marginX;
      cursorY += cardH + gapY;
    } else {
      cursorX += cardW + gapX;
    }
  }

  doc.save(filename);
}
