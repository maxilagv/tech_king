import { BRAND_NAME, BRAND_PHONE_E164 } from "../../src/constants/brand.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatCreatedAt(value) {
  let date = null;
  if (value?.toDate) date = value.toDate();
  else if (value?.seconds) date = new Date(value.seconds * 1000);
  else if (value instanceof Date) date = value;
  else if (typeof value === "string" || typeof value === "number") date = new Date(value);

  if (!date || Number.isNaN(date.getTime())) {
    date = new Date();
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Buenos_Aires",
  }).format(date);
}

function normalizePhoneE164(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (raw.startsWith("00")) return `+${digits.slice(2)}`;
  return `+${digits}`;
}

function formatTwilioAddress(value, channel) {
  const normalized = normalizePhoneE164(value);
  if (!normalized) {
    throw new Error("No hay un telefono destino valido para la notificacion.");
  }
  return channel === "whatsapp" ? `whatsapp:${normalized}` : normalized;
}

function buildItemPreview(items) {
  const safeItems = Array.isArray(items) ? items : [];
  if (safeItems.length === 0) return "Sin detalle";

  const preview = safeItems
    .slice(0, 3)
    .map((item) => {
      const quantity = Math.max(1, Number(item?.cantidad || 1));
      const name = String(item?.nombre || "Producto").trim() || "Producto";
      return `${name} x${quantity}`;
    })
    .join(", ");

  if (safeItems.length <= 3) return preview;
  return `${preview} +${safeItems.length - 3} mas`;
}

function getCustomerName(customer) {
  const firstName = String(customer?.nombre || "").trim();
  const lastName = String(customer?.apellido || "").trim();
  return `${firstName} ${lastName}`.trim() || String(customer?.email || "Cliente").trim() || "Cliente";
}

export function resolveOwnerPhone({ businessConfig = {} } = {}) {
  return (
    normalizePhoneE164(process.env.ORDER_NOTIFICATION_OWNER_PHONE) ||
    normalizePhoneE164(businessConfig.ownerNotificationPhone) ||
    normalizePhoneE164(businessConfig.phoneE164) ||
    normalizePhoneE164(BRAND_PHONE_E164)
  );
}

export function buildOwnerOrderNotificationMessage({ orderId, order, customer }) {
  const safeOrderId = String(orderId || order?.id || "").slice(0, 8) || "sin-id";
  const customerName = getCustomerName(customer);
  const customerPhone = String(customer?.telefono || "No informado").trim() || "No informado";
  const customerAddress =
    String(customer?.direccion || "No informada").trim() || "No informada";
  const itemsCount = (Array.isArray(order?.items) ? order.items : []).reduce(
    (sum, item) => sum + Math.max(1, Number(item?.cantidad || 1)),
    0
  );

  return [
    `Nuevo pedido web en ${BRAND_NAME}`,
    `Pedido: #${safeOrderId}`,
    `Fecha: ${formatCreatedAt(order?.createdAt)}`,
    `Cliente: ${customerName}`,
    `Telefono: ${customerPhone}`,
    `Direccion: ${customerAddress}`,
    `Items: ${itemsCount}`,
    `Detalle: ${buildItemPreview(order?.items)}`,
    `Total: ${formatCurrency(order?.total)}`,
  ].join("\n");
}

export async function sendOwnerOrderNotification({ body, ownerPhone }) {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
  const fromNumber = String(process.env.TWILIO_FROM_NUMBER || "").trim();
  const channel = String(process.env.ORDER_NOTIFICATION_CHANNEL || "sms").trim().toLowerCase();

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Faltan credenciales de Twilio para enviar la notificacion.");
  }

  if (channel !== "sms" && channel !== "whatsapp") {
    throw new Error("El canal de notificacion debe ser sms o whatsapp.");
  }

  const twilioResponse = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        To: formatTwilioAddress(ownerPhone, channel),
        From: formatTwilioAddress(fromNumber, channel),
        Body: body,
      }).toString(),
    }
  );

  const payload = await twilioResponse.json().catch(() => ({}));
  if (!twilioResponse.ok) {
    throw new Error(payload?.message || "Twilio rechazo la notificacion.");
  }

  return {
    sid: payload?.sid || "",
    channel,
    recipient: formatTwilioAddress(ownerPhone, channel),
  };
}
