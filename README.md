# medusa-training

Sandbox propio (fuera de `b2b-starter`, que está desplegado) para probar la
integración del storefront Next.js de Medusa con Webflow Cloud
(`@opennextjs/cloudflare`), sin arriesgar el entorno de producción.

## Origen

Copia puntual de `apps/storefront` del monorepo `b2b-starter` de Novicell
(sin historial de git), aplanada a la raíz para evitar el bloqueo de Webflow
Cloud con monorepos (solo analiza la raíz del repo).

Apunta a un backend Medusa propio en `../medusa-training-backend` (copia
puntual de `apps/backend` del mismo monorepo, con Postgres local), vía
`.env.local` (no versionado). Ya no depende del backend de Medusa Cloud
(`b2b-novicell.medusajs.app`).

## Estado

- ✅ Build de `@opennextjs/cloudflare` — el fallo original era por permisos
  de symlink en Windows (pnpm + `next build` standalone), no un bug de la
  librería. Se resuelve habilitando el "Modo de desarrollador" de Windows.
- ✅ Runtime en Cloudflare Workers (`opennextjs-cloudflare preview`) — el
  error `Dynamic require of "/.next/server/middleware-manifest.json" is not
  supported` es el conocido
  https://github.com/opennextjs/opennextjs-cloudflare/issues/1232. Workaround
  aplicado en `wrangler.jsonc` (`vars.NEXT_PRIVATE_MINIMAL_MODE=1`). El
  middleware de selección de región y protección de `/account` sigue
  funcionando correctamente con este workaround (verificado con `curl`).
- ⏳ Pendiente: `sharp` en runtime de Workers (aún no probado end-to-end con
  imágenes reales).
- ⏳ Pendiente: deploy real a Webflow Cloud (`webflow apps deploy`) — requiere
  `webflow auth login` interactivo y decidir site-attached vs project app.
