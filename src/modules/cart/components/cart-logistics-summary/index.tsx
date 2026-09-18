"use client"

import { useCart } from "@/lib/context/cart-context"
import {
  estimateCarrierRates,
  getCartPackagingSummary,
} from "@/lib/util/b2b-packaging"
import { Text } from "@medusajs/ui"

const CartLogisticsSummary = () => {
  const { cart } = useCart()

  if (!cart?.items?.length) {
    return null
  }

  const summary = getCartPackagingSummary(cart.items)
  const carrierRates = estimateCarrierRates(summary)
  const hasPackaging =
    summary.boxes > 0 || summary.estimatedWeight > 0 || summary.palletShare > 0

  if (!hasPackaging) {
    return null
  }

  const rows = [
    {
      label: "Bultos",
      value: `${summary.boxes} cajas`,
      show: summary.boxes > 0,
    },
    {
      label: "Unidades",
      value: `${summary.totalUnits} uds`,
      show: summary.totalUnits > 0,
    },
    {
      label: "Peso estimado",
      value: `${summary.estimatedWeight.toFixed(1)} kg`,
      show: summary.estimatedWeight > 0,
    },
    {
      label: "Ocupacion pallet",
      value: `${summary.palletShare.toFixed(2)} pallets`,
      show: summary.palletShare > 0,
    },
  ].filter((row) => row.show)

  return (
    <section className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-normal text-neutral-950">
        Logística B2B
      </Text>
      <div className="grid gap-1 text-xs text-neutral-700">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span>{row.label}</span>
            <span className="font-medium text-neutral-950">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-neutral-200 pt-3">
        <Text className="mb-2 text-[11px] font-semibold uppercase tracking-normal text-neutral-950">
          Transportistas demo
        </Text>
        <div className="grid gap-2">
          {carrierRates.slice(0, 3).map((rate) => (
            <div
              key={rate.carrier}
              className="flex items-start justify-between gap-3 text-xs text-neutral-700"
            >
              <div>
                <span className="font-medium text-neutral-950">
                  {rate.carrier}
                </span>
                <span className="block text-[11px] text-neutral-500">
                  {rate.service} - {rate.transitDays}
                </span>
              </div>
              <span className="whitespace-nowrap font-semibold text-neutral-950">
                ~{rate.estimatedCost} EUR
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CartLogisticsSummary
