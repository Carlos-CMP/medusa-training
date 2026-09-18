import {
  estimateCarrierRates,
  estimateFreightCost,
  estimateShipmentMode,
  formatPackagingDetails,
  formatPackagingLine,
  getCartLinePackaging,
  getCartPackagingSummary,
} from "@/lib/util/b2b-packaging"
import { StoreQuoteResponse } from "@/types/quote"
import { AdminOrderLineItem, AdminOrderPreview } from "@medusajs/types"
import { convertToLocale } from "./money"

type ExportableQuote = StoreQuoteResponse["quote"]

const escapeCsv = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

const formatMoney = (amount: number | null | undefined, currencyCode: string) =>
  convertToLocale({
    amount: amount ?? 0,
    currency_code: currencyCode,
    locale: "es-ES",
  })

const getOriginalItemsById = (quote: ExportableQuote) =>
  new Map<string, AdminOrderLineItem>(
    (quote.draft_order?.items || []).map((item: AdminOrderLineItem) => [
      item.id,
      item,
    ])
  )

const getPreviewLineMetadata = (
  item: AdminOrderPreview["items"][0],
  originalItem?: AdminOrderLineItem
) =>
  ((item as { metadata?: Record<string, unknown> | null }).metadata ||
    (originalItem as { metadata?: Record<string, unknown> | null } | undefined)
      ?.metadata ||
    null) as Record<string, unknown> | null

const getLineTotal = (item: AdminOrderPreview["items"][0]) =>
  item.total ?? item.quantity * item.unit_price

const getExportRows = (quote: ExportableQuote, preview: AdminOrderPreview) => {
  const originalItemsById = getOriginalItemsById(quote)

  return (preview.items || []).map((item) => {
    const originalItem = originalItemsById.get(item.id)
    const metadata = getPreviewLineMetadata(item, originalItem)
    const packaging = getCartLinePackaging(metadata, item.quantity)

    return {
      item,
      originalItem,
      packaging,
      packagingLine: packaging
        ? formatPackagingLine(packaging)
        : `${item.quantity} uds`,
      packagingDetails: packaging ? formatPackagingDetails(packaging) : "",
      total: getLineTotal(item),
    }
  })
}

export const quoteToCsv = (
  quote: ExportableQuote,
  preview: AdminOrderPreview
) => {
  const rows = getExportRows(quote, preview)
  const currencyCode = quote.draft_order?.currency_code || "eur"
  const summary = getQuoteExportPackagingSummary(quote, preview)
  const shipmentMode = estimateShipmentMode(summary)
  const freightCost = estimateFreightCost(summary)
  const recommendedCarrier = estimateCarrierRates(summary).find(
    (rate) => rate.recommended
  )
  const header = [
    "Quote ID",
    "Display ID",
    "Status",
    "Company",
    "Customer Email",
    "SKU",
    "Product",
    "Variant",
    "Quantity",
    "Unit Price",
    "Line Total",
    "Purchase Unit",
    "Packages",
    "Units Per Box",
    "Total Units",
    "Estimated Weight Kg",
    "Estimated Volume M3",
    "Billable Weight Kg",
    "Package Dimensions",
    "Boxes Per Pallet",
    "Pallet Share",
    "Shipment Mode",
    "Recommended Carrier",
    "Estimated Freight",
  ]

  const body = rows.map(({ item, packaging, total }) => [
    quote.id,
    quote.draft_order?.display_id || "",
    quote.status,
    quote.customer?.employee?.company?.name || "",
    quote.customer?.email || "",
    item.variant_sku || "",
    item.product_title || "",
    item.variant_title || "",
    item.quantity,
    formatMoney(item.unit_price, currencyCode),
    formatMoney(total, currencyCode),
    packaging ? "box" : "unit",
    packaging?.packageQuantity ?? "",
    packaging?.unitsPerBox ?? "",
    packaging?.unitQuantity ?? item.quantity,
    packaging?.totalWeight ? packaging.totalWeight.toFixed(1) : "",
    packaging?.packageVolumeM3
      ? (
          packaging.packageVolumeM3 *
          (packaging.unitQuantity / packaging.unitsPerBox)
        ).toFixed(3)
      : "",
    packaging?.billableWeight ? packaging.billableWeight.toFixed(1) : "",
    packaging?.packageDimensions ?? "",
    packaging?.boxesPerPallet ?? "",
    packaging?.palletShare ? packaging.palletShare.toFixed(2) : "",
    shipmentMode,
    recommendedCarrier
      ? `${recommendedCarrier.carrier} - ${recommendedCarrier.service}`
      : "",
    formatMoney(freightCost, currencyCode),
  ])

  const summaryRows = [
    [],
    ["Summary"],
    ["Boxes", summary.boxes],
    ["Total units", summary.totalUnits],
    ["Loose units", summary.looseUnits],
    ["Estimated weight kg", summary.estimatedWeight.toFixed(1)],
    ["Estimated volume m3", summary.estimatedVolume.toFixed(3)],
    ["Billable weight kg", summary.billableWeight.toFixed(1)],
    ["Pallet share", summary.palletShare.toFixed(2)],
    ["Shipment mode", shipmentMode],
    [
      "Recommended carrier",
      recommendedCarrier
        ? `${recommendedCarrier.carrier} - ${recommendedCarrier.service}`
        : "",
    ],
    ["Estimated freight", formatMoney(freightCost, currencyCode)],
  ]

  return [header, ...body, ...summaryRows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n")
}

export const getQuoteExportPackagingSummary = (
  quote: ExportableQuote,
  preview: AdminOrderPreview
) => {
  const originalItemsById = getOriginalItemsById(quote)

  return getCartPackagingSummary(
    (preview.items || []).map((item) => ({
      quantity: item.quantity,
      metadata: getPreviewLineMetadata(item, originalItemsById.get(item.id)),
    }))
  )
}

export const quoteToPrintHtml = (
  quote: ExportableQuote,
  preview: AdminOrderPreview
) => {
  const currencyCode = quote.draft_order?.currency_code || "eur"
  const summary = getQuoteExportPackagingSummary(quote, preview)
  const shipmentMode = estimateShipmentMode(summary)
  const freightCost = estimateFreightCost(summary)
  const carrierRates = estimateCarrierRates(summary)
  const recommendedCarrier = carrierRates.find((rate) => rate.recommended)
  const rows = getExportRows(quote, preview)
  const createdAt = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date())

  const tableRows = rows
    .map(({ item, packagingLine, packagingDetails, total }) => `
      <tr>
        <td>
          <strong>${escapeHtml(item.product_title)}</strong>
          <span>${escapeHtml(item.variant_title || "")}</span>
          <small>SKU: ${escapeHtml(item.variant_sku || "-")}</small>
        </td>
        <td>
          ${escapeHtml(packagingLine)}
          ${packagingDetails ? `<small>${escapeHtml(packagingDetails)}</small>` : ""}
        </td>
        <td class="number">${escapeHtml(item.quantity)}</td>
        <td class="number">${escapeHtml(formatMoney(item.unit_price, currencyCode))}</td>
        <td class="number">${escapeHtml(formatMoney(total, currencyCode))}</td>
      </tr>
    `)
    .join("")

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Presupuesto ${escapeHtml(quote.draft_order?.display_id || quote.id)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.4; }
      .page { padding: 32px; }
      header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111; padding-bottom: 18px; margin-bottom: 24px; }
      h1 { margin: 0; font-size: 24px; letter-spacing: 0; }
      h2 { margin: 24px 0 8px; font-size: 14px; }
      .muted { color: #666; }
      .box { border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
      .metric strong { display: block; font-size: 16px; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border-bottom: 1px solid #ddd; padding: 10px 8px; text-align: left; vertical-align: top; }
      th { background: #f3f3f3; color: #111; font-size: 11px; text-transform: uppercase; }
      td span, td small { display: block; color: #666; }
      .number { text-align: right; white-space: nowrap; }
      .totals { margin-left: auto; margin-top: 18px; width: 280px; }
      .totals div { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
      .totals .grand { border-bottom: 0; font-size: 16px; font-weight: 700; }
      footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; color: #666; font-size: 11px; }
      @media print { .page { padding: 18mm; } }
    </style>
  </head>
  <body>
    <main class="page">
      <header>
        <div>
          <h1>Presupuesto B2B</h1>
          <p class="muted">#${escapeHtml(quote.draft_order?.display_id || quote.id)}</p>
        </div>
        <div>
          <strong>Empresa</strong><br/>
          <span class="muted">${escapeHtml(quote.customer?.employee?.company?.name || "-")}</span><br/>
          <strong>Cliente</strong><br/>
          <span class="muted">${escapeHtml(quote.customer?.email || "-")}</span><br/>
          <strong>Fecha exportacion</strong><br/>
          <span class="muted">${escapeHtml(createdAt)}</span>
        </div>
      </header>

      <section class="grid">
        <div class="box metric">Bultos<strong>${summary.boxes} cajas</strong></div>
        <div class="box metric">Unidades<strong>${summary.totalUnits} uds</strong></div>
        <div class="box metric">Peso estimado<strong>${summary.estimatedWeight.toFixed(1)} kg</strong></div>
        <div class="box metric">Volumen<strong>${summary.estimatedVolume.toFixed(3)} m3</strong></div>
        <div class="box metric">Peso facturable<strong>${summary.billableWeight.toFixed(1)} kg</strong></div>
        <div class="box metric">Ocupacion pallet<strong>${summary.palletShare.toFixed(2)}</strong></div>
        <div class="box metric">Expedicion<strong>${escapeHtml(shipmentMode)}</strong></div>
        <div class="box metric">Transportista<strong>${escapeHtml(recommendedCarrier?.carrier || "-")}</strong></div>
        <div class="box metric">Transporte demo<strong>${escapeHtml(formatMoney(freightCost, currencyCode))}</strong></div>
      </section>

      <h2>Transportistas simulados</h2>
      <table>
        <thead>
          <tr>
            <th>Transportista</th>
            <th>Servicio</th>
            <th>Transito</th>
            <th class="number">Peso facturable</th>
            <th class="number">Coste demo</th>
          </tr>
        </thead>
        <tbody>
          ${carrierRates
            .map(
              (rate) => `
                <tr>
                  <td>${escapeHtml(rate.carrier)}${rate.recommended ? " (recomendada)" : ""}</td>
                  <td>${escapeHtml(rate.service)}</td>
                  <td>${escapeHtml(rate.transitDays)}</td>
                  <td class="number">${escapeHtml(rate.billableWeight.toFixed(1))} kg</td>
                  <td class="number">${escapeHtml(formatMoney(rate.estimatedCost, currencyCode))}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>

      <h2>Líneas</h2>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Packaging</th>
            <th class="number">Uds</th>
            <th class="number">Precio unit.</th>
            <th class="number">Total línea</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <section class="totals">
        <div><span>Total actual</span><strong>${escapeHtml(formatMoney(quote.draft_order?.total, currencyCode))}</strong></div>
        <div class="grand"><span>Total presupuesto</span><strong>${escapeHtml(formatMoney(preview.total, currencyCode))}</strong></div>
      </section>

      <footer>
        Documento generado desde el portal B2B. Pesos, bultos y ocupación de pallet son estimaciones operativas según reglas de packaging configuradas.
      </footer>
    </main>
  </body>
</html>`
}
