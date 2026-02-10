import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateRemitoPdf({ numero, order, customer }) {
  const doc = new jsPDF();
  const fecha = new Date().toLocaleDateString("es-AR");

  doc.setFontSize(16);
  doc.text("Remito", 14, 20);
  doc.setFontSize(10);
  doc.text(`Numero: ${numero}`, 14, 28);
  doc.text(`Fecha: ${fecha}`, 14, 34);

  doc.setFontSize(12);
  doc.text("Cliente", 14, 46);
  doc.setFontSize(10);
  doc.text(`${customer?.nombre || ""} ${customer?.apellido || ""}`.trim(), 14, 52);
  doc.text(`DNI: ${customer?.dni || "-"}`, 14, 58);
  doc.text(`Direccion: ${customer?.direccion || "-"}`, 14, 64);
  doc.text(`Telefono: ${customer?.telefono || "-"}`, 14, 70);
  doc.text(`Email: ${customer?.email || "-"}`, 14, 76);

  const rows = (order.items || []).map((item) => [
    item.nombre,
    String(item.cantidad),
    `$${Number(item.precio || 0).toFixed(2)}`,
    `$${Number(item.precio || 0) * Number(item.cantidad || 0)}`,
  ]);

  autoTable(doc, {
    head: [["Producto", "Cantidad", "Precio", "Total"]],
    body: rows,
    startY: 86,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  const finalY = doc.lastAutoTable.finalY || 86;
  doc.setFontSize(12);
  doc.text(`Total: $${Number(order.total || 0).toFixed(2)}`, 14, finalY + 12);

  doc.save(`remito-${numero}.pdf`);
}
