Quiero que diseñes e implementes un sistema centralizado de gestión de errores para este ecommerce, compuesto por un backend Medusa (`medusa-training-backend`) y un storefront independiente (`medusa-training`, Next.js App Router).

## Objetivo

Construir una solución consistente que:

* Clasifique correctamente los errores en el backend.
* Utilice los mecanismos nativos de Medusa.
* Devuelva respuestas HTTP uniformes.
* Normalice los errores en el storefront.
* Muestre mensajes adecuados al usuario.
* Permita reintentos únicamente cuando sean seguros.
* Mantenga la consistencia de datos en workflows.
* Registre suficiente contexto para diagnosticar errores.
* Evite duplicar lógica en rutas y componentes.
* Conecte la estrategia de errores con la estrategia de caché del catálogo: sin caché, cualquier fallo del backend en `/store` o en un PDP golpea a cada visitante en cada carga, no solo a algunos. Ambas cosas se abordan juntas en este plan.

## Fase 0: contexto ya confirmado (punto de partida)

Ya existe una auditoría previa de este mismo repositorio en
[`docs/hallazgos-frontend-backend.md`](../hallazgos-frontend-backend.md).
No repitas ese trabajo; pártelo como hecho verificado y solo confirma que
sigue vigente antes de tocar cada archivo.

**Ya confirmado roto (prioridad de esta iteración):**

* `src/lib/util/medusa-error.ts` — asume forma de error de **axios**
  (`error.response`, `error.request`, `error.config`), pero el SDK real
  (`@medusajs/js-sdk`) lanza `FetchError` (solo `message`, `statusText`,
  `status`). Todo `.catch(medusaError)` cae siempre en la rama genérica.
* `src/lib/data/products.ts` — las tres funciones (`getProductsById`,
  `getProductByHandle`, `listProducts`) usan `cache: "no-store"`, fuera del
  sistema de tags (`getCacheOptions`/`revalidateTag`) que usa el resto del
  proyecto. Es el dato más visitado y el que menos colchón de caché tiene.
* `src/lib/data/catalog-rules.ts` (`applyCatalogRulesToProducts`) — hace
  hasta 100 llamadas HTTP concurrentes a `/store/catalog-rules` vía
  `Promise.all` (una por producto, sin batch). Si **una sola** falla, hoy
  tira toda la carga de productos porque `Promise.all` no tolera fallos
  parciales.
* `REVALIDATE_SECRET` (`.env.template`) — existe desde el origen del
  proyecto pero no lo consume ningún route handler. No hay invalidación
  on-demand vía webhook conectada al backend.
* `src/lib/data/regions.ts` (`getRegion`) — cachea en un `Map` de JS en
  memoria de proceso, no vía Next.js. `revalidateTag` sobre el tag de
  región no tiene ningún efecto sobre este `Map`.
* `src/lib/data/customer.ts:25` — `if (!authHeaders) return null` es código
  muerto: `getAuthHeaders()` nunca devuelve un valor falsy.
* Manejo de errores sin regla fija: conviven 4 patrones (throw vía
  `medusaError`, throw sin capturar, catch→`null`, catch→colección vacía),
  a veces en el mismo archivo (`quotes.ts`, `companies.ts`).

**Ya confirmado que sigue el patrón oficial de Medusa (no reescribir salvo
que se detecte algo nuevo):** `cart.ts`, `customer.ts` (salvo la línea 25
señalada arriba), `companies.ts`, `approvals.ts`, `quotes.ts`,
`categories.ts`, `collections.ts`, `orders.ts`, `payment.ts`,
`fulfillment.ts`, `regions.ts` (salvo el `Map` en memoria señalado arriba),
`product-options.ts`. Todos usan `getCacheOptions`/`getCacheTag` y
`revalidateTag` correctamente tras mutar. El setup del SDK
(`src/lib/config.ts`) y el límite arquitectónico de que toda mutación pasa
por Server Actions (`"use server"`, cero rutas API, cero fetch directo
desde `"use client"`) también están bien y no se tocan.

**Orden de esta iteración:** primero lo confirmado roto arriba (impacto
alto, ya verificado), después se extiende el patrón resultante al resto
solo donde haga falta. No se reescribe lo que ya sigue el patrón oficial
solo por uniformidad.

## Fase 1: inspección complementaria

Fase 0 ya cubre arquitectura, versión de librerías clave y los archivos de
acceso a datos. Antes de modificar código, completa solo lo que falte:

1. Confirma la versión exacta de Medusa instalada (`package.json` del
   backend) y de Next.js (storefront) — no se verificó en la auditoría
   previa.
2. Revisa workflows y steps personalizados en `medusa-training-backend/src/workflows/`
   y su cobertura de compensación actual (relevante para Fase 8).
3. Confirma qué logger usa el backend actualmente (para Fase 10).
4. Confirma si hay `CLAUDE.md`, `AGENTS.md` u otras convenciones internas
   además de las ya recogidas en `docs/hallazgos-frontend-backend.md`.

No actualices Medusa, Next.js ni dependencias importantes salvo que sea
estrictamente necesario. Si detectas una incompatibilidad, detente y
explícala antes de modificar versiones.

Al terminar, presenta brevemente:

* Qué cambió (si algo) respecto a lo ya confirmado en Fase 0.
* Archivos que vas a modificar o crear, en el orden de prioridad de Fase 0.
* Plan de implementación fase por fase.

Después continúa con la implementación, salvo que encuentres una decisión
funcional bloqueante.

## Fase 2: errores del backend

En el backend utiliza `MedusaError` de:

```ts
import { MedusaError } from "@medusajs/framework/utils"
```

No utilices `Error` genérico para errores de negocio o API que puedan
clasificarse.

Aplica correctamente los tipos:

* `INVALID_DATA`: datos o validación incorrectos.
* `NOT_ALLOWED`: operación de negocio no permitida.
* `UNAUTHORIZED`: falta de autenticación o autorización.
* `NOT_FOUND`: recurso inexistente.
* `CONFLICT`: conflicto interno, bloqueo o concurrencia.
* `DUPLICATE_ERROR`: recurso duplicado.
* `UNEXPECTED_STATE`: estado técnico inesperado.
* `DB_ERROR`: fallo de base de datos cuando corresponda.

Ejemplo:

```ts
throw new MedusaError(
  MedusaError.Types.NOT_ALLOWED,
  "No hay suficiente stock para completar la operación"
)
```

Requisitos:

1. Conserva el manejador de errores predeterminado de Medusa.
2. No envuelvas todas las rutas en `try/catch`.
3. Usa `try/catch` local únicamente para:

   * Traducir errores de servicios externos.
   * Añadir contexto técnico.
   * Ejecutar recuperación específica.
   * Adaptar una respuesta a un contrato externo.
4. No expongas:

   * Stack traces.
   * Consultas SQL.
   * Credenciales.
   * Tokens.
   * Información interna de proveedores.
5. Mantén mensajes seguros y comprensibles para el cliente.
6. Si personalizas el error handler global, ejecuta después el handler
   predeterminado de Medusa para conservar su comportamiento.
7. El subscriber `src/subscribers/sync-product-to-webflow.ts` (sincroniza
   productos al CMS de Webflow, código nuevo de esta sesión) hoy captura
   todo error y devuelve `"skipped"` sin distinguir tipo de fallo.
   Clasifícalo con el mismo criterio que el resto del backend en vez de
   dejarlo fuera de la auditoría.

## Fase 3: contrato interno de errores

Crea una clasificación compartida dentro del storefront con una forma
equivalente a:

```ts
export type StorefrontErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "rate-limit"
  | "server"
  | "network"
  | "unknown"

export interface StorefrontError {
  kind: StorefrontErrorKind
  message: string
  status?: number
  code?: string
  retryable: boolean
  originalError?: unknown
}
```

Adapta nombres y ubicación a las convenciones del proyecto.

No compartas directamente un paquete de tipos entre frontend y backend si
eso introduce acoplamiento innecesario. El storefront debe normalizar el
contrato HTTP recibido.

## Fase 4: normalizador del storefront

Implementa una única función responsable de convertir cualquier error en
`StorefrontError`.

**Elimina `src/lib/util/medusa-error.ts` como parte de esta fase, no lo
dejes coexistir con el normalizador nuevo.** Está confirmado roto (Fase 0):
asume forma de error de axios y el SDK real lanza `FetchError`. Todo punto
que hoy hace `.catch(medusaError)` (`cart.ts`, `customer.ts`,
`companies.ts`, `orders.ts`) debe pasar a usar el normalizador nuevo. Si al
migrar un call site detectas que necesita comportamiento distinto al
genérico, decide explícitamente y documenta por qué, no lo dejes usando el
helper viejo "por si acaso".

Debe reconocer:

* `FetchError` de `@medusajs/js-sdk`.
* Errores de red.
* Timeouts.
* Respuestas HTTP conocidas.
* Errores desconocidos.

Comportamiento esperado:

| Estado/situación     | `kind`         | Reintento                          |
| --------------------- | -------------- | ----------------------------------- |
| 400                   | `validation`   | No                                   |
| 401                   | `unauthorized` | No                                   |
| 403                   | `forbidden`    | No                                   |
| 404                   | `not-found`    | No                                   |
| 409                   | `conflict`     | Sí, si la operación es idempotente  |
| 422                   | `validation`   | No                                   |
| 429                   | `rate-limit`   | Sí                                   |
| 500–504               | `server`       | Sí, con límite                      |
| Error de red/timeout  | `network`      | Sí, con límite                      |
| Desconocido           | `unknown`      | No por defecto                      |

La función no debe mostrar notificaciones ni modificar estado visual. Su
única responsabilidad es normalizar el error.

Incluye type guards para evitar el uso indiscriminado de `any`.

## Fase 5: capa de acceso a datos

Orden de esta fase, según Fase 0: primero `products.ts`, después
`catalog-rules.ts`, después extender el patrón resultante al resto de
`src/lib/data/` solo donde falte.

### 5.1 — `products.ts` (prioridad alta)

1. Sustituye `cache: "no-store"` por el patrón `getCacheOptions("products")`
   / `getCacheTag("products")` que ya usa el resto del proyecto
   (`cart.ts`, `categories.ts`, etc.). Revisa qué mutaciones deben disparar
   `revalidateTag(productsCacheTag)` (ahora mismo `updateRegion` en
   `cart.ts` ya lo intenta, pero no tenía efecto porque productos no
   estaba tag-cacheado — comprueba que empiece a funcionar tras el cambio).
2. Conecta `REVALIDATE_SECRET` con un route handler
   (`src/app/api/revalidate/route.ts` o equivalente) que el backend Medusa
   pueda invocar tras `product.created`/`product.updated` para invalidar
   el tag bajo demanda, en vez de depender solo de tags por sesión de
   visitante. Verifica el secreto recibido contra `REVALIDATE_SECRET`
   antes de revalidar.
3. No captures un error para devolver `null`/lista vacía silenciosamente
   si el caller necesita distinguir entre recurso inexistente, error de
   red y error del servidor (usa el normalizador de Fase 4).

### 5.2 — `catalog-rules.ts` (prioridad alta)

`applyCatalogRulesToProducts` debe tolerar fallos parciales en el fan-out:
usa `Promise.allSettled` en vez de `Promise.all`. Decide explícitamente
qué hacer con un producto cuya llamada a `/store/catalog-rules` falla:
ocultarlo (fail-closed, más seguro para reglas B2B que pueden esconder
precio/stock) u mostrarlo sin reglas aplicadas (fail-open). Documenta la
decisión y por qué. Evalúa además si existe/se puede añadir un endpoint
batch en el backend (`/store/catalog-rules` aceptando un array de
`product_id`) para eliminar el N+1 en origen, no solo tolerarlo mejor en
el cliente.

### 5.3 — `regions.ts`

El `Map` en memoria de `getRegion()` no se invalida con `revalidateTag`.
Decide si sustituirlo por el patrón `getCacheOptions` estándar (consistente
con el resto, pero cambia el comportamiento de "vive todo el proceso" a
"vive por sesión/tag") o documentar explícitamente por qué se mantiene
como excepción deliberada.

### 5.4 — Resto de `src/lib/data/`

Para los archivos ya confirmados conformes en Fase 0, solo revisa:

1. Que usen preferentemente el SDK de Medusa; `sdk.client.fetch` para
   rutas personalizadas está bien si encaja con la arquitectura existente.
2. Que no dupliquen la traducción de estados HTTP fuera del normalizador
   de Fase 4.
3. `cart.ts:197-200` (`addToCartBulk`) vuelve a añadir manualmente
   `x-publishable-api-key`, que el SDK ya adjunta automáticamente —
   quítalo, es redundante.

No reescribas estos archivos solo por uniformidad si ya cumplen el patrón.

## Fase 6: presentación de errores

Implementa una estrategia visual según el contexto:

* Errores de formularios: junto al campo correspondiente.
* Stock insuficiente: en la línea del producto o carrito.
* Sesión caducada: redirección o solicitud de login.
* Producto inexistente: estado 404.
* Fallo en datos complementarios: ocultar o degradar el bloque sin romper
  la página.
* Fallo al modificar el carrito: revertir la actualización optimista y
  notificar.
* Fallo de pago: conservar los datos introducidos y permitir reintento
  seguro.
* Error general del servidor: mensaje estable con opción de reintento.
* Error de red: informar de falta de conexión sin afirmar que la operación
  no se realizó.

No muestres directamente al usuario errores técnicos desconocidos.

Separa:

```text
Mensaje técnico → logs/observabilidad
Mensaje funcional → interfaz de usuario
```

## Fase 7: carrito y optimistic updates

Revisa las operaciones del carrito:

* Añadir producto.
* Eliminar producto.
* Cambiar cantidad.
* Aplicar promoción.
* Actualizar dirección.
* Seleccionar envío.

Ya usan `useOptimistic`/`useTransition` sobre Server Actions
(`src/lib/context/cart-context.tsx`, confirmado en Fase 0) — no cambies
ese modelo, ajusta el manejo de errores dentro de él:

1. Guarda el estado anterior.
2. Actualiza la interfaz.
3. Ejecuta la mutación (Server Action, con reintento interno si aplica —
   ver Fase 9).
4. Reemplaza con la respuesta real de Medusa.
5. Si falla tras agotar reintentos, restaura el estado anterior.
6. Muestra un mensaje contextual (normalizado según Fase 4).

Evita invalidar o volver a solicitar datos no relacionados.

## Fase 8: workflows y consistencia

Revisa los workflows personalizados con efectos secundarios en
`medusa-training-backend/src/workflows/`.

Prioriza por riesgo real, no de forma uniforme:

* **Alto riesgo (revisar primero):** creación de pedidos, pagos, reserva
  de inventario, cupones aplicados — cualquier workflow en `order/` o que
  toque pagos.
* **Riesgo medio:** sincronización con Webflow CMS (el subscriber nuevo de
  esta sesión), `product-packaging`, `catalog-rules`.
* **Riesgo bajo (no priorizar compensaciones aquí):** `homepage`,
  `brand-profile` — contenido editorial, sin efectos económicos si falla a
  medias.

Para cada step de riesgo alto o medio que modifique datos o invoque
sistemas externos, determina si necesita una función de compensación.

Utiliza compensation functions para deshacer los efectos de steps
completados si un step posterior falla.

No uses `try/catch` dentro de la definición declarativa del workflow como
sustituto de las compensaciones.

Usa `throwOnError: false` solamente cuando el caller necesite inspeccionar
expresamente el array `errors` y exista una razón clara.

## Fase 9: reintentos e idempotencia

**Decisión de diseño para este proyecto: el reintento con backoff vive
dentro de la Server Action, no en el cliente.** El cliente no debe saber
que hubo reintentos — solo recibe el resultado final (éxito o error
normalizado) tras agotarlos. Implementa un helper compartido, p. ej.
`withRetry(fn, { maxRetries, isRetryable })`, y úsalo dentro de las Server
Actions de `src/lib/data/` para las llamadas que el normalizador de Fase 4
marque como `retryable: true`. No lo apliques a mutaciones no idempotentes
sin verificación explícita (ver más abajo).

Reglas:

* Máximo habitual: dos reintentos.
* Usa espera exponencial.
* Añade jitter cuando sea razonable.
* Respeta `Retry-After` en respuestas 429 si está disponible.
* No reintentes validaciones, permisos, recursos inexistentes ni stock
  insuficiente.
* No reintentes operaciones críticas sin verificar su idempotencia.
* Nunca permitas que un reintento duplique:

  * Cobros.
  * Pedidos.
  * Reservas.
  * Cupones consumidos.
  * Comunicaciones externas.

Cuando configures `maxRetries` en un step de Medusa, documenta por qué el
step es seguro para reintentar.

## Fase 10: observabilidad

Utiliza el logger existente del proyecto (confirma cuál en Fase 1). Evita
dejar `console.error` dispersos si existe un sistema de logging.

Incluye cuando esté disponible:

* `requestId`.
* `cartId`.
* `customerId`, sin datos personales innecesarios.
* `orderId`.
* `workflowId`.
* `stepId`.
* Nombre de la operación.
* Proveedor externo.
* Código o tipo del error.
* Duración de la operación.

No registres:

* Contraseñas.
* Tokens.
* Datos completos de tarjetas.
* Cookies.
* Secretos.
* Datos personales innecesarios.

Si existe Sentry u otra plataforma, intégrala reutilizando el error handler
predeterminado de Medusa. No reemplaces el formato de respuesta global
solo para registrar errores.

## Fase 11: pruebas

**Alcance de esta iteración: solo backend.** El storefront no tiene ningún
framework de test instalado (confirmado en la auditoría previa) — no lo
introduzcas en este plan. Documenta explícitamente en la entrega final que
el storefront queda sin cobertura automatizada como pendiente, no lo des
por resuelto ni lo bloquees en silencio.

### Backend (usa el Jest ya instalado)

* `INVALID_DATA` devuelve 400.
* `UNAUTHORIZED` devuelve 401.
* `NOT_FOUND` devuelve 404.
* `CONFLICT` devuelve 409.
* Un error inesperado devuelve 500 sin filtrar información interna.
* Un workflow de riesgo alto/medio (Fase 8) ejecuta sus compensaciones al
  fallar.
* Un error externo se traduce correctamente a `MedusaError`.

No introduzcas otro framework sin justificación explícita.

## Criterios de aceptación

La implementación estará completa cuando:

* No exista lógica relevante de traducción HTTP duplicada.
* Los errores de negocio del backend usen `MedusaError`.
* El storefront tenga un normalizador único — y `medusa-error.ts` haya
  sido eliminado, no dejado en paralelo.
* `products.ts` esté cacheado con el mismo patrón de tags que el resto, y
  `REVALIDATE_SECRET` esté conectado a un webhook real.
* `catalog-rules.ts` tolere fallos parciales (`Promise.allSettled`) con la
  decisión fail-open/fail-closed documentada.
* Los componentes no interpreten directamente errores técnicos salvo casos
  justificados.
* Los reintentos estén limitados, clasificados, y vivan dentro de las
  Server Actions (no en el cliente).
* Las operaciones críticas sean idempotentes o no se reintenten.
* Los workflows de riesgo alto/medio (Fase 8) tengan compensaciones.
* Los optimistic updates puedan revertirse.
* Los logs tengan contexto suficiente y no filtren información sensible.
* Los tests de backend estén pasando.
* TypeScript compile sin errores.
* El lint del proyecto pase.
* No se hayan actualizado dependencias innecesariamente.
* No se haya reescrito código del storefront que Fase 0 ya confirmó que
  sigue el patrón oficial, salvo que la implementación descubra un motivo
  nuevo y lo documente.

## Entrega final

Al terminar:

1. Resume la arquitectura implementada.
2. Enumera los archivos creados y modificados.
3. Explica las decisiones importantes (incluida la de fail-open/fail-closed
   en catalog-rules, y cualquier desviación de este plan).
4. Indica qué errores son reintentables.
5. Enumera los workflows que recibieron compensación y por qué se priorizaron.
6. Muestra los comandos de validación ejecutados.
7. Informa del resultado de tests (backend) y lint/compilación (ambos).
8. Señala cualquier riesgo o trabajo pendiente — incluida explícitamente
   la falta de tests automatizados en el storefront.
9. No afirmes que algo funciona si no se ha verificado.
