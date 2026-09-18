import { HttpTypes } from "@medusajs/types"
import { ClientProfile, clientProfile } from "@/lib/client-profile"

export type ProductHighlight = {
  label: string
  value: string
}

export type ProductSpecGroup = {
  title: string
  rows: {
    label: string
    value: string
  }[]
}

export type ProductDocument = {
  title: string
  type: string
  detail: string
  url?: string
}

type ProductKind =
  | "speaker"
  | "headset"
  | "mouse"
  | "keyboard-kit"
  | "webcam"
  | "monitor"
  | "powerbank"
  | "generic"

const readMetadata = (
  product: HttpTypes.StoreProduct,
  keys: string[]
): string | undefined => {
  const metadata = product.metadata || {}

  for (const key of keys) {
    const value = metadata[key]

    if (typeof value === "string" && value.trim()) {
      return value
    }

    if (typeof value === "number") {
      return value.toString()
    }
  }
}

const readNumberMetadata = (
  product: HttpTypes.StoreProduct,
  keys: string[]
): number | undefined => {
  const metadata = product.metadata || {}

  for (const key of keys) {
    const value = metadata[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
}

const profileOrDefault = (profile?: ClientProfile) => profile || clientProfile

const getProductKind = (product: HttpTypes.StoreProduct): ProductKind => {
  const haystack = [
    product.title,
    product.handle,
    product.subtitle,
    product.description,
    product.categories?.map((category) => category.name).join(" "),
    product.tags?.map((tag) => tag.value).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (
    haystack.includes("auricular") ||
    haystack.includes("headset") ||
    haystack.includes("headphone") ||
    haystack.includes("ghx")
  ) {
    return "headset"
  }

  if (haystack.includes("mouse") || haystack.includes("ratón")) {
    return "mouse"
  }

  if (
    haystack.includes("teclado") ||
    haystack.includes("keyboard") ||
    haystack.includes("funky kit")
  ) {
    return "keyboard-kit"
  }

  if (haystack.includes("webcam") || haystack.includes("camara")) {
    return "webcam"
  }

  if (haystack.includes("monitor") || haystack.includes("gmx")) {
    return "monitor"
  }

  if (
    haystack.includes("powerbank") ||
    haystack.includes("powerpump") ||
    haystack.includes("bateria")
  ) {
    return "powerbank"
  }

  if (
    haystack.includes("altavoz") ||
    haystack.includes("speaker") ||
    haystack.includes("subwoofer") ||
    haystack.includes("wild bash") ||
    haystack.includes("wild space")
  ) {
    return "speaker"
  }

  return "generic"
}

const isProfileFallbackProduct = (
  product: HttpTypes.StoreProduct,
  profile?: ClientProfile
) =>
  profileOrDefault(profile).fallbacks.productBrandKeywords.some((keyword) => {
    const normalizedKeyword = keyword.toLowerCase()
    const titleMatches = product.title
      ?.toLowerCase()
      .includes(normalizedKeyword)
    const categoryMatches = product.categories?.some((category) =>
      category.name.toLowerCase().includes(normalizedKeyword)
    )

    return titleMatches || categoryMatches
  })

export const getProductSeries = (product: HttpTypes.StoreProduct) => {
  return (
    readMetadata(product, ["series", "serie", "product_series"]) ||
    product.collection?.title ||
    "Serie profesional"
  )
}

export const getProductSubtitle = (
  product: HttpTypes.StoreProduct,
  profile?: ClientProfile
) => {
  return (
    product.subtitle ||
    readMetadata(product, ["short_description", "type", "tipo"]) ||
    product.description ||
    profileOrDefault(profile).fallbacks.productTechnicalDescription
  )
}

export const getProductHighlights = (
  product: HttpTypes.StoreProduct,
  profile?: ClientProfile
): ProductHighlight[] => {
  const metadataHighlights = [
    ["power_rms", "potencia_rms", "Potencia RMS"],
    ["woofer", "woofer_size", "Woofer"],
    ["dsp", "processing", "Procesamiento"],
    ["spl", "max_spl", "SPL max."],
  ]
    .map(([primaryKey, secondaryKey, label]) => {
      const value = readMetadata(product, [primaryKey, secondaryKey])
      return value ? { label, value } : null
    })
    .filter(Boolean) as ProductHighlight[]

  if (metadataHighlights.length) {
    return metadataHighlights
  }

  if (!isProfileFallbackProduct(product, profile)) {
    return []
  }

  switch (getProductKind(product)) {
    case "speaker":
      return [
        { label: "Potencia RMS", value: "120 W" },
        { label: "Woofer", value: '6.5"' },
        { label: "Conectividad", value: "Bluetooth / AUX" },
        { label: "Autonomia", value: "12 h" },
      ]
    case "headset":
      return [
        { label: "Driver", value: "50 mm" },
        { label: "Conexion", value: "Jack 3.5 mm" },
        { label: "Micrófono", value: "Integrado" },
        { label: "Uso", value: "Gaming / oficina" },
      ]
    case "mouse":
      return [
        { label: "Conexion", value: "2.4 GHz" },
        { label: "Resolución", value: "1600 DPI" },
        { label: "Alcance", value: "10 m" },
        { label: "Uso", value: "Profesional" },
      ]
    case "keyboard-kit":
      return [
        { label: "Formato", value: "Teclado + ratón" },
        { label: "Conexion", value: "2.4 GHz" },
        { label: "Layout", value: "ES" },
        { label: "Uso", value: "Oficina" },
      ]
    case "webcam":
      return [
        { label: "Resolución", value: "Full HD 1080p" },
        { label: "Micrófono", value: "Integrado" },
        { label: "Conexion", value: "USB" },
        { label: "Uso", value: "Videollamada" },
      ]
    case "monitor":
      return [
        { label: "Panel", value: '27"' },
        { label: "Resolución", value: "QHD" },
        { label: "Frecuencia", value: "165 Hz" },
        { label: "Uso", value: "Gaming" },
      ]
    case "powerbank":
      return [
        { label: "Capacidad", value: "10.000 mAh" },
        { label: "Carga", value: "10 W" },
        { label: "Conexion", value: "USB-C" },
        { label: "Uso", value: "Movilidad" },
      ]
    default:
      return []
  }
}

const getFallbackSpecGroups = (
  product: HttpTypes.StoreProduct,
  dimensions?: string
): ProductSpecGroup[] => {
  const logisticsRows = [
    {
      label: "Peso",
      value: product.weight ? `${product.weight} g` : "Dato no publicado",
    },
    {
      label: "Dimensiones",
      value: dimensions || "Dato no publicado",
    },
    {
      label: "Unidad de venta",
      value: "Unidad o caja según variante",
    },
  ]

  switch (getProductKind(product)) {
    case "speaker":
      return [
        {
          title: "Audio",
          rows: [
            { label: "Potencia RMS", value: "120 W" },
            { label: "Respuesta en frecuencia", value: "60 Hz - 20 kHz" },
            { label: "Conectividad", value: "Bluetooth / AUX / USB" },
          ],
        },
        {
          title: "Componentes",
          rows: [
            { label: "Woofer", value: '6.5"' },
            { label: "Tweeter", value: '1"' },
            { label: "Bateria", value: "Autonomia hasta 12 h" },
          ],
        },
        { title: "Logística", rows: logisticsRows },
      ]
    case "headset":
      return [
        {
          title: "Audio",
          rows: [
            { label: "Driver", value: "50 mm" },
            { label: "Respuesta en frecuencia", value: "20 Hz - 20 kHz" },
            { label: "Impedancia", value: "32 ohm" },
          ],
        },
        {
          title: "Uso",
          rows: [
            { label: "Micrófono", value: "Integrado" },
            { label: "Conexion", value: "Jack 3.5 mm" },
            { label: "Compatibilidad", value: "PC, consola y móvil" },
          ],
        },
        { title: "Logística", rows: logisticsRows },
      ]
    case "mouse":
      return [
        {
          title: "Control",
          rows: [
            { label: "Sensor", value: "Optico" },
            { label: "Resolución", value: "1600 DPI" },
            { label: "Botones", value: "3 botones + rueda" },
          ],
        },
        {
          title: "Conectividad",
          rows: [
            { label: "Conexion", value: "Inalambrica 2.4 GHz" },
            { label: "Alcance", value: "Hasta 10 m" },
            { label: "Alimentacion", value: "Pila AA" },
          ],
        },
        { title: "Logística", rows: logisticsRows },
      ]
    case "keyboard-kit":
      return [
        {
          title: "Kit",
          rows: [
            { label: "Contenido", value: "Teclado + ratón" },
            { label: "Layout", value: "ES" },
            { label: "Uso", value: "Oficina profesional" },
          ],
        },
        {
          title: "Conectividad",
          rows: [
            { label: "Conexion", value: "Inalambrica 2.4 GHz" },
            { label: "Receptor", value: "USB nano" },
            { label: "Compatibilidad", value: "Windows, macOS y Linux" },
          ],
        },
        { title: "Logística", rows: logisticsRows },
      ]
    case "webcam":
      return [
        {
          title: "Video",
          rows: [
            { label: "Resolución", value: "Full HD 1080p" },
            { label: "FPS", value: "30 fps" },
            { label: "Enfoque", value: "Fijo" },
          ],
        },
        {
          title: "Conectividad",
          rows: [
            { label: "Conexion", value: "USB" },
            { label: "Micrófono", value: "Integrado" },
            { label: "Montaje", value: "Clip universal" },
          ],
        },
        { title: "Logística", rows: logisticsRows },
      ]
    case "monitor":
      return [
        {
          title: "Pantalla",
          rows: [
            { label: "Tamano", value: '27"' },
            { label: "Resolución", value: "QHD" },
            { label: "Frecuencia", value: "165 Hz" },
          ],
        },
        {
          title: "Conectividad",
          rows: [
            { label: "Entradas", value: "HDMI / DisplayPort" },
            { label: "Uso", value: "Gaming y productividad" },
            { label: "Montaje", value: "VESA" },
          ],
        },
        { title: "Logística", rows: logisticsRows },
      ]
    case "powerbank":
      return [
        {
          title: "Energía",
          rows: [
            { label: "Capacidad", value: "10.000 mAh" },
            { label: "Potencia de carga", value: "10 W" },
            { label: "Tipo de bateria", value: "Litio" },
          ],
        },
        {
          title: "Conectividad",
          rows: [
            { label: "Entrada", value: "USB-C" },
            { label: "Salida", value: "USB-A / USB-C" },
            { label: "Indicador", value: "LED de carga" },
          ],
        },
        { title: "Logística", rows: logisticsRows },
      ]
    default:
      return [{ title: "Logística", rows: logisticsRows }]
  }
}

export const getProductSpecGroups = (
  product: HttpTypes.StoreProduct,
  profile?: ClientProfile
): ProductSpecGroup[] => {
  const dimensions =
    product.height || product.width || product.length
      ? `${product.height || "-"} x ${product.width || "-"} x ${
          product.length || "-"
        } mm`
      : undefined

  const baseGroups: ProductSpecGroup[] = [
    {
      title: "Rendimiento",
      rows: [
        {
          label: "Potencia RMS",
          value:
            readMetadata(product, ["power_rms", "potencia_rms"]) || "1200 W",
        },
        {
          label: "SPL máximo",
          value: readMetadata(product, ["max_spl", "spl"]) || "127 dB",
        },
        {
          label: "Respuesta en frecuencia",
          value:
            readMetadata(product, ["frequency_response", "frecuencia"]) ||
            "50 Hz - 20 kHz",
        },
      ],
    },
    {
      title: "Componentes",
      rows: [
        {
          label: "Woofer",
          value: readMetadata(product, ["woofer", "woofer_size"]) || '12"',
        },
        {
          label: "Tweeter",
          value: readMetadata(product, ["tweeter"]) || '1.4"',
        },
        {
          label: "DSP",
          value: readMetadata(product, ["dsp", "processing"]) || "Si",
        },
      ],
    },
    {
      title: "Logística",
      rows: [
        {
          label: "Peso",
          value: product.weight ? `${product.weight} g` : "Dato no publicado",
        },
        {
          label: "Dimensiones",
          value: dimensions || "Dato no publicado",
        },
        {
          label: "Unidad de venta",
          value: "Unidad o caja según variante",
        },
      ],
    },
  ]

  if (isProfileFallbackProduct(product, profile)) {
    return getFallbackSpecGroups(product, dimensions)
  }

  if (!isProfileFallbackProduct(product, profile) && !product.metadata) {
    return baseGroups.map((group) => ({
      ...group,
      rows: group.rows.filter((row) => row.value !== "Dato no publicado"),
    }))
  }

  return baseGroups
}

export const getProductDocuments = (
  product: HttpTypes.StoreProduct
): ProductDocument[] => {
  const documents = product.metadata?.documents

  if (Array.isArray(documents)) {
    return documents
      .map((document) => {
        if (!document || typeof document !== "object") {
          return null
        }

        const item = document as Record<string, unknown>
        const title = item.title
        const url = item.url

        if (typeof title !== "string") {
          return null
        }

        return {
          title,
          type: typeof item.type === "string" ? item.type : "Documento",
          detail:
            typeof item.detail === "string" ? item.detail : "Documento técnico",
          url: typeof url === "string" ? url : undefined,
        }
      })
      .filter(Boolean) as ProductDocument[]
  }

  return []
}

export const getInventorySummary = (product: HttpTypes.StoreProduct) => {
  const b2bStatus = readMetadata(product, [
    "b2b_stock_status",
    "stock_status",
    "availability_status",
  ])?.toLowerCase()
  const stockFree = readNumberMetadata(product, [
    "stock_free",
    "available_stock",
    "stock_available",
  ])
  const stockReserved = readNumberMetadata(product, [
    "stock_reserved",
    "reserved_stock",
  ])
  const stockEta = readMetadata(product, ["stock_eta", "eta", "lead_time"])

  if (typeof stockFree === "number" || b2bStatus) {
    const quantity = stockFree ?? null
    const reservedDetail =
      typeof stockReserved === "number" && stockReserved > 0
        ? `, ${stockReserved} reservadas`
        : ""

    if (b2bStatus?.includes("agot") || b2bStatus?.includes("sin stock")) {
      return {
        label: "Sin stock",
        detail: stockEta || "Consulta plazo con soporte comercial",
        tone: "red" as const,
        quantity: quantity ?? 0,
      }
    }

    if (
      b2bStatus?.includes("limit") ||
      (typeof stockFree === "number" && stockFree > 0 && stockFree <= 10)
    ) {
      return {
        label: "Stock limitado",
        detail:
          typeof stockFree === "number"
            ? `${stockFree} unidades libres${reservedDetail}`
            : stockEta || "Disponibilidad limitada",
        tone: "amber" as const,
        quantity,
      }
    }

    if (
      b2bStatus?.includes("stock") ||
      b2bStatus?.includes("disponible") ||
      (typeof stockFree === "number" && stockFree > 0)
    ) {
      return {
        label: "En stock",
        detail:
          typeof stockFree === "number"
            ? `${stockFree} unidades libres${reservedDetail}`
            : stockEta || "Disponibilidad B2B confirmada",
        tone: "green" as const,
        quantity,
      }
    }
  }

  const managedVariants = product.variants?.filter(
    (variant) => variant.manage_inventory !== false
  )
  const quantity =
    managedVariants?.reduce(
      (acc, variant) => acc + (variant.inventory_quantity ?? 0),
      0
    ) || 0
  const hasManagedInventory = !!managedVariants?.length

  if (!hasManagedInventory) {
    return {
      label: "En stock",
      detail: "Disponibilidad gestionada por canal B2B",
      tone: "green" as const,
      quantity: null,
    }
  }

  if (quantity <= 0) {
    return {
      label: "Sin stock",
      detail: "Consulta plazo con soporte comercial",
      tone: "red" as const,
      quantity,
    }
  }

  if (quantity <= 10) {
    return {
      label: "Stock limitado",
      detail: `${quantity} unidades disponibles`,
      tone: "amber" as const,
      quantity,
    }
  }

  return {
    label: "En stock",
    detail: `${quantity} unidades disponibles`,
    tone: "green" as const,
    quantity,
  }
}
