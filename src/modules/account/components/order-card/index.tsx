import { convertToLocale } from "@/lib/util/money"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import CalendarIcon from "@/modules/common/icons/calendar"
import DocumentIcon from "@/modules/common/icons/document"
import { HttpTypes } from "@medusajs/types"
import { Button, clx, Container } from "@medusajs/ui"
import Image from "next/image"
import ReorderButton from "./reorder-button"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const createdAt = new Date(order.created_at)
  const numberOfUnits =
    order.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) ?? 0
  const reorderableItems = (order.items || []).filter((item) => item.variant_id)
  const reorderLineItems = reorderableItems.map((item) => ({
    variant_id: item.variant_id as string,
    quantity: item.quantity,
    metadata: (item.metadata || {}) as Record<string, unknown>,
  }))

  const reorderSummary =
    reorderableItems.length > 0
      ? `${reorderableItems.length} referencias listas para repetir`
      : "Sin líneas repetibles"

  const orderTotal = convertToLocale({
    amount: order.total,
    currency_code: order.currency_code,
  })

  return (
    <Container className="flex flex-col gap-4 rounded-md bg-white p-4">
      <div className="flex flex-col gap-4 small:flex-row small:items-center small:justify-between">
        <div className="flex items-center gap-x-4">
          <div className="flex min-w-10">
            {order.items?.slice(0, 3).map((item, index) => {
              const numItems = order.items?.length ?? 0

              return (
                <div
                  key={item.id}
                  className={clx(
                    "ml-[-5px] block h-7 w-7 rounded-md border border-white bg-neutral-100 bg-cover bg-center p-2",
                    {
                      "-rotate-3": index === 0 && numItems > 1,
                      "rotate-0": index === 0 && numItems === 1,
                      "rotate-3":
                        (index === 1 && numItems === 2) ||
                        (index === 2 && numItems > 2),
                    }
                  )}
                >
                  {item.thumbnail && (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      className={clx("h-full w-full object-cover object-center", {
                        "-rotate-3": index === 0 && numItems > 1,
                        "rotate-0": index === 0 && numItems === 1,
                        "rotate-3":
                          (index === 1 && numItems === 2) ||
                          (index === 2 && numItems > 2),
                      })}
                      draggable={false}
                      quality={50}
                      width={20}
                      height={20}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small-regular">
              <span className="flex items-center" data-testid="order-created-at">
                <CalendarIcon className="mr-1 inline-block" />
                {createdAt.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center">
                <DocumentIcon className="mr-1 inline-block" />
                <span data-testid="order-display-id">#{order.display_id}</span>
              </span>
            </div>
            <p className="text-small-regular text-neutral-500">
              {reorderSummary}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 small:justify-end">
          <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-small-regular text-ui-fg-base">
            <span className="font-semibold" data-testid="order-amount">
              {orderTotal}
            </span>
            <span className="px-2 text-neutral-400">/</span>
            <span>{`${numberOfUnits} ${numberOfUnits > 1 ? "uds" : "ud"}`}</span>
          </div>

          <ReorderButton
            disabled={!reorderLineItems.length}
            lineItems={reorderLineItems}
            lineCount={reorderLineItems.length}
          />
          <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
            <Button
              data-testid="card-details-link"
              variant="secondary"
              className="rounded text-xs"
            >
              Ver detalle
            </Button>
          </LocalizedClientLink>
        </div>
      </div>

      {reorderableItems.length > 0 && (
        <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-neutral-600">
          Al repetir, se copian referencias, cantidades y reglas de packaging
          guardadas. Podras ajustar el carrito antes de confirmar.
        </div>
      )}
    </Container>
  )
}

export default OrderCard
