"use client"

import { setContactDetails } from "@/lib/data/cart"
import Divider from "@/modules/common/components/divider"
import { ApprovalStatusType, B2BCart, B2BCustomer } from "@/types"
import { CheckCircleSolid } from "@medusajs/icons"
import { clx, Container, Heading, Text } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState, useCallback } from "react"
import ContactDetailsForm from "../contact-details-form"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

const ContactDetails = ({
  cart,
  customer,
}: {
  cart: B2BCart | null
  customer: B2BCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const [message, formAction] = useActionState(setContactDetails, null)

  if (!cart) return null

  const isOpen = searchParams.get("step") === "contact-details"
  const isCompleted =
    cart.shipping_address?.address_1 &&
    cart.shipping_methods &&
    cart.shipping_methods?.length > 0 &&
    cart.billing_address?.address_1 &&
    cart.email

  const requiresApproval =
    cart.company?.approval_settings?.requires_admin_approval ||
    cart.company?.approval_settings?.requires_sales_manager_approval

  const cartApprovalStatus = cart?.approval_status?.status

  const customerIsAdmin = customer?.employee?.is_admin || false

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "contact-details"), {
      scroll: false,
    })
  }

  const handleSubmit = (formData: FormData) => {
    formAction(formData)

    const step =
      requiresApproval &&
      (!customerIsAdmin || cartApprovalStatus !== ApprovalStatusType.APPROVED)
        ? "review"
        : "payment"

    router.push(pathname + "?" + createQueryString("step", step), {
      scroll: false,
    })
  }

  return (
    <Container>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-row items-center justify-between w-full">
          <Heading
            level="h2"
            className={clx(
              "flex flex-row text-xl gap-x-2 items-center font-medium",
              {
                "opacity-50 pointer-events-none select-none":
                  !isOpen && !isCompleted,
              }
            )}
          >
            Datos internos del pedido
            {!isOpen && isCompleted && <CheckCircleSolid />}
          </Heading>

          {!isOpen &&
            isCompleted &&
            cartApprovalStatus !== ApprovalStatusType.PENDING && (
              <Text>
                <button
                  onClick={handleEdit}
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                  data-testid="edit-contact-details-button"
                >
                  Editar
                </button>
              </Text>
            )}
        </div>
        {(isOpen || isCompleted) && <Divider />}
        {isOpen ? (
          <form action={handleSubmit}>
            <div className="pb-8">
              <ContactDetailsForm customer={customer} cart={cart} />
              <div className="flex flex-col gap-y-2 items-end">
                <SubmitButton
                  className="mt-6"
                  data-testid="submit-address-button"
                >
                  {requiresApproval &&
                  cartApprovalStatus !== ApprovalStatusType.APPROVED &&
                  !customerIsAdmin
                    ? "Revisar pedido"
                    : "Siguiente paso"}
                </SubmitButton>
                <ErrorMessage
                  error={message}
                  data-testid="address-error-message"
                />
              </div>
            </div>
          </form>
        ) : (
          cart &&
          isCompleted && (
            <div className="text-small-regular">
              <div
                className="flex flex-col w-full gap-y-2"
                data-testid="contact-details-summary"
              >
                <Text className="txt-medium text-ui-fg-subtle">
                  {cart.email}
                </Text>
                {(cart.metadata?.po_number ||
                  cart.metadata?.cost_center ||
                  cart.metadata?.payment_terms ||
                  cart.metadata?.selected_payment_method) && (
                  <div className="grid gap-1 rounded-md border border-neutral-200 p-3 text-xs text-neutral-700">
                    {cart.metadata?.po_number ? (
                      <span>PO: {cart.metadata.po_number as string}</span>
                    ) : null}
                    {cart.metadata?.cost_center ? (
                      <span>
                        Centro de coste: {cart.metadata.cost_center as string}
                      </span>
                    ) : null}
                    {cart.metadata?.payment_terms ? (
                      <span>
                        Pago: {formatPaymentTerms(
                          cart.metadata.payment_terms as string
                        )}
                      </span>
                    ) : null}
                    {cart.metadata?.selected_payment_method ? (
                      <span>
                        Método: {formatPaymentMethod(
                          cart.metadata.selected_payment_method as string
                        )}
                      </span>
                    ) : null}
                  </div>
                )}
                {cart.metadata?.notes ? (
                  <div>
                    <Divider />
                    <Text className="txt-medium text-ui-fg-subtle pt-2">
                      Nota interna: {cart.metadata?.notes as string}
                    </Text>
                  </div>
                ) : null}
              </div>
            </div>
          )
        )}
      </div>
    </Container>
  )
}

export default ContactDetails

const formatPaymentTerms = (value: string) => {
  const labels: Record<string, string> = {
    prepaid: "Pago anticipado",
    bank_transfer: "Transferencia bancaria",
    net_30: "Crédito 30 días",
    net_60: "Crédito 60 días",
    net_90: "Crédito 90 días",
    credit: "Crédito comercial",
  }

  return labels[value] || value
}

const formatPaymentMethod = (value: string) => {
  const labels: Record<string, string> = {
    bank_transfer: "Transferencia bancaria",
    saved_sepa: "SEPA guardado",
    credit_account: "Cuenta de crédito",
    card_on_file: "Tarjeta guardada",
  }

  return labels[value] || value
}
