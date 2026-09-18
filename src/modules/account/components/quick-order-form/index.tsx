"use client"

import {
  QuickOrderResolvedItem,
  resolveQuickOrderSkus,
} from "@/lib/data/quick-order"
import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import Button from "@/modules/common/components/button"
import { StoreProduct, StoreProductVariant } from "@medusajs/types"
import { toast } from "@medusajs/ui"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"

type PurchaseUnit = "unit" | "box"

type QuickOrderDraftLine = {
  id: string
  sku: string
  quantity: number
  purchaseUnit: PurchaseUnit
  resolved?: QuickOrderResolvedItem
  error?: string
}

type QuickOrderFormProps = {
  regionId: string
}

const defaultLines: QuickOrderDraftLine[] = [
  {
    id: "line-1",
    sku: "NGS-WILD-BASH-COMPACT-BLK",
    quantity: 2,
    purchaseUnit: "box",
  },
  {
    id: "line-2",
    sku: "NGS-EVO-MOUSE-WHT",
    quantity: 24,
    purchaseUnit: "unit",
  },
  {
    id: "line-3",
    sku: "",
    quantity: 1,
    purchaseUnit: "unit",
  },
]

const createLine = (): QuickOrderDraftLine => ({
  id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  sku: "",
  quantity: 1,
  purchaseUnit: "unit",
})

const validateLine = (line: QuickOrderDraftLine) => {
  const packaging = line.resolved?.packaging

  if (!line.sku.trim()) {
    return undefined
  }

  if (!line.resolved) {
    return "SKU no encontrado"
  }

  if (!packaging) {
    return undefined
  }

  const totalUnits =
    line.purchaseUnit === "box"
      ? line.quantity * packaging.units_per_box
      : line.quantity

  if (totalUnits < packaging.minimum_order_quantity) {
    return `Mínimo ${packaging.minimum_order_quantity} uds`
  }

  if (totalUnits % packaging.quantity_increment !== 0) {
    return `Múltiplo ${packaging.quantity_increment} uds`
  }

  return undefined
}

const getTotalUnits = (line: QuickOrderDraftLine) => {
  if (line.purchaseUnit === "box") {
    return line.quantity * (line.resolved?.packaging?.units_per_box || 1)
  }

  return line.quantity
}

const getPackageQuantity = (line: QuickOrderDraftLine) => {
  const packaging = line.resolved?.packaging

  if (!packaging || line.purchaseUnit !== "box") {
    return 0
  }

  return line.quantity
}

const getEstimatedWeight = (line: QuickOrderDraftLine) => {
  const packaging = line.resolved?.packaging

  if (!packaging?.package_weight || !packaging.units_per_box) {
    return 0
  }

  return packaging.package_weight * (getTotalUnits(line) / packaging.units_per_box)
}

const getPalletShare = (line: QuickOrderDraftLine) => {
  const packaging = line.resolved?.packaging

  if (!packaging?.boxes_per_pallet || !packaging.units_per_box) {
    return 0
  }

  return (
    getTotalUnits(line) / packaging.units_per_box / packaging.boxes_per_pallet
  )
}

const lineRequiresQuote = (line: QuickOrderDraftLine) =>
  line.resolved?.catalog_rule_summary?.requires_quote === true

const buildMetadata = (line: QuickOrderDraftLine) => {
  const packaging = line.resolved?.packaging
  const totalUnits = getTotalUnits(line)
  const requiresQuote = lineRequiresQuote(line)

  if (!packaging) {
    return {
      purchase_unit: line.purchaseUnit,
      unit_quantity: totalUnits,
      requires_quote: requiresQuote,
      catalog_rule_requires_quote: requiresQuote,
    }
  }

  return {
    purchase_unit: line.purchaseUnit,
    package_quantity: line.purchaseUnit === "box" ? line.quantity : totalUnits,
    units_per_box: packaging.units_per_box,
    unit_quantity: totalUnits,
    minimum_order_quantity: packaging.minimum_order_quantity,
    quantity_increment: packaging.quantity_increment,
    boxes_per_pallet: packaging.boxes_per_pallet,
    package_weight: packaging.package_weight,
    package_dimensions: packaging.package_dimensions,
    requires_quote: requiresQuote,
    catalog_rule_requires_quote: requiresQuote,
  }
}

const QuickOrderForm = ({ regionId }: QuickOrderFormProps) => {
  const [lines, setLines] = useState<QuickOrderDraftLine[]>(defaultLines)
  const [missingSkus, setMissingSkus] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)

  const activeLines = useMemo(
    () => lines.filter((line) => line.sku.trim()),
    [lines]
  )
  const validLines = useMemo(
    () => lines.filter((line) => line.resolved && !line.error),
    [lines]
  )
  const totalUnits = useMemo(
    () => validLines.reduce((acc, line) => acc + getTotalUnits(line), 0),
    [validLines]
  )
  const quickOrderSummary = useMemo(
    () =>
      validLines.reduce(
        (summary, line) => {
          const boxes = getPackageQuantity(line)

          summary.boxes += boxes
          summary.looseUnits += line.purchaseUnit === "unit" ? line.quantity : 0
          summary.estimatedWeight += getEstimatedWeight(line)
          summary.palletShare += getPalletShare(line)
          summary.quoteRequiredLines += lineRequiresQuote(line) ? 1 : 0

          return summary
        },
        {
          boxes: 0,
          looseUnits: 0,
          estimatedWeight: 0,
          palletShare: 0,
          quoteRequiredLines: 0,
        }
      ),
    [validLines]
  )
  const errorLines = useMemo(
    () => lines.filter((line) => line.sku.trim() && line.error).length,
    [lines]
  )

  const updateLine = (
    id: string,
    patch: Partial<Pick<QuickOrderDraftLine, "sku" | "quantity" | "purchaseUnit">>
  ) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== id) {
          return line
        }

        const skuChanged = patch.sku !== undefined && patch.sku !== line.sku
        const nextLine = {
          ...line,
          ...patch,
          sku: (patch.sku ?? line.sku).toUpperCase().trim(),
          quantity: Math.max(
            Number.parseInt(String(patch.quantity ?? line.quantity), 10) || 1,
            1
          ),
          resolved: skuChanged ? undefined : line.resolved,
        }

        return {
          ...nextLine,
          error: skuChanged ? undefined : validateLine(nextLine),
        }
      })
    )
  }

  const addLine = () => {
    setLines((current) => [...current, createLine()])
  }

  const removeLine = (id: string) => {
    setLines((current) =>
      current.length > 1 ? current.filter((line) => line.id !== id) : current
    )
  }

  const clearLines = () => {
    setLines([createLine(), createLine(), createLine()])
    setMissingSkus([])
  }

  const handleResolve = () => {
    const skus = Array.from(
      new Set(activeLines.map((line) => line.sku.trim().toUpperCase()))
    )

    if (!skus.length) {
      toast.error("Introduce al menos un SKU")
      return
    }

    startTransition(async () => {
      const result = await resolveQuickOrderSkus(skus, regionId).catch(
        (error) => {
          toast.error(error.message || "No se pudo validar el pedido rápido")
          return null
        }
      )

      if (!result) {
        return
      }

      const resolvedBySku = new Map(
        result.items.map((item) => [item.sku.toUpperCase(), item])
      )
      const nextMissingSkus = result.missing_skus || []

      setMissingSkus(nextMissingSkus)
      setLines((current) =>
        current.map((line) => {
          if (!line.sku.trim()) {
            return {
              ...line,
              resolved: undefined,
              error: undefined,
            }
          }

          const resolved = resolvedBySku.get(line.sku.trim().toUpperCase())
          const nextLine = {
            ...line,
            resolved,
          }

          return {
            ...nextLine,
            error: validateLine(nextLine),
          }
        })
      )

      toast.success("SKUs validados")
    })
  }

  const handleAddToCart = () => {
    if (!validLines.length) {
      toast.error("No hay líneas validas para añadir")
      return
    }

    setIsAdding(true)
    addToCartEventBus.emitCartAdd({
      regionId,
      lineItems: validLines.map((line) => {
        const resolved = line.resolved!
        return {
          productVariant: {
            ...resolved.variant,
            product: resolved.product as StoreProduct,
          } as StoreProductVariant & { product: StoreProduct },
          quantity: getTotalUnits(line),
          metadata: buildMetadata(line),
        }
      }),
    })
    setIsAdding(false)
    toast.success(`${validLines.length} líneas enviadas al carrito`)
  }

  return (
    <div className="grid gap-5">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-4">
          <div>
            <p className="text-base font-semibold text-neutral-950">
              Introduce referencias
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Añade SKU, elige si compras por unidad o caja y confirma la
              cantidad. La validación aplica mínimos y múltiplos B2B.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addLine}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-950"
            >
              Añadir línea
            </button>
            <button
              type="button"
              onClick={clearLines}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-950"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Compra</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Total uds</th>
                <th className="px-4 py-3">Regla B2B</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const packaging = line.resolved?.packaging
                return (
                  <tr key={line.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <input
                        value={line.sku}
                        onChange={(event) =>
                          updateLine(line.id, { sku: event.target.value })
                        }
                        placeholder="NGS-SKU-001"
                        className="w-full min-w-[220px] rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-sm outline-none transition focus:border-neutral-950"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={line.purchaseUnit}
                        onChange={(event) =>
                          updateLine(line.id, {
                            purchaseUnit: event.target.value as PurchaseUnit,
                          })
                        }
                        className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-950"
                      >
                        <option value="unit">Unidad</option>
                        <option value="box">Caja</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(line.id, {
                            quantity: Number(event.target.value),
                          })
                        }
                        className="w-24 rounded-md border border-neutral-200 px-3 py-2 outline-none transition focus:border-neutral-950"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-950">
                        {line.resolved?.product.title || "-"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {line.resolved?.variant.title || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {line.resolved ? getTotalUnits(line) : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {packaging ? (
                        <>
                          <span>
                            Caja {packaging.units_per_box} uds / min.{" "}
                            {packaging.minimum_order_quantity} / múltiplo{" "}
                            {packaging.quantity_increment}
                          </span>
                          {line.purchaseUnit === "box" ? (
                            <p className="mt-1 text-[11px] text-neutral-400">
                              {line.quantity} cajas x {packaging.units_per_box}{" "}
                              uds = {getTotalUnits(line)} uds
                            </p>
                          ) : null}
                        </>
                      ) : (
                        "Valida el SKU"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {line.error ? (
                        <span className="inline-flex rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                          {line.error}
                        </span>
                      ) : line.resolved ? (
                        <span className="inline-flex rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          Listo
                        </span>
                      ) : line.sku.trim() ? (
                        <span className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-600">
                          Pendiente
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="text-xs font-medium text-neutral-500 underline hover:text-neutral-950"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 border-t border-neutral-200 bg-neutral-50 px-4 py-4 small:grid-cols-6">
          <QuickOrderMetric label="Líneas validas" value={validLines.length} />
          <QuickOrderMetric label="Unidades" value={totalUnits || "-"} />
          <QuickOrderMetric label="Cajas" value={quickOrderSummary.boxes || "-"} />
          <QuickOrderMetric
            label="Peso estimado"
            value={
              quickOrderSummary.estimatedWeight
                ? `${quickOrderSummary.estimatedWeight.toFixed(1)} kg`
                : "-"
            }
          />
          <QuickOrderMetric
            label="Ocupacion pallet"
            value={
              quickOrderSummary.palletShare
                ? quickOrderSummary.palletShare.toFixed(2)
                : "-"
            }
          />
          <QuickOrderMetric
            label="Requiere presupuesto"
            value={quickOrderSummary.quoteRequiredLines || "-"}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3">
          <p className="text-xs text-neutral-500">
            {activeLines.length} líneas introducidas / {errorLines} con revisión
            {missingSkus.length ? ` / no encontrados: ${missingSkus.join(", ")}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleResolve} disabled={isPending}>
              {isPending ? "Validando..." : "Validar SKUs"}
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={isAdding || !validLines.length}
            >
              {isAdding ? "Añadiendo..." : "Añadir al carrito"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <p className="text-sm text-neutral-500">
          El carrito conserva unidades, cajas, peso y ocupación de pallet para
          presupuesto y validación de checkout.
        </p>
        <Link href="/cart" className="text-sm font-semibold text-neutral-950 underline">
          Revisar carrito
        </Link>
      </div>
    </div>
  )
}

const QuickOrderMetric = ({
  label,
  value,
}: {
  label: string
  value: string | number
}) => (
  <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
    <p className="text-[11px] uppercase text-neutral-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-neutral-950">{value}</p>
  </div>
)

export default QuickOrderForm
