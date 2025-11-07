# Alertas de inventario bajo

Esta guía explica cómo funciona hoy la detección y visualización de inventario bajo en la app, dónde se configura el umbral, cómo se refleja en la UI y qué sucede durante el checkout. También sugiere mejoras opcionales para alertas proactivas.

## Qué se considera "inventario bajo"

- El umbral actual es de 5 unidades por producto.
- Se considera:
  - "Agotado" cuando existencias <= 0
  - "Inventario bajo" cuando 1 <= existencias <= 5
  - "Normal" cuando existencias > 5

Dónde está definido:
- En la vista de administración de inventario `app/Admin/Inventario/page.tsx` como una constante:
  - `const INVENTARIO_BAJO_UMBRAL = 5;`
- Cambiando ese valor, la UI de administración se actualizará automáticamente.

## Dónde se ve en la interfaz

1) Dashboard de Inventario (Administración)
- Tarjeta "Inventario Bajo": cuenta cuántos productos están bajo el umbral.
- Tarjeta "Productos Agotados": cuenta cuántos productos están en 0.
- Sección "Productos con Inventario Crítico": lista los primeros productos con bajo stock/agotados con badges de color y cantidades.

2) Tabla de productos (Administración)
- Columna "Existencias" muestra un Badge con color y tooltip:
  - Rojo (destructive) para 0 unidades, con tooltip "Producto agotado - Requiere reabastecimiento".
  - Amarillo (outline) para bajo stock, con tooltip "Inventario bajo - Reabastecer pronto" y animación sutil (pulse).
  - Verde para stock saludable.

3) Páginas de producto en catálogo
- Las fichas de producto muestran:
  - "Disponible" (badge verde) si existencias > 0.
  - "Agotado" (badge rojo) si existencias <= 0, además deshabilitan el botón "Agregar al carrito".
  - Ejemplos: `app/Bujias/NGK/page.tsx`, `app/Baterias/Duralast/page.tsx`, etc.

## Qué ocurre durante el checkout

Validaciones previas (ambos métodos de pago):
- Antes de procesar, se consulta `productos.existencias` en Supabase para cada item del carrito.
- Si alguna cantidad solicitada supera el stock disponible, se cancela la operación con un mensaje de error claro por producto.
- Código: `components/cart/useCart.ts`.

Descuento de inventario:
- Pago en efectivo (`checkoutEfectivo`):
  - Tras pasar la verificación, se descuenta atómicamente el inventario llamando la RPC `descontar_existencias` por cada ítem.
  - Luego se crea el recibo con estado Pagado.
- Pago con tarjeta (`checkoutTarjeta`):
  - Se valida stock pero NO se descuenta en ese paso.
  - Se crea un recibo en estado "pendiente" y se inicia la sesión de Stripe.
  - El webhook `app/api/stripe/webhook/route.ts` hoy registra el recibo pagado (status `completed`) pero no realiza el descuento de inventario.
  - La ruta `app/api/verify-receipt/route.ts` puede crear el recibo si faltara, pero tampoco descuenta inventario.

Implicación: actualmente el descuento de existencias sólo está implementado para efectivo. Para tarjeta, se recomienda descontar existencias al confirmar el pago (webhook) para evitar sobreventa si hay alta concurrencia.

## Cómo cambiar el umbral de alerta

- Edita `app/Admin/Inventario/page.tsx` y ajusta:
  - `const INVENTARIO_BAJO_UMBRAL = 5;`
- Efectos inmediatos:
  - Se actualiza el conteo de "Inventario Bajo" en el dashboard.
  - Cambia qué productos entran en la sección "Productos con Inventario Crítico".
  - Ajusta el color/tooltip de los badges en la tabla.

## Buenas prácticas y recomendaciones

- Transaccionalidad y límites:
  - Mantén la RPC `descontar_existencias` como única fuente para descontar stock en el servidor y asegúrate que previene valores negativos (CHECK/WHERE/RAISE en SQL).
  - Evita descartar inventario desde el cliente fuera de esa RPC.

- Flujo con tarjeta (recomendado):
  - En `app/api/stripe/webhook/route.ts`, tras `checkout.session.completed`, llamar a la RPC `descontar_existencias` para cada producto del `recibo` (o del `metadata.productos`) y luego confirmar/actualizar el recibo. Esto asegura que el descuento se hace sólo con pago confirmado.

- Alertas proactivas (opcionales):
  - Notificaciones: usar Supabase Edge Functions + cron scheduler para revisar diariamente productos con existencias <= umbral y enviar email/Slack/WhatsApp.
  - Umbral por producto: agregar un campo `umbral_bajo` en `productos` para personalizar por SKU, con fallback global.
  - Auditoría: tabla `inventario_eventos` para registrar ajustes manuales o automáticos (quién, cuándo, motivo).
  - Export rápido: botón en Admin para exportar CSV de "críticos".

## Troubleshooting rápido

- "No descuenta stock al pagar con tarjeta":
  - Verifica si el webhook se está ejecutando (logs) y considera agregar la llamada a `descontar_existencias` ahí.
- "Se permiten existencias negativas":
  - Asegura que la RPC y/o constraints de BD lo impiden. Revisa que toda salida pase por la RPC.
- "No veo productos en 'Inventario Bajo'":
  - Revisa el valor de `INVENTARIO_BAJO_UMBRAL` y que `existencias` esté correctamente actualizada en BD.

## Referencias de código

- Administración de inventario (UI y umbral): `app/Admin/Inventario/page.tsx`
- Lógica de carrito y checkout: `components/cart/useCart.ts`
- Stripe webhook (recibo tarjeta): `app/api/stripe/webhook/route.ts`
- Verificación de recibo: `app/api/verify-receipt/route.ts`
- Creación de sesión de pago: `app/api/stripe/create-checkout-session/route.tsx`
