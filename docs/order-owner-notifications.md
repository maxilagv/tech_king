# Order Owner Notifications

## Objetivo
Cuando un cliente confirma un pedido web, el checkout llama a `/api/order-owner-notify`.

Ese endpoint:

- valida la sesion Firebase del cliente
- lee el pedido real desde Firestore
- arma un resumen corto del pedido
- envía el aviso al telefono del dueño por Twilio
- guarda un log en `order_notifications/{orderId}`

## Variables requeridas
Configuralas en Vercel o en el entorno server-side:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
  o `FIREBASE_SERVICE_ACCOUNT_BASE64`
- `ORDER_NOTIFICATION_OWNER_PHONE`
  opcional; si no existe usa `config/business.phoneE164` y luego el fallback de marca
- `ORDER_NOTIFICATION_CHANNEL`
  `sms` o `whatsapp`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

## Notas sobre Twilio

- Para `sms`, `TWILIO_FROM_NUMBER` debe ser un numero E.164, por ejemplo `+14155550100`.
- Para `whatsapp`, usa el mismo numero sin prefijo; el backend agrega `whatsapp:` automaticamente.
- El telefono del dueño debe estar en formato internacional. Ejemplo: `+5491150003209`.

## Logging
Cada intento se guarda en `order_notifications/{orderId}` con:

- `status`
- `attempts`
- `recipient`
- `provider`
- `channel`
- `lastError`
- `sentAt`
- `lastAttemptAt`

## Admin
El panel de pedidos muestra el estado del aviso del dueño para cada pedido web.
