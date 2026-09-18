"use client"

import { cartToPrintHtml } from "@/lib/util/convert-cart-to-print-html"
import Button from "@/modules/common/components/button"
import { B2BCart } from "@/types"
import { Text } from "@medusajs/ui"
import { useState } from "react"

type CartToPdfButtonProps = {
  cart: B2BCart
}

const CartToPdfButton = ({ cart }: CartToPdfButtonProps) => {
  const [error, setError] = useState<string | null>(null)

  const handleExportPdf = () => {
    setError(null)

    const printWindow = window.open("", "_blank", "width=1024,height=768")

    if (!printWindow) {
      setError("El navegador ha bloqueado la ventana de impresion.")
      return
    }

    printWindow.document.open()
    printWindow.document.write(cartToPrintHtml(cart))
    printWindow.document.close()
    printWindow.focus()

    window.setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  return (
    <div className="flex flex-col gap-y-2 items-center">
      <Button
        className="w-full h-10 rounded-md shadow-borders-base"
        variant="secondary"
        onClick={handleExportPdf}
      >
        Exportar PDF
      </Button>
      {error && <Text className="text-red-500">{error}</Text>}
    </div>
  )
}

export default CartToPdfButton
