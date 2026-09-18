"use client"

import { createCartApproval } from "@/lib/data/cart"
import Button from "@/modules/common/components/button"
import { XCircle } from "@medusajs/icons"
import { toast } from "@medusajs/ui"
import * as Dialog from "@radix-ui/react-dialog"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

type RequestApprovalConfirmationProps = {
  cartId: string
  customerId?: string
  disabled?: boolean
  children?: React.ReactNode
}

const RequestApprovalConfirmation = ({
  cartId,
  customerId = "",
  disabled,
  children,
}: RequestApprovalConfirmationProps) => {
  const [open, setOpen] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const { countryCode } = useParams()
  const router = useRouter()

  const handleRequestApproval = async () => {
    setRequesting(true)

    try {
      await createCartApproval(cartId, customerId)
      toast.success("Solicitud enviada al aprobador")
      setOpen(false)
      router.push(`/${countryCode}/account/orders`)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "No se pudo solicitar la aprobación")
    } finally {
      setRequesting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild disabled={disabled}>
        {children || (
          <Button className="w-full h-10 rounded-md shadow-none">
            Enviar a aprobación
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[75] bg-black/50 data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-[100] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white p-6 shadow-elevation-flyout focus:outline-none">
          <Dialog.Title className="mb-4 flex items-center justify-between text-lg font-semibold text-neutral-950">
            Enviar pedido a aprobación
            <Dialog.Close asChild>
              <button
                aria-label="Cerrar"
                className="inline-flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-950"
              >
                <XCircle />
              </button>
            </Dialog.Close>
          </Dialog.Title>

          <div className="grid gap-3 text-sm leading-6 text-neutral-700">
            <p>
              Este carrito supera tu límite de gasto. Al enviarlo, quedará
              pendiente para que un aprobador de tu empresa pueda revisarlo,
              aprobarlo o rechazarlo desde su panel.
            </p>
            <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs">
              El pedido no se confirma todavía. La compra continúa solo cuando
              la aprobación interna esté validada.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={requesting}>
                Cancelar
              </Button>
            </Dialog.Close>
            <Button onClick={handleRequestApproval} isLoading={requesting}>
              Enviar a aprobación
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default RequestApprovalConfirmation
