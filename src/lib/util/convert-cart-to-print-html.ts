import { B2BCart } from "@/types/global"
import { HttpTypes } from "@medusajs/types"
import {
  estimateCarrierRates,
  formatPackagingDetails,
  formatPackagingLine,
  getCartLinePackaging,
  getCartPackagingSummary,
} from "./b2b-packaging"
import { convertToLocale } from "./money"

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

const getLineTotal = (item: HttpTypes.StoreCartLineItem) =>
  item.total ?? item.quantity * item.unit_price

export function cartToPrintHtml(cart: B2BCart) {
  const currencyCode = cart.currency_code ?? "eur"
  const summary = getCartPackagingSummary(cart.items)
  const carrierRates = estimateCarrierRates(summary)
  const recommendedCarrier = carrierRates.find((rate) => rate.recommended)
  const createdAt = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date())

  const rows = (cart.items || [])
    .map((item) => {
      const packaging = getCartLinePackaging(item.metadata, item.quantity)
      const packagingText = packaging
        ? `${formatPackagingLine(packaging)}${
            formatPackagingDetails(packaging)
              ? `<br/><span>${escapeHtml(formatPackagingDetails(packaging))}</span>`
              : ""
          }`
        : `${item.quantity} uds`

      return `
        <tr>
          <td>
            <strong>${escapeHtml(item.product_title)}</strong>
            <span>${escapeHtml(item.variant_title || item.variant_sku || "")}</span>
            <small>SKU: ${escapeHtml(item.variant_sku || "-")}</small>
          </td>
          <td>${packagingText}</td>
          <td class="number">${escapeHtml(item.quantity)}</td>
          <td class="number">${escapeHtml(formatMoney(item.unit_price, currencyCode))}</td>
          <td class="number">${escapeHtml(formatMoney(getLineTotal(item), currencyCode))}</td>
        </tr>
      `
    })
    .join("")

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Presupuesto B2B ${escapeHtml(cart.id)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #111;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        line-height: 1.4;
      }
      .page { padding: 32px; }
      header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 2px solid #111;
        padding-bottom: 18px;
        margin-bottom: 24px;
      }
      h1 { margin: 0; font-size: 24px; letter-spacing: 0; }
      h2 { margin: 24px 0 8px; font-size: 14px; }
      .muted { color: #666; }
      .box {
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 12px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 20px;
      }
      .metric strong {
        display: block;
        font-size: 16px;
        margin-top: 4px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      th, td {
        border-bottom: 1px solid #ddd;
        padding: 10px 8px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #f3f3f3;
        color: #111;
        font-size: 11px;
        text-transform: uppercase;
      }
      td span, td small {
        display: block;
        color: #666;
      }
      .number { text-align: right; white-space: nowrap; }
      .totals {
        margin-left: auto;
        margin-top: 18px;
        width: 280px;
      }
      .totals div {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #eee;
      }
      .totals .grand {
        border-bottom: 0;
        font-size: 16px;
        font-weight: 700;
      }
      footer {
        margin-top: 32px;
        padding-top: 12px;
        border-top: 1px solid #ddd;
        color: #666;
        font-size: 11px;
      }
      @media print {
        .page { padding: 18mm; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header>
        <div>
          <h1>Presupuesto B2B</h1>
          <p class="muted">Portal industrial Medusa B2B</p>
        </div>
        <div>
          <strong>ID carrito</strong><br/>
          <span class="muted">${escapeHtml(cart.id)}</span><br/>
          <strong>Fecha</strong><br/>
          <span class="muted">${escapeHtml(createdAt)}</span>
        </div>
      </header>

      <section class="grid">
        <div class="box metric">Bultos<strong>${summary.boxes} cajas</strong></div>
        <div class="box metric">Unidades<strong>${summary.totalUnits} uds</strong></div>
        <div class="box metric">Peso estimado<strong>${summary.estimatedWeight.toFixed(1)} kg</strong></div>
        <div class="box metric">Ocupacion pallet<strong>${summary.palletShare.toFixed(2)}</strong></div>
        <div class="box metric">Peso facturable<strong>${summary.billableWeight.toFixed(1)} kg</strong></div>
        <div class="box metric">Transportista<strong>${escapeHtml(recommendedCarrier?.carrier || "-")}</strong></div>
      </section>

      <h2>Transportistas simulados</h2>
      <table>
        <thead>
          <tr>
            <th>Transportista</th>
            <th>Servicio</th>
            <th>Transito</th>
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
                  <td class="number">${escapeHtml(formatMoney(rate.estimatedCost, currencyCode))}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>

      <h2>Líneas del presupuesto</h2>
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
        <tbody>${rows}</tbody>
      </table>

      <section class="totals">
        <div><span>Subtotal</span><strong>${escapeHtml(formatMoney(cart.item_subtotal, currencyCode))}</strong></div>
        <div><span>Descuento</span><strong>${escapeHtml(formatMoney(cart.discount_total, currencyCode))}</strong></div>
        <div><span>Envío</span><strong>${escapeHtml(formatMoney(cart.shipping_total, currencyCode))}</strong></div>
        <div><span>Impuestos</span><strong>${escapeHtml(formatMoney(cart.tax_total, currencyCode))}</strong></div>
        <div class="grand"><span>Total</span><strong>${escapeHtml(formatMoney(cart.total, currencyCode))}</strong></div>
      </section>

      <footer>
        Documento generado desde el portal B2B. Pesos, bultos y ocupación de pallet son estimaciones operativas según reglas de packaging configuradas.
      </footer>
    </main>
  </body>
</html>`
}
