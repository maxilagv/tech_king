export const MIN_PHONE_DIGITS = 10;
export const MAX_PHONE_DIGITS = 15;

export function extractPhoneDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

export function normalizeCustomerPhone(value) {
  const trimmed = String(value || "").trim();
  const digits = extractPhoneDigits(trimmed);
  if (!digits) return "";
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (trimmed.startsWith("00")) return `+${digits.slice(2)}`;
  return digits;
}

export function isValidCustomerPhone(value) {
  const digits = extractPhoneDigits(value);
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
}

export function getCustomerPhoneError(value) {
  const digits = extractPhoneDigits(value);
  if (!digits) return "Debes ingresar un numero de telefono.";
  if (digits.length < MIN_PHONE_DIGITS) {
    return "Ingresa un telefono valido, con codigo de area.";
  }
  if (digits.length > MAX_PHONE_DIGITS) {
    return "El telefono tiene demasiados digitos.";
  }
  return "";
}
