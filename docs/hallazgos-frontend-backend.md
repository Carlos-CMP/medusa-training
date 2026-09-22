# Hallazgos: comunicación frontend-backend

Análisis del storefront (`medusa-training`, `src/lib/data/`) comparado contra
el patrón oficial de Medusa (SDK singleton, `getCacheTag`/`getCacheOptions`/
`revalidateTag`, Server Actions para mutaciones). Base: hay una estrategia
deliberada al inicio (es el patrón del Next.js Starter oficial, heredado tal
cual) que se fue fragmentando de forma inconsistente a medida que se
añadieron features. No es ausencia de estrategia, es aplicación desigual de
una buena.

Lo que sí sigue el patrón oficial y no requiere cambios: setup del SDK
(`src/lib/config.ts`), el límite arquitectónico de que toda mutación pasa por
Server Actions (`"use server"`, cero rutas API, cero fetch directo desde
`"use client"`), y el trío `getCacheTag`/`getCacheOptions`/`revalidateTag`
donde sí se usa.

## Caché

**Tres estrategias de caché compitiendo sin regla visible.**

| Estrategia | Dónde | Detalle |
|---|---|---|
| Tag-based (la oficial) | 13 archivos de `src/lib/data/` | `next: getCacheOptions(tag)` + `revalidateTag` tras mutar |
| ISR por tiempo | `brand-profile.ts:83-85`, `product-packaging.ts:30-32` | `next: { revalidate: 60 }`, independiente del sistema de tags |
| Sin caché | `products.ts` (las 3 funciones, líneas 38/59/124), `homepage.ts:72` | `cache: "no-store"` |

El dato más importante del catálogo, productos, es el que queda fuera del
sistema de tags. Consecuencia: `updateRegion` (`cart.ts:562-585`) llama
`revalidateTag(productsCacheTag)` tras cambiar de región, pero como los
productos nunca se cachearon con ese tag, esa llamada no invalida nada —
código que aparenta funcionar y no hace nada.

**`REVALIDATE_SECRET` existe pero no lo usa nadie.** Está en
`.env.template` desde el origen del proyecto (es el secreto que el starter
oficial usa para un webhook `/api/revalidate`, invocado por Medusa tras
`product.updated`). No existe ningún route handler que lo consuma en todo el
repo (`src/app/api` no existe). El mecanismo de invalidación on-demand que el
propio proyecto dejó preparado nunca se conectó.

**`getRegion()` cachea fuera del sistema de Next.js.**
`src/lib/data/regions.ts:38-68` usa un `Map` de JS en memoria de proceso, no
`getCacheOptions`. Vive mientras viva la instancia del servidor, se comparte
entre todos los usuarios/requests de esa instancia, y no se invalida con
`revalidateTag` aunque `updateRegion` lo intente (mismo problema que el
punto anterior, en otra pieza del sistema).

**Conclusión:** el catálogo de productos no tiene ninguna estrategia de
caché real hoy: ni tags, ni webhook, ni ISR. Cada visita a `/store` o a un
PDP golpea Medusa en vivo.

## Performance

**N+1 en el listado de productos.** `applyCatalogRulesToProducts`
(`src/lib/data/catalog-rules.ts:95-126`) llama a `/store/catalog-rules`
**una vez por producto**, en paralelo vía `Promise.all`, no en batch. En
`listProductsWithSort` (`products.ts`), que prefetchea 100 productos para
ordenar/filtrar, esto son hasta **100 peticiones HTTP concurrentes extra**
en un solo render de `/store`.

El propio repo demuestra que sabe hacerlo bien: `quick-order.ts:42-61`
(`resolveQuickOrderSkus`) manda el array completo de SKUs en una sola
petición a `/store/quick-order/resolve`. El patrón batch existe en el
código, simplemente no se aplicó en `catalog-rules.ts`.

**Impacto:** esta ruta (`/store` y cada PDP) es exactamente la que dio el
"Application error" y las páginas vacías que se diagnosticaron en esta
sesión — no es casualidad que el path más costoso sea también el más
frágil.

## Gestión de errores

**Cuatro patrones de manejo de errores conviviendo sin regla fija,** a veces
en el mismo archivo:

1. **Throw vía `medusaError`**: `cart.ts`, `customer.ts` (`updateCustomer`),
   `companies.ts` (`inviteEmployee`), `orders.ts`.
2. **Throw sin capturar**: `products.ts` (`getProductsById`,
   `getProductByHandle`), `companies.ts` (las otras seis mutaciones, en
   contraste con `inviteEmployee` en el mismo archivo), `quotes.ts`,
   `quick-order.ts`, `product-options.ts`.
3. **Catch → `null`**: `cart.ts` (`retrieveCart`), `customer.ts`
   (`retrieveCustomer`), `fulfillment.ts`, `payment.ts`.
4. **Catch → colección vacía**: `products.ts` (solo para el caso
   "región no encontrada", no para errores de red), `quotes.ts`,
   `catalog-rules.ts`, `approvals.ts`, `product-packaging.ts`,
   `homepage.ts`, `brand-profile.ts`.

**Bug real: el helper compartido `medusaError` está roto para este SDK.**
`src/lib/util/medusa-error.ts` asume forma de error de **axios**
(`error.response`, `error.request`, `error.config`). El SDK real
(`@medusajs/js-sdk`) lanza `FetchError`, que no tiene ninguna de esas
propiedades. Resultado: todo `.catch(medusaError)` cae siempre en la rama
genérica "Error setting up the request", sin importar si el fallo fue un
400 real de la API o un problema de red — el manejo de errores de las
mutaciones más sensibles (carrito, checkout) da mensajes incorrectos de
forma sistemática, no ocasional.

**Retorno inconsistente en `customer.ts`:** `login` y `signup` capturan el
error y hacen `return error.toString()` (un string, no un throw, usado como
estado de `useActionState`), mientras `signout` no tiene try/catch y deja
propagar cualquier error sin capturar. El tipo de retorno de estas
funciones es implícitamente `string | undefined | void` sin que el código
lo declare así.

## Consistencia

Hallazgos menores, pero indicativos de copia sin revisar entre archivos:

- **Código muerto:** `src/lib/data/customer.ts:25` hace
  `if (!authHeaders) return null` justo después de
  `const authHeaders = await getAuthHeaders()` — pero `getAuthHeaders()`
  (`cookies.ts:7-22`) siempre devuelve un objeto (`{}` o
  `{authorization}}`), nunca un valor falsy. Esa rama nunca se ejecuta.
- **Header duplicado:** `cart.ts:197-200` (`addToCartBulk`) vuelve a añadir
  manualmente `x-publishable-api-key`, aunque `sdk.client.fetch` ya lo
  adjunta automáticamente por configuración del SDK
  (`getPublishableKeyHeader_`). No está en ningún otro archivo.
- **`credentials: "include"` aplicado sin criterio:** presente en
  `catalog-rules.ts`, `approvals.ts`, `cart.ts` (`retrieveCart`,
  `createCartApproval`), `product-options.ts`, `products.ts`; ausente en
  `categories.ts`, `collections.ts`, `orders.ts`, `regions.ts`,
  `companies.ts`, `quotes.ts`, `fulfillment.ts`, `payment.ts`,
  `quick-order.ts`, `homepage.ts`, `brand-profile.ts`,
  `product-packaging.ts`, y en las otras llamadas de `cart.ts`
  (`addToCartBulk`, `updateLineItem`). La app usa JWT en cookie httpOnly
  propia, no el modo de sesión por cookie de Medusa, así que este flag no
  cambia el comportamiento real en ningún caso — es ruido copiado de forma
  desigual, no una decisión.

## Prioridad recomendada

1. **Caché de productos**: moverlo al patrón `getCacheOptions`/
   `revalidateTag` como el resto, o conectar el webhook con
   `REVALIDATE_SECRET` que ya está previsto en `.env.template`.
2. **`medusa-error.ts`**: corregirlo para el shape real de `FetchError` en
   vez de axios.
3. **`catalog-rules.ts`**: aceptar un array de `product_id` en una sola
   petición, igual que ya hace `quick-order.ts`.
