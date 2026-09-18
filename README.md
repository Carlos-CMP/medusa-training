# medusa-training

Sandbox propio (fuera de `b2b-starter`, que está desplegado) para probar la
integración del storefront Next.js de Medusa con Webflow Cloud
(`@opennextjs/cloudflare`), sin arriesgar el entorno de producción.

## Origen

Copia puntual de `apps/storefront` del monorepo `b2b-starter` de Novicell
(sin historial de git), aplanada a la raíz para evitar el bloqueo de Webflow
Cloud con monorepos (solo analiza la raíz del repo).

Apunta al backend real de Medusa Cloud (`b2b-novicell.medusajs.app`) vía
`.env.local` (no versionado).

## Estado

Punto de partida para depurar:
- Error de `@opennextjs/cloudflare` (build no soportado) — ver
  https://github.com/opennextjs/opennextjs-cloudflare/issues/1380
- Incompatibilidad de `sharp` con el runtime de Workers.
