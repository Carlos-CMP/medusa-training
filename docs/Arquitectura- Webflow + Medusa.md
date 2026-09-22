# Arquitectura: Webflow \+ Medusa

## Contexto

- Patron composable: sitio de marca en Webflow (CMS/website) + ecommerce headless (Medusa) para catalogo, carrito y checkout.
- El storefront (Next.js) que consume el backend Medusa se despliega como **Webflow Cloud App**, montado bajo una subruta del propio sitio Webflow (`/tienda`).
- Se evaluo tambien un despliegue en hosting independiente (Vercel + subdominio); ver la seccion "Alternativa evaluada" al final. No se implemento.

## Decision

Se eligio **Webflow Cloud**. En un intento anterior, contra otro layout de repo (monorepo con `apps/storefront`), esta opcion se habia descartado por dos bloqueos: el conector `@opennextjs/cloudflare` fallaba en build, y el deploy conectado a GitHub solo analiza la raiz del repo. Al repetir la integracion contra un repo standalone (`medusa-training`), ninguno de los dos bloqueos aplico, y la integracion quedo funcionando en produccion en `industrial-demo.webflow.io/tienda`.

## Arquitectura

```text
industrial-demo.webflow.io/          -> Home disenada en el Designer de Webflow
                                        (marketing, sin codigo)
industrial-demo.webflow.io/tienda/*  -> Storefront Next.js (este repo),
                                        desplegado como Webflow Cloud App,
                                        montado en /tienda
                                        -> llama a la API de Medusa
```

### Referencia rapida

| Que | Valor |
| --- | --- |
| Sitio Webflow | `industrial-demo.webflow.io` (`site_id` `6a75971f1cce004b55255dab`) |
| App Webflow Cloud | `medusa-training` (`app_id` `b69ad346-58ec-43b8-a321-a655ef7b8a64`) |
| Mount | `/tienda` |
| Entorno | `main` |
| Repo GitHub conectado | <https://github.com/Carlos-CMP/medusa-training> |
| Backend Medusa | Corriendo en local (`localhost:9000`), expuesto via tunel `cloudflared`. Pendiente de despliegue publico persistente, ver "Pendientes". |
| Deploy (recomendado) | `webflow apps deployments trigger` (build en servidores de Webflow) |
| Deploy local (no recomendado) | `webflow apps deploy`, falla por timeout en builds de mas de 15 minutos |

### Que necesita cada proyecto

- **Webflow**: ninguno, el mount lo gestiona Webflow Cloud.
- **Storefront**: conector `@opennextjs/cloudflare` (adaptador Next.js a Cloudflare Workers, runtime de Webflow Cloud).
- **Medusa backend**: `STORE_CORS` debe incluir el dominio de Webflow (`https://industrial-demo.webflow.io`) ademas del origen de desarrollo local.

### Documentacion oficial

- Introduccion: <https://developers.webflow.com/webflow-cloud/intro>
- Primeros pasos: <https://developers.webflow.com/webflow-cloud/getting-started>
- Bring your own app: <https://developers.webflow.com/webflow-cloud/bring-your-own-app>
- Entorno de ejecucion (Cloudflare Workers): <https://developers.webflow.com/webflow-cloud/environment>
- Deployments: <https://developers.webflow.com/webflow-cloud/deployments>

## Problemas encontrados y solucion

### 1. Deploy local falla por timeout

`webflow apps deploy` construye el proyecto en local y sube el resultado a Webflow. El build (`npm ci` + `next build` + bundling de OpenNext) tarda entre 15 y 27 minutos en una maquina Windows. La URL prefirmada de subida a S3 se genera al iniciar el deploy, no al terminar el build, asi que en builds lentos la URL ya caduco cuando toca subir el resultado (`AccessDenied: Policy expired`). No hay flag para extender esa caducidad.

**Solucion:** conectar la app a GitHub y construir en los servidores de Webflow.

```bash
# Una sola vez: conectar el repo a la app
webflow apps update <app_id> --github-source https://github.com/<owner>/<repo>

# Cada deploy: construir el HEAD de la rama conectada
webflow apps deployments trigger
```

Requisito previo: la GitHub App de Webflow instalada en el repo/cuenta y conectada al workspace.

### 2. Las variables NEXT\_PUBLIC\_\* no llegan donde se esperan

Las variables de entorno del dashboard de Webflow Cloud solo afectan de forma fiable al runtime del servidor. Las variables `NEXT_PUBLIC_*` de Next.js se incrustan en el bundle del cliente en tiempo de build, asi que lo que importa es que archivo `.env` existe alli donde el build realmente se ejecuta.

| Tipo de deploy | Donde corre el build | Que .env usa |
| --- | --- | --- |
| `webflow apps deploy` (local) | Tu propia maquina | `.env.local` / `.env` de tu disco. Las variables del dashboard no se aplican aqui. |
| `webflow apps deployments trigger` (GitHub) | Servidores de Webflow | Variables del dashboard de Webflow Cloud |

Confundir esto deja variables sin actualizar y produce errores silenciosos: en este caso, una URL de backend `localhost` horneada en el bundle publico, que hacia crashear la tienda para cualquier visitante.

**Recomendacion:** despues de cada deploy, comprobar que quedo realmente horneado en el HTML/JS servido, no dar por hecho que basta con la variable del dashboard.

### 3. Crash en cliente: checkEnvVariables() se filtra al navegador

Sintoma: cada pagina crasheaba tras la hidratacion con `Application error`. Consola: `Error: Missing required environment variables` seguido de `Uncaught (in promise) TypeError: r.exit is not a function`.

Causa (dos partes): `check-env-variables.js` comprueba `process.env[env.key]` con acceso dinamico, que Webpack nunca sustituye en el bundle del cliente. Ademas, el *image loader* personalizado que genera Webflow Cloud (`webflow-loader.ts`, que si se empaqueta para el cliente) importa `next.config` para reutilizar el `basePath` del mount, lo que arrastra `next.config.js` completo, incluida la llamada a `checkEnvVariables()` con su `process.exit(1)`, al bundle del navegador.

**Solucion** en `next.config.js`:

```js
const checkEnvVariables = require("./check-env-variables")

// El image loader de Webflow Cloud importa este archivo y lo arrastra al
// bundle del cliente. Solo ejecutar el chequeo (Node-only) cuando de verdad
// estemos en Node.
if (typeof window === "undefined") {
  checkEnvVariables()
}
```

Verificado en el bundle publicado: el bloque se elimina como codigo muerto en el cliente.

### 4. Imagenes locales en 404 bajo /tienda

Sintoma: imagenes servidas con `next/image` (por ejemplo el hero) daban 404; la peticion iba a `/images/...` en la raiz del dominio, sin el prefijo `/tienda`.

Causa: `next.config.js` tenia `images: { unoptimized: true }`. Con ese flag, `next/image` se salta el loader por completo (tanto el nativo como el personalizado), y sirve el `src` tal cual, sin basePath. El loader de Webflow Cloud es precisamente el que anade el prefijo `/tienda`, y nunca llega a ejecutarse.

**Solucion:** quitar `unoptimized: true`. Es seguro porque el loader personalizado de Webflow Cloud ya sustituye por completo el pipeline de optimizacion de Next (evita el problema de `sharp` en Cloudflare Workers, que probablemente motivo ese flag originalmente).

### 5. /tienda (raiz del mount, sin locale) da 404, sin resolver del todo

Sintoma: `https://industrial-demo.webflow.io/tienda` (sin nada detras) devuelve el 404 generico de Webflow, no el de la app. `/tienda/` hace un 301 a `/tienda` y vuelve a caer en el mismo 404. Solo `/tienda/<algo>` (por ejemplo `/tienda/es`) llega al worker de Next.js.

Dos causas identificadas: un bug real en `src/middleware.ts`, la redireccion de locale construye la URL a mano y, con `basePath` configurado, `request.nextUrl.pathname` dentro del middleware ya viene sin `/tienda`, asi que la URL de destino calculada tampoco lo lleva. Ademas, la ruta raiz exacta del mount no parece llegar nunca al worker (404 seco, sin `Location` de redirect); probablemente el enrutado de borde de Webflow Cloud solo cubre `/tienda/*`, no `/tienda` a secas (comportamiento de plataforma, no arreglable desde la app).

**Workaround aplicado:** en el Designer de Webflow, el enlace de navegacion "Tienda" apunta directamente a `/tienda/es`, evitando la ruta raiz rota. El bug de `middleware.ts` sigue sin arreglar en el codigo.

## Personalizar el sitio Webflow por API

Con la conexion funcionando, se ajusto la home de Webflow (disenada en el Designer) para que se sintiera parte del mismo sistema que la tienda. Se hizo mayormente por API (herramientas MCP de Webflow: `data_style_tool`, `data_element_tool`, `data_variable_tool`, `data_interactions_tool`, `data_component_props_tool`), sin necesidad del Designer abierto salvo para subir un asset de imagen.

Limitaciones encontradas en la API de Webflow:

- El sistema Row/Column legacy (`.w-row`/`.w-col`) tiene `display: block` por defecto, no flex; propiedades como `align-items: stretch` no hacen nada hasta forzar `display: flex` explicitamente.
- Las Google Fonts no se registran via API: fijar `font-family` por API no dispara el registro de la fuente en el sitio. Ese registro solo ocurre desde el selector de tipografias del Designer ("+ Add fonts"). Sin ese paso manual, la fuente se pide en el CSS pero nunca se carga.
- No siempre se puede insertar un elemento junto a una instancia de componente ni cambiar su visibilidad por API; a veces hace falta accion manual en el Designer.

## Verificacion con Playwright

La API de datos de Webflow confirma que un valor se guardo, pero eso no prueba que renderiza un navegador real. Con un script minimo de Playwright (`chromium.launch()`, `page.goto(url, { waitUntil: "networkidle" })`, `page.evaluate(...)` leyendo `getComputedStyle`, `getBoundingClientRect` o el  real de Google Fonts) se detectaron bugs invisibles desde la API, como una fila con `display: block` en vez de flex, o una fuente pedida en CSS que no estaba realmente cargada.

**Recomendacion:** si el Designer o la API dicen que algo esta bien pero el resultado visual no coincide, verificar con Playwright de inmediato en vez de iterar varias rondas de cambios CSS a ciegas.

## Pendientes

- Arreglar el bug de `basePath` en `src/middleware.ts` (redireccion de locale) para que `/tienda` (raiz, sin locale) funcione.
- Backend Medusa sigue detras de un tunel `cloudflared` efimero; para cualquier entorno persistente hace falta desplegarlo de forma publica.
- Push-to-deploy no esta activado (decision explicita): los deploys de Webflow Cloud se disparan siempre manualmente con `webflow apps deployments trigger`, nunca en automatico tras un `git push`.
- Registrar la fuente tipografica definitiva desde el selector de tipografias del Designer si no se ha hecho ya.

## Alternativa evaluada: subdominio + hosting independiente (no implementada)

Se considero desplegar el storefront en hosting externo (por ejemplo Vercel), en un subdominio propio, desacoplado de la infraestructura de Webflow Cloud.

```text
webalojadaenwebflow.com  (dominio raiz de la marca)
         |
  +------+-------------------+
  v                          v
webalojadaenwebflow.com   tienda.webalojadaenwebflow.com
(Webflow, Designer)       (subdominio -> apunta a hosting externo)
Home, landing, formularios  Storefront Next.js (catalogo, carrito, checkout)
```

Razon para considerarla: aisla la disponibilidad del storefront/checkout de un incidente en Webflow, a costa de un riesgo residual (el enlace de navegacion desde la home de Webflow dejaria de funcionar durante un incidente, aunque el subdominio siga accesible por URL directa o buscador).

No hay evidencia de un despliegue de este tipo funcionando para este proyecto. El repo incluye un `vercel.json`, pero la integracion que quedo en produccion es Webflow Cloud (ver arriba).
