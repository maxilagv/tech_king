import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BRAND_ADDRESS,
  BRAND_LOGO_URL,
  BRAND_NAME,
  BRAND_PHONE,
  BRAND_SUPPORT_EMAIL,
} from "@/constants/brand";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });
}

function getTimestampValue(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

function formatDateTime(value) {
  const ts = getTimestampValue(value);
  if (!ts) return new Date().toLocaleString("es-AR");
  return new Date(ts).toLocaleString("es-AR");
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

function customerLine(customer) {
  const first = String(customer?.nombre || "").trim();
  const last = String(customer?.apellido || "").trim();
  const fallback = String(customer?.email || "Cliente").trim();
  return `${first} ${last}`.trim() || fallback;
}

export async function generateRemitoPdf({ numero, order, customer }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;

  const logoData = await fetchImageDataUrl(BRAND_LOGO_URL);
  const statusText = String(order?.status || "confirmado").toUpperCase();
  const orderCode = `#${String(order?.id || "").slice(0, 8)}`;
  const issueDate = formatDateTime(order?.createdAt);

  doc.setFillColor(24, 15, 56);
  doc.roundedRect(margin, 12, contentW, 36, 3, 3, "F");

  if (logoData) {
    doc.addImage(logoData, "PNG", margin + 4, 16, 18, 18);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(BRAND_NAME, margin + 26, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Comprobante de entrega", margin + 26, 31);
  doc.setFontSize(8.5);
  doc.text(`${BRAND_SUPPORT_EMAIL}  |  ${BRAND_PHONE}  |  ${BRAND_ADDRESS}`, margin + 26, 37);

  doc.setFillColor(246, 242, 255);
  doc.roundedRect(pageW - margin - 62, 54, 62, 34, 2, 2, "F");
  doc.setDrawColor(202, 186, 245);
  doc.roundedRect(pageW - margin - 62, 54, 62, 34, 2, 2, "S");

  doc.setTextColor(39, 29, 77);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Datos del remito", pageW - margin - 58, 61);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Numero: ${numero}`, pageW - margin - 58, 68);
  doc.text(`Fecha: ${issueDate}`, pageW - margin - 58, 74);
  doc.text(`Pedido: ${orderCode}`, pageW - margin - 58, 80);
  doc.text(`Estado: ${statusText}`, pageW - margin - 58, 86);

  const customerCardW = contentW - 66;
  doc.setFillColor(251, 250, 255);
  doc.roundedRect(margin, 54, customerCardW, 34, 2, 2, "F");
  doc.setDrawColor(225, 218, 247);
  doc.roundedRect(margin, 54, customerCardW, 34, 2, 2, "S");

  doc.setTextColor(39, 29, 77);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Datos del cliente", margin + 4, 61);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nombre: ${customerLine(customer)}`, margin + 4, 68);
  doc.text(`DNI: ${customer?.dni || "-"}`, margin + 4, 74);
  doc.text(`Telefono: ${customer?.telefono || "-"}`, margin + 4, 80);
  doc.text(`Direccion: ${customer?.direccion || "-"}`, margin + 4, 86);

  const rows = (order?.items || []).map((item, index) => {
    const qty = Number(item?.cantidad || 0);
    const unitPrice = Number(item?.precio || 0);
    const lineTotal = qty * unitPrice;
    return [
      String(index + 1),
      String(item?.nombre || "Producto"),
      String(qty),
      formatCurrency(unitPrice),
      formatCurrency(lineTotal),
    ];
  });

  autoTable(doc, {
    startY: 96,
    head: [["#", "Producto", "Cantidad", "Precio unit.", "Subtotal"]],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
      textColor: [28, 20, 52],
      lineColor: [222, 214, 246],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [86, 63, 156],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [247, 244, 255],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      2: { halign: "center", cellWidth: 22 },
      3: { halign: "right", cellWidth: 34 },
      4: { halign: "right", cellWidth: 36 },
    },
  });

  const tableEndY = doc.lastAutoTable?.finalY || 96;

  doc.setFillColor(242, 237, 255);
  doc.roundedRect(pageW - margin - 74, tableEndY + 8, 74, 24, 2, 2, "F");
  doc.setDrawColor(204, 190, 245);
  doc.roundedRect(pageW - margin - 74, tableEndY + 8, 74, 24, 2, 2, "S");

  doc.setTextColor(51, 37, 95);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Total del pedido", pageW - margin - 70, tableEndY + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(formatCurrency(order?.total || 0), pageW - margin - 6, tableEndY + 25, {
    align: "right",
  });

  doc.setTextColor(104, 90, 145);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Documento emitido digitalmente por NexaElectronics.",
    margin,
    doc.internal.pageSize.getHeight() - 12
  );

  doc.save(`remito-${numero}.pdf`);
}
