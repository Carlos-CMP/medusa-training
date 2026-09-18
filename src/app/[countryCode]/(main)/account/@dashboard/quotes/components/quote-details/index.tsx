"use client"

import { acceptQuote, rejectQuote } from "@/lib/data/quotes"
import { getQuoteExportPackagingSummary } from "@/lib/util/convert-quote-to-export"
import {
  estimateCarrierRates,
  estimateFreightCost,
  estimateShipmentMode,
} from "@/lib/util/b2b-packaging"
import { formatAmount } from "@/modules/common/components/amount-cell"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { PromptModal } from "@/modules/common/components/prompt-modal"
import { B2BCustomer } from "@/types/global"
import { StoreQuoteResponse } from "@/types/quote"
import { ArrowUturnLeft, CheckCircleSolid } from "@medusajs/icons"
import { AdminOrderLineItem, AdminOrderPreview } from "@medusajs/types"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import React, { useMemo, useState } from "react"
import QuoteMessages from "../quote-messages"
import QuoteExportButtons from "../quote-export-buttons"
import QuoteStatusBadge from "../quote-status-badge"
import { QuoteTableItem } from "../quote-table"

type QuoteDetailsProps = {
  quote: StoreQuoteResponse["quote"] & {
    customer: B2BCustomer
  }
  preview: AdminOrderPreview
  countryCode: string
}

const QuoteDetails: React.FC<QuoteDetailsProps> = ({
  quote,
  preview,
  countryCode,
}) => {
  const order = quote.draft_order
  const currencyCode = order?.currency_code || "eur"
  const logisticsSummary = useMemo(
    () => getQuoteExportPackagingSummary(quote, preview),
    [quote, preview]
  )
  const shipmentMode = estimateShipmentMode(logisticsSummary)
  const estimatedFreight = estimateFreightCost(logisticsSummary)
  const carrierRates = estimateCarrierRates(logisticsSummary)
  const originalItemsMap = useMemo(() => {
    return new Map<string, AdminOrderLineItem>(
      order?.items?.map((item: AdminOrderLineItem) => [item.id, item]) || []
    )
  }, [order])
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  return (
    <div className="flex flex-col gap-y-2 p-0">
      <div className="flex gap-2 justify-between items-center mb-2">
        <LocalizedClientLink
          href="/account/quotes"
          className="flex gap-2 items-center text-ui-fg-subtle hover:text-ui-fg-base"
          data-testid="back-to-overview-button"
        >
          <Button variant="secondary">
            <ArrowUturnLeft /> Volver
          </Button>
        </LocalizedClientLink>
      </div>

      <div className="small:grid small:grid-cols-6 flex flex-col-reverse small:gap-4 gap-2">
        <div className="small:col-span-4 flex flex-col gap-y-2">
          {quote.status === "accepted" && (
            <Container className="p-0">
              <div className="flex items-center justify-between px-6 py-4">
                <Text className="txt-compact-small">
                  <CheckCircleSolid className="inline-block mr-2 text-green-500 text-lg" />
                  Presupuesto aceptado por el cliente. El pedido ya está listo
                  para procesarse.
                </Text>

                <Button
                  size="small"
                  onClick={() =>
                    router.push(
                      `/${countryCode}/account/orders/details/${quote.draft_order_id || ""}`
                    )
                  }
                  disabled={!quote.draft_order_id}
                >
                  Ver pedido
                </Button>
              </div>
            </Container>
          )}

          {(preview.items || []).map((item) => (
            <Container key={item.id}>
              <QuoteTableItem
                key={item.id}
                item={item}
                originalItem={originalItemsMap.get(item.id)}
                currencyCode={currencyCode}
              />
            </Container>
          ))}

          <Container className="p-0">
            <div className="py-4">
              <div className="flex items-center justify-between mb-2 px-6">
                <span className="txt-small text-ui-fg-subtle font-semibold">
                  Total actual
                </span>

                <span className="txt-small text-ui-fg-subtle">
                  {formatAmount(order?.total || 0, currencyCode)}
                </span>
              </div>

              <div className="flex items-center justify-between px-6">
                <span className="txt-small text-ui-fg-subtle font-semibold">
                  Nuevo total
                </span>

                <span className="txt-small text-ui-fg-subtle">
                  {formatAmount(preview.total || 0, currencyCode)}
                </span>
              </div>
            </div>
          </Container>

          {quote.status === "pending_customer" && (
            <div className="flex gap-x-3 justify-end my-4">
              <PromptModal
                title="Rechazar presupuesto"
                description="Esta acción no se puede deshacer."
                handleAction={async () => {
                  setIsRejecting(true)

                  try {
                    await rejectQuote(quote.id)
                    toast.success("Presupuesto rechazado")
                    router.refresh()
                  } catch (e) {
                    toast.error((e as Error).message)
                  } finally {
                    setIsRejecting(false)
                  }
                }}
                isLoading={isRejecting}
              >
                <Button size="small" variant="secondary">
                  Rechazar
                </Button>
              </PromptModal>

              <PromptModal
                title="Aceptar presupuesto"
                description="Esta acción no se puede deshacer."
                handleAction={async () => {
                  setIsAccepting(true)

                  try {
                    await acceptQuote(quote.id)
                    toast.success("Presupuesto aceptado")
                    router.refresh()
                  } catch (e) {
                    toast.error((e as Error).message)
                  } finally {
                    setIsAccepting(false)
                  }
                }}
                isLoading={isAccepting}
              >
                <Button size="small" variant="primary">
                  Aceptar
                </Button>
              </PromptModal>
            </div>
          )}

          <QuoteMessages quote={quote} preview={preview} />
        </div>

        <div className="col-span-2 flex flex-col gap-y-2">
          <Container className="flex gap-x-3 justify-between">
            <div className="text-sm">
              <span className="font-semibold text-ui-fg-subtle">
                Presupuesto:
              </span>{" "}
              #<span>{order?.display_id || "-"}</span>
            </div>

            <QuoteStatusBadge status={quote.status} />
          </Container>

          <Container>
            <Heading level="h3" className="mb-3">
              Exportar presupuesto
            </Heading>
            <QuoteExportButtons quote={quote} preview={preview} />
          </Container>

          <Container>
            <Heading level="h3" className="mb-3">
              Logística B2B
            </Heading>
            <div className="grid gap-2 text-sm text-ui-fg-subtle">
              <QuoteLogisticsRow
                label="Bultos"
                value={`${logisticsSummary.boxes} cajas`}
              />
              <QuoteLogisticsRow
                label="Unidades totales"
                value={`${logisticsSummary.totalUnits} uds`}
              />
              <QuoteLogisticsRow
                label="Unidades sueltas"
                value={`${logisticsSummary.looseUnits} uds`}
              />
              <QuoteLogisticsRow
                label="Peso estimado"
                value={`${logisticsSummary.estimatedWeight.toFixed(1)} kg`}
              />
              <QuoteLogisticsRow
                label="Volumen estimado"
                value={`${logisticsSummary.estimatedVolume.toFixed(3)} m3`}
              />
              <QuoteLogisticsRow
                label="Peso facturable"
                value={`${logisticsSummary.billableWeight.toFixed(1)} kg`}
              />
              <QuoteLogisticsRow
                label="Ocupacion pallet"
                value={`${logisticsSummary.palletShare.toFixed(2)} pallets`}
              />
              <QuoteLogisticsRow label="Expedicion" value={shipmentMode} />
              <QuoteLogisticsRow
                label="Coste transporte demo"
                value={`~${formatAmount(estimatedFreight, currencyCode)}`}
              />
            </div>
            <div className="mt-4 grid gap-2 border-t pt-3">
              <Text className="text-xs font-semibold uppercase text-ui-fg-subtle">
                Transportistas simulados
              </Text>
              {carrierRates.slice(0, 3).map((rate) => (
                <div
                  key={rate.carrier}
                  className="rounded-md border bg-ui-bg-subtle p-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Text weight="plus">{rate.carrier}</Text>
                    <Text weight="plus">
                      ~{formatAmount(rate.estimatedCost, currencyCode)}
                    </Text>
                  </div>
                  <Text className="text-xs text-ui-fg-subtle">
                    {rate.service} - {rate.transitDays}
                    {rate.recommended ? " - recomendada" : ""}
                  </Text>
                </div>
              ))}
            </div>
            <Text className="mt-3 text-xs text-ui-fg-muted">
              Estimación operativa calculada desde packaging, volumen y peso
              facturable. No sustituye tarifas reales de transportista.
            </Text>
          </Container>

          <Container>
            <Heading level="h3" className="mb-2">
              Cliente
            </Heading>

            <div className="text-sm text-ui-fg-subtle">
              <div className="flex justify-between">
                <Text>Email</Text>
                <Text>{quote.customer?.email || "-"}</Text>
              </div>

              <div className="flex justify-between">
                <Text>Teléfono</Text>
                <Text>{quote.customer?.phone || "-"}</Text>
              </div>

              <div className="flex justify-between">
                <Text>Limite de compra</Text>
                <Text>
                  {(quote.customer?.employee?.spending_limit &&
                    formatAmount(
                      quote.customer?.employee?.spending_limit || 0,
                      currencyCode.toUpperCase()
                    )) ||
                    "-"}
                </Text>
              </div>
            </div>
          </Container>

          <Container>
            <Heading level="h3" className="mb-2">
              Empresa
            </Heading>

            <div className="text-sm text-ui-fg-subtle">
              <div className="flex justify-between">
                <Text>Nombre</Text>
                <Text>{quote.customer?.employee?.company?.name || "-"}</Text>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  )
}

const QuoteLogisticsRow = ({
  label,
  value,
}: {
  label: string
  value: string
}) => (
  <div className="flex items-center justify-between gap-3 rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2">
    <Text className="text-xs text-ui-fg-subtle">{label}</Text>
    <Text className="text-xs font-semibold text-ui-fg-base">{value}</Text>
  </div>
)

export default QuoteDetails
