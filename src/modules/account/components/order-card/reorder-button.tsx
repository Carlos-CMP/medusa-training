"use client"

import { addToCartBulk } from "@/lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useParams, useRouter } from "next/navigation"
import { useTransition } from "react"

type ReorderButtonProps = {
  disabled?: boolean
  lineItems: HttpTypes.StoreAddCartLineItem[]
  lineCount: number
}

const ReorderButton = ({
  disabled = false,
  lineItems,
  lineCount,
}: ReorderButtonProps) => {
  const router = useRouter()
  const { countryCode } = useParams()
  const [isPending, startTransition] = useTransition()

  const handleReorder = () => {
    if (!lineItems.length) {
      toast.error("No hay líneas disponibles para repetir")
      return
    }

    startTransition(async () => {
      await addToCartBulk({
        lineItems,
        countryCode: countryCode as string,
      })
        .then(() => {
          toast.success(`${lineCount} líneas enviadas al carrito`)
          router.push(`/${countryCode}/cart`)
        })
        .catch(() => {
          toast.error("No se ha podido repetir el pedido")
        })
    })
  }

  return (
    <Button
      data-testid="card-reorder-button"
      variant="primary"
      className="rounded text-xs"
      disabled={disabled || isPending}
      onClick={handleReorder}
    >
      {isPending ? "Añadiendo..." : "Repetir pedido"}
    </Button>
  )
}

export default ReorderButton
