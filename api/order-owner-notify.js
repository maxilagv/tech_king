import { AdminFieldValue, getAdminDb, verifyAuthorizationHeader } from "./_lib/firebaseAdmin.js";
import {
  buildOwnerOrderNotificationMessage,
  resolveOwnerPhone,
  sendOwnerOrderNotification,
} from "./_lib/orderOwnerNotificationService.js";

function readJsonBody(rawBody) {
  if (!rawBody) return {};
  if (typeof rawBody === "object") return rawBody;
  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
}

function getNotificationLogBase({ orderId, order, ownerPhone, messagePreview, existingAttempts = 0 }) {
  return {
    orderId,
    customerId: String(order?.customerId || ""),
    orderSource: String(order?.source || "web"),
    recipient: ownerPhone,
    messagePreview,
    attempts: existingAttempts + 1,
    lastAttemptAt: AdminFieldValue.serverTimestamp(),
    updatedAt: AdminFieldValue.serverTimestamp(),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const decodedToken = await verifyAuthorizationHeader(req.headers.authorization);
    const payload = readJsonBody(req.body);
    const orderId = String(payload.orderId || "").trim();

    if (!orderId) {
      res.status(400).json({ error: "Debes indicar el pedido a notificar." });
      return;
    }

    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const notificationRef = db.collection("order_notifications").doc(orderId);
    const businessConfigRef = db.collection("config").doc("business");

    const [orderSnap, notificationSnap, businessConfigSnap] = await Promise.all([
      orderRef.get(),
      notificationRef.get(),
      businessConfigRef.get(),
    ]);

    if (!orderSnap.exists) {
      res.status(404).json({ error: "Pedido no encontrado." });
      return;
    }

    const order = orderSnap.data();
    if (String(order?.customerId || "") !== String(decodedToken.uid || "")) {
      res.status(403).json({ error: "No puedes notificar un pedido que no es tuyo." });
      return;
    }

    if (notificationSnap.exists && notificationSnap.data()?.status === "sent") {
      res.status(200).json({ ok: true, alreadySent: true });
      return;
    }

    let customer = order?.customerSnapshot || null;
    if (!customer && order?.customerId) {
      const customerSnap = await db.collection("customers").doc(order.customerId).get();
      if (customerSnap.exists) {
        customer = customerSnap.data();
      }
    }

    const businessConfig = businessConfigSnap.exists ? businessConfigSnap.data() : {};
    const ownerPhone = resolveOwnerPhone({ businessConfig });
    if (!ownerPhone) {
      res.status(500).json({ error: "No hay telefono configurado para avisar al negocio." });
      return;
    }

    const message = buildOwnerOrderNotificationMessage({
      orderId,
      order,
      customer,
    });
    const attempts = Number(notificationSnap.data()?.attempts || 0);

    try {
      const delivery = await sendOwnerOrderNotification({
        body: message,
        ownerPhone,
      });

      const successPayload = {
        ...getNotificationLogBase({
          orderId,
          order,
          ownerPhone: delivery.recipient,
          messagePreview: message,
          existingAttempts: attempts,
        }),
        status: "sent",
        channel: delivery.channel,
        provider: "twilio",
        providerMessageSid: delivery.sid,
        lastError: "",
        sentAt: AdminFieldValue.serverTimestamp(),
      };

      if (!notificationSnap.exists) {
        successPayload.createdAt = AdminFieldValue.serverTimestamp();
      }

      await notificationRef.set(successPayload, { merge: true });
      res.status(200).json({ ok: true, sent: true });
    } catch (notificationError) {
      const failedPayload = {
        ...getNotificationLogBase({
          orderId,
          order,
          ownerPhone,
          messagePreview: message,
          existingAttempts: attempts,
        }),
        status: "failed",
        channel: String(process.env.ORDER_NOTIFICATION_CHANNEL || "sms").trim().toLowerCase(),
        provider: "twilio",
        lastError: notificationError.message || "No se pudo enviar la notificacion.",
      };

      if (!notificationSnap.exists) {
        failedPayload.createdAt = AdminFieldValue.serverTimestamp();
      }

      await notificationRef.set(failedPayload, { merge: true });
      res.status(502).json({ error: "No se pudo enviar el aviso al negocio." });
    }
  } catch (error) {
    const authErrorCode = String(error?.code || "");
    const statusCode = authErrorCode.startsWith("auth/") ? 401 : 500;
    res.status(statusCode).json({
      error:
        statusCode === 401
          ? "Tu sesion no es valida para notificar pedidos."
          : error?.message || "Error interno notificando el pedido.",
    });
  }
}
