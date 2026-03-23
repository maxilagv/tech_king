import React, { useCallback, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, FileText, Link2, Printer, QrCode, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import {
  BRAND_ADDRESS,
  BRAND_LOGO_URL,
  BRAND_NAME,
  BRAND_PHONE,
  BRAND_URL,
  BRAND_WHATSAPP,
} from "@/constants/brand";
import { getBrandLogoDataUrl, getImageTypeFromDataUrl } from "@/utils/brandAssets";

// ─── Destinos predefinidos ────────────────────────────────────────────────────
const QR_PRESETS = [
  {
    id: "landing",
    label: "Inicio / Landing",
    description: "Página principal de la tienda",
    icon: "🏠",
    url: BRAND_URL + "/",
  },
  {
    id: "catalog",
    label: "Catálogo de productos",
    description: "Todos los productos disponibles",
    icon: "🛍️",
    url: BRAND_URL + "/products",
  },
  {
    id: "contact",
    label: "Contacto",
    description: "Formulario y datos de contacto",
    icon: "📞",
    url: BRAND_URL + "/contact",
  },
  {
    id: "whatsapp",
    label: "WhatsApp directo",
    description: "Abre chat de WhatsApp automáticamente",
    icon: "💬",
    url: `https://wa.me/${BRAND_WHATSAPP}?text=${encodeURIComponent("Hola, quiero consultar sobre productos de Nexastore")}`,
  },
  {
    id: "custom",
    label: "URL personalizada",
    description: "Ingresá cualquier URL que quieras",
    icon: "✏️",
    url: "",
  },
];

// ─── Esquemas de color ────────────────────────────────────────────────────────
const COLOR_SCHEMES = [
  { id: "default", label: "Clásico", fg: "#0f172a", bg: "#ffffff" },
  { id: "brand", label: "Marca", fg: "#1d4ed8", bg: "#ffffff" },
  { id: "dark", label: "Oscuro", fg: "#ffffff", bg: "#0f172a" },
  { id: "midnight", label: "Midnight", fg: "#e2e8f0", bg: "#1e1b4b" },
];

// ─── Tamaños del QR ───────────────────────────────────────────────────────────
const QR_SIZES = [
  { id: "sm", label: "Pequeño", px: 180 },
  { id: "md", label: "Mediano", px: 260 },
  { id: "lg", label: "Grande", px: 340 },
];

// ─── Error correction levels ──────────────────────────────────────────────────
// "H" es el nivel más alto: hasta 30% de daño recuperable.
// Necesario cuando se pone el logo en el centro (que ocupa espacio del QR).
const ERROR_LEVEL = "H";

export default function QRAdmin() {
  const canvasRef = useRef(null);

  const [selectedPreset, setSelectedPreset] = useState("landing");
  const [customUrl, setCustomUrl] = useState("");
  const [selectedSize, setSelectedSize] = useState("md");
  const [selectedScheme, setSelectedScheme] = useState("default");
  const [showLogo, setShowLogo] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // ─── URL efectiva a codificar ─────────────────────────────────────────────
  const activePreset = QR_PRESETS.find((p) => p.id === selectedPreset);
  const qrValue =
    selectedPreset === "custom"
      ? customUrl.trim() || BRAND_URL + "/"
      : activePreset?.url || BRAND_URL + "/";

  const activeScheme = COLOR_SCHEMES.find((s) => s.id === selectedScheme);
  const activeSize = QR_SIZES.find((s) => s.id === selectedSize);
  const canvasSize = activeSize?.px || 260;

  // ─── Logo settings para el centro del QR ─────────────────────────────────
  const logoSettings = showLogo
    ? {
        src: BRAND_LOGO_URL,
        height: Math.round(canvasSize * 0.22),
        width: Math.round(canvasSize * 0.22),
        excavate: true,
      }
    : undefined;

  // ─── Descarga PNG ─────────────────────────────────────────────────────────
  const handleDownloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `nexastore-qr-${selectedPreset}.png`;
    link.click();
  }, [selectedPreset]);

  // ─── Descarga PDF — cartel A4 listo para imprimir ─────────────────────────
  const handleDownloadPdf = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || isDownloadingPdf) return;

    setIsDownloadingPdf(true);
    try {
      const qrDataUrl = canvas.toDataURL("image/png", 1.0);
      const logoDataUrl = await getBrandLogoDataUrl();
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = 210;
      const pageH = 297;

      // ── Fondo degradado simulado con rect ──
      pdf.setFillColor(15, 23, 42); // #0f172a
      pdf.rect(0, 0, pageW, pageH, "F");

      // ── Banda superior decorativa ──
      pdf.setFillColor(29, 78, 216); // blue-700
      pdf.rect(0, 0, pageW, 4, "F");

      // ── Logo de la marca (imagen) ──
      const logoSize = 28;
      const logoX = (pageW - logoSize) / 2;
      if (logoDataUrl) {
        pdf.addImage(
          logoDataUrl,
          getImageTypeFromDataUrl(logoDataUrl),
          logoX,
          20,
          logoSize,
          logoSize,
          undefined,
          "FAST"
        );
      }

      // ── Nombre de la marca ──
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(26);
      pdf.setTextColor(255, 255, 255);
      pdf.text(BRAND_NAME.toUpperCase(), pageW / 2, 62, { align: "center" });

      // ── Subtítulo / destino del QR ──
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184); // slate-400
      const presetLabel =
        selectedPreset === "custom" ? "URL personalizada" : activePreset?.label || "";
      pdf.text(presetLabel.toUpperCase(), pageW / 2, 71, { align: "center" });

      // ── Línea separadora ──
      pdf.setDrawColor(29, 78, 216);
      pdf.setLineWidth(0.5);
      pdf.line(40, 76, pageW - 40, 76);

      // ── QR code — grande y centrado ──
      const qrPdfSize = 110;
      const qrX = (pageW - qrPdfSize) / 2;
      const qrY = 84;
      // Marco blanco detrás del QR
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(qrX - 6, qrY - 6, qrPdfSize + 12, qrPdfSize + 12, 4, 4, "F");
      pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrPdfSize, qrPdfSize);

      // ── Texto "ESCANEAME" ──
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(99, 179, 237); // sky-400
      const escaneaY = qrY + qrPdfSize + 22;
      pdf.text("ESCANEAME", pageW / 2, escaneaY, { align: "center" });

      // ── Flechas decorativas ──
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(18);
      pdf.setTextColor(99, 179, 237);
      pdf.text("↑", pageW / 2, escaneaY + 8, { align: "center" });

      // ── URL corta ──
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      const urlDisplay = qrValue.length > 50 ? qrValue.slice(0, 50) + "..." : qrValue;
      pdf.text(urlDisplay, pageW / 2, escaneaY + 16, { align: "center" });

      // ── Línea separadora inferior ──
      pdf.setDrawColor(30, 41, 59);
      pdf.setLineWidth(0.3);
      const infoY = escaneaY + 28;
      pdf.line(20, infoY, pageW - 20, infoY);

      // ── Datos del negocio ──
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(226, 232, 240);
      pdf.text(BRAND_NAME, pageW / 2, infoY + 9, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(BRAND_ADDRESS, pageW / 2, infoY + 16, { align: "center" });
      pdf.text(BRAND_PHONE, pageW / 2, infoY + 22, { align: "center" });
      pdf.text("Once · Buenos Aires · Argentina", pageW / 2, infoY + 28, { align: "center" });

      // ── Banda inferior decorativa ──
      pdf.setFillColor(29, 78, 216);
      pdf.rect(0, pageH - 4, pageW, 4, "F");

      pdf.save(`nexastore-cartel-qr-${selectedPreset}.pdf`);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [qrValue, selectedPreset, activePreset, isDownloadingPdf]);

  // ─── Imprimir ─────────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>QR Nexastore — ${activePreset?.label || "Custom"}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #0f172a; color: #fff;
              display: flex; align-items: center; justify-content: center;
              min-height: 100vh; padding: 40px;
            }
            .card {
              background: #1e293b; border-radius: 24px;
              padding: 48px 40px; text-align: center;
              max-width: 400px; width: 100%;
              border: 1px solid rgba(255,255,255,0.08);
            }
            img.logo { width: 72px; height: 72px; border-radius: 16px; margin-bottom: 16px; object-fit: cover; }
            h1 { font-size: 22px; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 4px; }
            .sub { font-size: 11px; color: #94a3b8; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 28px; }
            .qr-wrap { background: #fff; border-radius: 16px; padding: 16px; display: inline-block; margin-bottom: 20px; }
            .qr-wrap img { display: block; }
            .scan { font-size: 13px; font-weight: 600; color: #60a5fa; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px; }
            .url { font-size: 9px; color: #64748b; word-break: break-all; margin-bottom: 20px; }
            .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 16px 0; }
            .info { font-size: 10px; color: #94a3b8; line-height: 1.8; }
            .info strong { color: #e2e8f0; }
            @media print { body { background: #fff; } .card { box-shadow: none; border: 1px solid #e2e8f0; } }
          </style>
        </head>
        <body>
          <div class="card">
            <img class="logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" />
            <h1>${BRAND_NAME.toUpperCase()}</h1>
            <p class="sub">${activePreset?.label || "URL personalizada"}</p>
            <div class="qr-wrap">
              <img src="${dataUrl}" width="220" height="220" alt="QR Code" />
            </div>
            <p class="scan">Escaneame</p>
            <p class="url">${qrValue}</p>
            <hr class="divider" />
            <div class="info">
              <strong>${BRAND_NAME}</strong><br />
              ${BRAND_ADDRESS}<br />
              ${BRAND_PHONE}<br />
              Once · Buenos Aires · Argentina
            </div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  }, [qrValue, activePreset]);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-violet-300" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Generador de QR</h2>
        </div>
        <p className="text-sm text-white/50 ml-12">
          Creá códigos QR para tu local, folletería y campañas de marketing.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-8">
        {/* ══════════════════════════════════════
            PANEL IZQUIERDO — Configuración
        ══════════════════════════════════════ */}
        <div className="space-y-6">
          {/* ── Destino del QR ── */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-[0.2em]">
              Destino del QR
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                    selectedPreset === preset.id
                      ? "border-violet-500/60 bg-violet-500/15 shadow-lg shadow-violet-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="text-xl mt-0.5 shrink-0">{preset.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{preset.label}</p>
                    <p className="text-xs text-white/50 mt-0.5">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* ── Input URL personalizada ── */}
            {selectedPreset === "custom" && (
              <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <Link2 className="w-4 h-4 text-white/40 shrink-0" />
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
              </div>
            )}

            {/* ── URL activa ── */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 border border-white/5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 shrink-0">URL</span>
              <span className="text-xs text-white/50 truncate font-mono">{qrValue}</span>
            </div>
          </div>

          {/* ── Tamaño ── */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-[0.2em]">
              Tamaño
            </h3>
            <div className="flex gap-3">
              {QR_SIZES.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setSelectedSize(size.id)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedSize === size.id
                      ? "border-violet-500/60 bg-violet-500/15 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Color ── */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-[0.2em]">
              Esquema de color
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => setSelectedScheme(scheme.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    selectedScheme === scheme.id
                      ? "border-violet-500/60 bg-violet-500/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {/* Miniatura de color */}
                  <div
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center"
                    style={{ background: scheme.bg }}
                  >
                    <div
                      className="w-4 h-4 rounded-sm"
                      style={{ background: scheme.fg }}
                    />
                  </div>
                  <span className="text-xs text-white/70">{scheme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Logo ── */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Logo de Nexastore en el centro</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Usa corrección de errores máxima (nivel H) para garantizar legibilidad
                </p>
              </div>
              <div
                onClick={() => setShowLogo((prev) => !prev)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showLogo ? "bg-violet-600" : "bg-white/15"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    showLogo ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </div>
            </label>
          </div>
        </div>

        {/* ══════════════════════════════════════
            PANEL DERECHO — Preview + Descargas
        ══════════════════════════════════════ */}
        <div className="flex flex-col items-center gap-6 xl:w-[340px]">
          {/* ── QR Preview Card ── */}
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center gap-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Vista previa</p>

            <div
              className="rounded-2xl p-5 shadow-2xl"
              style={{ background: activeScheme?.bg || "#ffffff" }}
            >
              <QRCodeCanvas
                ref={canvasRef}
                value={qrValue}
                size={canvasSize}
                level={ERROR_LEVEL}
                fgColor={activeScheme?.fg || "#0f172a"}
                bgColor={activeScheme?.bg || "#ffffff"}
                imageSettings={logoSettings}
              />
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-medium text-white/70">{activePreset?.label}</p>
              <p className="text-[10px] text-white/30 font-mono break-all max-w-[280px]">
                {qrValue.length > 60 ? qrValue.slice(0, 60) + "…" : qrValue}
              </p>
            </div>
          </div>

          {/* ── Botones de acción ── */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-5 py-3.5 text-sm font-medium text-white transition-all"
            >
              <Download className="w-4 h-4" />
              Descargar PNG
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all"
            >
              {isDownloadingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Cartel A4 listo para imprimir
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3.5 text-sm font-medium text-white/70 hover:text-white transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir directamente
            </button>
          </div>

          {/* ── Tip ── */}
          <div className="w-full rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3">
            <p className="text-xs text-blue-300 leading-relaxed">
              <strong className="font-semibold">Tip:</strong> El PDF genera un cartel profesional
              A4 con el logo, datos del negocio y el QR grande — perfecto para mostrador o folletería.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
