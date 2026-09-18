import type {
  HttpTypes,
  StoreProduct,
  StoreProductVariant,
} from "@medusajs/types"

export type PurchaseUnit = "unit" | "box"

export type VariantPackaging = {
  unitsPerBox: number
  unitLabel: string
  boxLabel: string
  minimumOrderQuantity: number
  quantityIncrement: number
  packageWeight?: number
  packageDimensions?: string
  palletUnits?: number
}

export type CartLinePackaging = {
  purchaseUnit: PurchaseUnit
  unitsPerBox: number
  packageQuantity: number
  unitQuantity: number
  boxesPerPallet?: number
  packageWeight?: number
  packageDimensions?: string
  packageVolumeM3?: number
  totalWeight?: number
  volumetricWeight?: number
  billableWeight?: number
  palletShare?: number
}

export type CarrierRateEstimate = {
  carrier: string
  service: string
  zone: string
  transitDays: string
  billableWeight: number
  estimatedCost: number
  notes: string
  recommended?: boolean
}

type MetadataSource = {
  metadata?: Record<string, unknown> | null
}

const FALLBACK_UNITS_PER_BOX: Record<string, number> = {
  audio: 4,
  auriculares: 10,
  cable: 24,
  conectividad: 12,
  gaming: 6,
  monitor: 2,
  mouse: 24,
  ratón: 24,
  teclado: 12,
  webcam: 24,
}

const toNumber = (value: unknown) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.floor(numberValue)
    : undefined
}

const parseDimensionsMm = (value: string | undefined) => {
  if (!value) {
    return undefined
  }

  const parts = value
    .toLowerCase()
    .replace(/mm|cm|m/g, "")
    .split(/[x×*]/)
    .map((part) => Number(part.trim().replace(",", ".")))
    .filter((part) => Number.isFinite(part) && part > 0)

  if (parts.length < 3) {
    return undefined
  }

  const [length, width, height] = parts

  return {
    length,
    width,
    height,
    volumeM3: (length * width * height) / 1_000_000_000,
  }
}

const readMetadataNumber = (
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) => {
  if (!metadata) {
    return undefined
  }

  for (const key of keys) {
    const value = metadata[key]

    if (
      typeof value === "object" &&
      value !== null &&
      key === "b2b_packaging"
    ) {
      const nested = value as Record<string, unknown>
      const nestedValue = toNumber(
        nested.units_per_box ?? nested.unitsPerBox ?? nested.box_quantity
      )

      if (nestedValue) {
        return nestedValue
      }
    }

    const numberValue = toNumber(value)

    if (numberValue) {
      return numberValue
    }
  }
}

const fallbackUnitsPerBox = (
  product: Pick<StoreProduct, "title" | "handle" | "tags">,
  variant?: Pick<StoreProductVariant, "title" | "sku">
) => {
  const haystack = [
    product.title,
    product.handle,
    variant?.title,
    variant?.sku,
    product.tags?.map((tag) => tag.value).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const match = Object.entries(FALLBACK_UNITS_PER_BOX).find(([needle]) =>
    haystack.includes(needle)
  )

  return match?.[1] ?? 6
}

export const getVariantPackaging = (
  product: HttpTypes.StoreProduct | StoreProduct,
  variant?: HttpTypes.StoreProductVariant | StoreProductVariant,
  override?: {
    units_per_box?: number | null
    minimum_order_quantity?: number | null
    quantity_increment?: number | null
    boxes_per_pallet?: number | null
    package_weight?: number | null
    package_dimensions?: string | null
  }
): VariantPackaging => {
  const productMetadata = (product as MetadataSource).metadata
  const variantMetadata = (variant as MetadataSource | undefined)?.metadata

  const unitsPerBox =
    toNumber(override?.units_per_box) ??
    readMetadataNumber(variantMetadata, [
      "units_per_box",
      "unitsPerBox",
      "box_quantity",
      "b2b_packaging",
    ]) ??
    readMetadataNumber(productMetadata, [
      "units_per_box",
      "unitsPerBox",
      "box_quantity",
      "b2b_packaging",
    ]) ??
    fallbackUnitsPerBox(product as StoreProduct, variant as StoreProductVariant)

  const palletUnits =
    toNumber(override?.boxes_per_pallet) ??
    readMetadataNumber(variantMetadata, ["pallet_units", "palletUnits"]) ??
    readMetadataNumber(productMetadata, ["pallet_units", "palletUnits"])

  return {
    unitsPerBox,
    unitLabel: "unidad",
    boxLabel: unitsPerBox === 1 ? "caja" : `caja (${unitsPerBox} uds)`,
    minimumOrderQuantity: toNumber(override?.minimum_order_quantity) ?? 1,
    quantityIncrement: toNumber(override?.quantity_increment) ?? 1,
    packageWeight: toNumber(override?.package_weight),
    packageDimensions: override?.package_dimensions || undefined,
    palletUnits,
  }
}

export const getCartLinePackaging = (
  metadata: Record<string, unknown> | null | undefined,
  quantity: number
): CartLinePackaging | undefined => {
  const purchaseUnit = metadata?.purchase_unit as PurchaseUnit | undefined
  const unitsPerBox = toNumber(metadata?.units_per_box)
  const rawPackageQuantity = toNumber(metadata?.package_quantity)
  const packageWeight = toNumber(metadata?.package_weight)
  const boxesPerPallet = toNumber(metadata?.boxes_per_pallet)
  const packageDimensions =
    typeof metadata?.package_dimensions === "string"
      ? metadata.package_dimensions
      : undefined

  if (!purchaseUnit || !unitsPerBox) {
    return undefined
  }

  if (purchaseUnit === "box" && !rawPackageQuantity) {
    return undefined
  }

  const packageQuantity =
    purchaseUnit === "box" ? rawPackageQuantity ?? 0 : 0
  const unitQuantity = quantity
  const estimatedBoxes = unitQuantity / unitsPerBox
  const dimensions = parseDimensionsMm(packageDimensions)
  const packageVolumeM3 = dimensions?.volumeM3
  const totalWeight = packageWeight ? packageWeight * estimatedBoxes : undefined
  const totalVolumeM3 = packageVolumeM3
    ? packageVolumeM3 * estimatedBoxes
    : undefined
  const volumetricWeight = totalVolumeM3 ? totalVolumeM3 * 250 : undefined
  const billableWeight = Math.max(totalWeight || 0, volumetricWeight || 0) || undefined

  return {
    purchaseUnit,
    unitsPerBox,
    packageQuantity,
    unitQuantity,
    boxesPerPallet,
    packageWeight,
    packageDimensions,
    packageVolumeM3,
    totalWeight,
    volumetricWeight,
    billableWeight,
    palletShare: boxesPerPallet ? estimatedBoxes / boxesPerPallet : undefined,
  }
}

export const formatPackagingLine = (packaging: CartLinePackaging) => {
  if (packaging.purchaseUnit === "unit") {
    return `${packaging.unitQuantity} uds sueltas`
  }

  return `${packaging.packageQuantity} cajas x ${packaging.unitsPerBox} uds/caja = ${packaging.unitQuantity} uds`
}

export const formatPackagingDetails = (packaging: CartLinePackaging) => {
  return [
    packaging.totalWeight
      ? `${packaging.totalWeight.toFixed(1)} kg estimados`
      : null,
    packaging.packageDimensions,
    packaging.packageVolumeM3
      ? `${packaging.packageVolumeM3.toFixed(3)} m3/caja`
      : null,
    packaging.boxesPerPallet
      ? `${packaging.boxesPerPallet} cajas/pallet`
      : null,
  ]
    .filter(Boolean)
    .join(" - ")
}

export const getCartPackagingSummary = (
  items:
    | Array<{
        quantity: number
        metadata?: Record<string, unknown> | null
      }>
    | null
    | undefined
) => {
  return (items || []).reduce(
    (summary, item) => {
      const packaging = getCartLinePackaging(item.metadata, item.quantity)

      summary.totalUnits += item.quantity

      if (!packaging) {
        summary.looseUnits += item.quantity
        return summary
      }

      if (packaging.purchaseUnit === "box") {
        summary.boxes += packaging.packageQuantity
        summary.boxedUnits += packaging.unitQuantity
      } else {
        summary.looseUnits += packaging.unitQuantity
      }

      summary.estimatedWeight += packaging.totalWeight ?? 0
      summary.estimatedVolume +=
        (packaging.packageVolumeM3 ?? 0) *
        (packaging.unitQuantity / packaging.unitsPerBox)
      summary.billableWeight += packaging.billableWeight ?? 0

      if (packaging.palletShare) {
        summary.palletShare += packaging.palletShare
      }

      return summary
    },
    {
      boxes: 0,
      boxedUnits: 0,
      looseUnits: 0,
      totalUnits: 0,
      estimatedWeight: 0,
      estimatedVolume: 0,
      billableWeight: 0,
      palletShare: 0,
    }
  )
}

export const estimateShipmentMode = (summary: {
  boxes: number
  palletShare: number
  estimatedWeight: number
  billableWeight: number
}) => {
  if (summary.palletShare >= 0.75 || summary.billableWeight >= 120) {
    return "Pallet / carga parcial"
  }

  if (summary.boxes >= 4 || summary.billableWeight >= 35) {
    return "Paqueteria multi-bulto"
  }

  return "Paqueteria estandar"
}

export const estimateFreightCost = (summary: {
  boxes: number
  palletShare: number
  billableWeight: number
}) => {
  return getRecommendedCarrierRate(summary)?.estimatedCost ?? 0
}

export const estimateCarrierRates = (
  summary: {
    boxes: number
    palletShare: number
    estimatedWeight?: number
    billableWeight: number
  },
  zone = "Peninsula"
): CarrierRateEstimate[] => {
  const billableWeight = Math.max(summary.billableWeight || 0, 1)
  const boxes = Math.max(summary.boxes || 0, 1)
  const palletCount = Math.max(Math.ceil(summary.palletShare || 0), 0)
  const isPallet = summary.palletShare >= 0.75 || billableWeight >= 120
  const isMultiParcel = summary.boxes >= 4 || billableWeight >= 35

  const zoneMultiplier =
    zone.toLowerCase().includes("canarias") ||
    zone.toLowerCase().includes("internacional")
      ? 1.85
      : zone.toLowerCase().includes("baleares")
        ? 1.35
        : 1

  const rates: CarrierRateEstimate[] = [
    {
      carrier: "SEUR Industrial",
      service: isPallet ? "Pallet 24/48h" : isMultiParcel ? "Multi-bulto" : "Paqueteria 24h",
      zone,
      transitDays: zoneMultiplier > 1.3 ? "48-96h" : "24-48h",
      billableWeight,
      estimatedCost: Math.round((9.5 + boxes * 3.2 + billableWeight * 0.28) * zoneMultiplier),
      notes: "Mejor opcion para bulto pequeno y entregas rápidas.",
      recommended: !isPallet && !isMultiParcel,
    },
    {
      carrier: "DHL Freight",
      service: isPallet ? "EuroConnect pallet" : "Parcel Connect B2B",
      zone,
      transitDays: zoneMultiplier > 1.3 ? "72-120h" : "48-72h",
      billableWeight,
      estimatedCost: Math.round((18 + boxes * 4.4 + billableWeight * 0.24) * zoneMultiplier),
      notes: "Equilibrio para multi-bulto y entregas regionales.",
      recommended: isMultiParcel && !isPallet,
    },
    {
      carrier: "DB Schenker",
      service: "Pallet System",
      zone,
      transitDays: zoneMultiplier > 1.3 ? "72-120h" : "48-96h",
      billableWeight,
      estimatedCost: Math.round(
        (62 + Math.max(palletCount, 1) * 48 + billableWeight * 0.18) *
          zoneMultiplier
      ),
      notes: "Recomendado para pallet, volumen alto o carga parcial.",
      recommended: isPallet,
    },
  ]

  if (!rates.some((rate) => rate.recommended)) {
    const cheapest = rates.reduce((best, rate) =>
      rate.estimatedCost < best.estimatedCost ? rate : best
    )
    cheapest.recommended = true
  }

  return rates.sort((left, right) => left.estimatedCost - right.estimatedCost)
}

export const getRecommendedCarrierRate = (
  summary: {
    boxes: number
    palletShare: number
    estimatedWeight?: number
    billableWeight: number
  },
  zone = "Peninsula"
) => {
  const rates = estimateCarrierRates(summary, zone)

  return rates.find((rate) => rate.recommended) || rates[0]
}
