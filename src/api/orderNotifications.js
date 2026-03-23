const ORDER_OWNER_NOTIFICATION_ENDPOINT = "/api/order-owner-notify";

export async function notifyOwnerAboutOrder({ orderId, user, timeoutMs = 8000 }) {
  if (!orderId) {
    throw new Error("Falta el identificador del pedido.");
  }
  if (!user) {
    throw new Error("Debes iniciar sesion para notificar el pedido.");
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const idToken = await user.getIdToken();
    const response = await fetch(ORDER_OWNER_NOTIFICATION_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
      signal: controller.signal,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.error || "No se pudo enviar el aviso al negocio.");
    }

    return payload || { ok: true };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
