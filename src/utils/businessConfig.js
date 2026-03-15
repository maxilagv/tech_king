import {
  BRAND_ADDRESS,
  BRAND_GOOGLE_MAPS_EMBED_URL,
  BRAND_PHONE,
  BRAND_PHONE_E164,
  BRAND_SUPPORT_EMAIL,
  BRAND_WHATSAPP,
  BRAND_WHATSAPP_MESSAGE_TEMPLATE,
} from "@/constants/brand";

const FALLBACK_BUSINESS_CONFIG = Object.freeze({
  supportEmail: BRAND_SUPPORT_EMAIL,
  phoneDisplay: BRAND_PHONE,
  phoneE164: BRAND_PHONE_E164,
  whatsappDigits: BRAND_WHATSAPP,
  whatsappMessageTemplate: BRAND_WHATSAPP_MESSAGE_TEMPLATE,
  address: BRAND_ADDRESS,
  mapsEmbedUrl: BRAND_GOOGLE_MAPS_EMBED_URL,
});

function cleanString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizePhoneDigits(value, fallback) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits) return digits;
  return String(fallback || "").replace(/\D/g, "");
}

function normalizePhoneHref(value, fallbackDigits) {
  const raw = String(value || "").trim();
  if (raw) {
    if (raw.startsWith("+")) return raw;
    const digits = raw.replace(/\D/g, "");
    if (digits) return `+${digits}`;
  }
  const fallback = String(fallbackDigits || "").replace(/\D/g, "");
  return fallback ? `+${fallback}` : "";
}

export function getFallbackBusinessConfig() {
  return { ...FALLBACK_BUSINESS_CONFIG };
}

export function normalizeBusinessConfig(raw = {}) {
  return {
    supportEmail: cleanString(raw.supportEmail, FALLBACK_BUSINESS_CONFIG.supportEmail),
    phoneDisplay: cleanString(raw.phoneDisplay, FALLBACK_BUSINESS_CONFIG.phoneDisplay),
    phoneE164: normalizePhoneHref(raw.phoneE164, FALLBACK_BUSINESS_CONFIG.phoneE164),
    whatsappDigits: normalizePhoneDigits(raw.whatsappDigits, FALLBACK_BUSINESS_CONFIG.whatsappDigits),
    whatsappMessageTemplate: cleanString(
      raw.whatsappMessageTemplate,
      FALLBACK_BUSINESS_CONFIG.whatsappMessageTemplate
    ),
    address: cleanString(raw.address, FALLBACK_BUSINESS_CONFIG.address),
    mapsEmbedUrl: cleanString(raw.mapsEmbedUrl, FALLBACK_BUSINESS_CONFIG.mapsEmbedUrl),
  };
}

export function createPhoneHref(config) {
  const businessConfig = normalizeBusinessConfig(config);
  return businessConfig.phoneE164 ? `tel:${businessConfig.phoneE164}` : "";
}

export function createMailHref(config) {
  const businessConfig = normalizeBusinessConfig(config);
  return businessConfig.supportEmail ? `mailto:${businessConfig.supportEmail}` : "";
}

export function createMapsHref(config) {
  const businessConfig = normalizeBusinessConfig(config);
  return `https://www.google.com/maps?q=${encodeURIComponent(businessConfig.address)}`;
}

export function interpolateWhatsAppTemplate(template, values = {}) {
  return String(template || "")
    .replaceAll("{{name}}", String(values.name || "-").trim() || "-")
    .replaceAll("{{email}}", String(values.email || "-").trim() || "-")
    .replaceAll("{{subject}}", String(values.subject || "-").trim() || "-")
    .replaceAll("{{message}}", String(values.message || "-").trim() || "-")
    .replaceAll("{{phone}}", String(values.phone || "-").trim() || "-");
}

export function buildContactWhatsAppMessage(config, values = {}) {
  const businessConfig = normalizeBusinessConfig(config);
  return interpolateWhatsAppTemplate(businessConfig.whatsappMessageTemplate, values);
}

export function createWhatsAppUrl(config, message = "") {
  const businessConfig = normalizeBusinessConfig(config);
  const text = String(message || "").trim();
  if (!businessConfig.whatsappDigits) return "";
  return text
    ? `https://wa.me/${businessConfig.whatsappDigits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${businessConfig.whatsappDigits}`;
}
