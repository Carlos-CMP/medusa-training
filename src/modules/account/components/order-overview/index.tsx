"use client"

import OrderCard from "@/modules/account/components/order-card"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex w-full flex-col gap-y-3">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-small-semi text-neutral-950">
            Reorder para compras recurrentes
          </p>
          <p className="mt-1 text-small-regular text-neutral-600">
            Repite un pedido anterior en un clic. El carrito conserva
            referencias, cantidades y reglas de compra B2B para que solo tengas
            que revisar y confirmar.
          </p>
        </div>
        {orders.map((o) => (
          <div key={o.id}>
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi">Sin pedidos todavía</h2>
      <p className="text-base-regular">
        Cuando completes un pedido, aparecerá aquí.
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/" passHref>
          <Button data-testid="continue-shopping-button">
            Ver catálogo
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
