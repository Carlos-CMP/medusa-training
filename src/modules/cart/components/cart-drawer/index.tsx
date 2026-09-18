"use client"

import { useCart } from "@/lib/context/cart-context"
import { canCustomerViewB2BPrices } from "@/lib/util/b2b-access"
import { checkSpendingLimit } from "@/lib/util/check-spending-limit"
import { getCheckoutStep } from "@/lib/util/get-checkout-step"
import { convertToLocale } from "@/lib/util/money"
import AppliedPromotions from "@/modules/cart/components/applied-promotions"
import ApprovalStatusBanner from "@/modules/cart/components/approval-status-banner"
import RequestApprovalConfirmation from "@/modules/cart/components/request-approval-confirmation"
import ItemsTemplate from "@/modules/cart/templates/items"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import FreeShippingPriceNudge from "@/modules/shipping/components/free-shipping-price-nudge"
import { B2BCustomer } from "@/types"
import { ApprovalStatusType } from "@/types/approval"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
import { ExclamationCircle, LockClosedSolidMini, ShoppingBag } from "@medusajs/icons"
import { StoreCart } from "@medusajs/types"
import { Drawer, Text } from "@medusajs/ui"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type CartDrawerProps = {
  customer: B2BCustomer | null
  freeShippingPrices: StoreFreeShippingPrice[]
}

const CartDrawer = ({
  customer,
  freeShippingPrices,
  ...props
}: CartDrawerProps) => {
  const [activeTimer, setActiveTimer] = useState<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  const { cart } = useCart()

  const items = cart?.items || []
  const promotions = cart?.promotions || []

  const totalItems =
    items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = useMemo(() => cart?.item_subtotal ?? 0, [cart])

  const spendLimitExceeded = useMemo(
    () => checkSpendingLimit(cart, customer),
    [cart, customer]
  )

  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    if (isOpen) {
      return
    }

    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  const cancelTimer = useCallback(() => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
  }, [activeTimer])

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (
      itemRef.current !== totalItems &&
      !pathname.includes("/cart") &&
      !pathname.includes("/account")
    ) {
      timedOpen()
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  //close cart drawer when navigating to a different page
  useEffect(() => {
    cancelTimer()
    close()
  }, [cancelTimer, pathname])

  const checkoutStep = cart ? getCheckoutStep(cart) : undefined
  const checkoutPath = customer
    ? checkoutStep
      ? `/checkout?step=${checkoutStep}`
      : "/checkout"
    : "/account"
  const canViewPrices = canCustomerViewB2BPrices(customer)
  const companyStatus = customer?.employee?.company?.onboarding_status
  const isAccountPendingApproval = Boolean(customer) && !canViewPrices
  const isCartPendingApproval = cart?.approvals?.some(
    (approval) => approval?.status === ApprovalStatusType.PENDING
  )
  const canRequestApproval = spendLimitExceeded && !isCartPendingApproval

  return (
    <>
      {isOpen && (
        <div className="fixed inset-[-2rem] z-10 backdrop-blur-sm p-0" />
      )}
      <Drawer
        onMouseEnter={cancelTimer}
        className="rounded-none m-0 p-0 bg-none z-50"
        open={isOpen}
        onOpenChange={setIsOpen}
        {...(props as any)}
      >
        <Drawer.Trigger asChild>
          <button
            aria-label={`Abrir carrito, ${totalItems} artículos`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded bg-white text-neutral-950 outline-none transition hover:bg-neutral-100"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute right-0 top-0 flex h-4 min-w-4 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[10px] font-semibold leading-none text-white">
              {totalItems}
            </span>
          </button>
        </Drawer.Trigger>
        <Drawer.Content
          className="z-50 rounded-none m-0 p-0 inset-y-0 sm:right-0"
          onMouseEnter={cancelTimer}
        >
          <Drawer.Header className="flex self-center">
            <Drawer.Title>
              {totalItems > 0
                ? `Tienes ${totalItems} artículo${totalItems === 1 ? "" : "s"} en el carrito`
                : "Tu carrito está vacío"}
            </Drawer.Title>
          </Drawer.Header>
          {cart?.approvals && cart.approvals.length > 0 && (
            <div className="p-4">
              <ApprovalStatusBanner cart={cart} />
            </div>
          )}
          {canViewPrices && promotions.length > 0 && (
            <div className="p-4">
              <AppliedPromotions promotions={promotions} />
            </div>
          )}
          <div className="flex flex-col gap-y-4 h-full self-stretch justify-between overflow-auto">
            {cart && cart.items && (
              <>
                <ItemsTemplate
                  cart={cart}
                  showBorders={false}
                  showTotal={false}
                  canViewPrices={canViewPrices}
                />
                <div className="flex flex-col gap-y-3 w-full p-4">
                  {canViewPrices && cart && freeShippingPrices && (
                    <FreeShippingPriceNudge
                      variant="inline"
                      cart={cart as StoreCart}
                      freeShippingPrices={freeShippingPrices}
                    />
                  )}
                  {canViewPrices ? (
                    <div className="flex justify-between">
                      <Text>Subtotal</Text>
                      <Text>
                        {convertToLocale({
                          amount: subtotal,
                          currency_code: cart?.currency_code,
                        })}
                      </Text>
                    </div>
                  ) : (
                    <div className="rounded border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800">
                      <p className="font-semibold text-red-950">
                        {isAccountPendingApproval
                          ? "Cuenta pendiente de aprobación"
                          : "Tarifa B2B privada"}
                      </p>
                      <p>
                        {isAccountPendingApproval
                          ? companyStatus === "rejected"
                            ? "Tu solicitud ha sido rechazada. Contacta con el equipo comercial."
                            : "Estamos revisando tu alta B2B. Verás precios cuando sea aprobada."
                          : "Inicia sesión para ver precios y descuentos."}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-y-2">
                    <LocalizedClientLink href="/cart">
                      <Button
                        variant="secondary"
                        className="w-full"
                        size="large"
                      >
                        Ver carrito
                      </Button>
                    </LocalizedClientLink>
                    {canRequestApproval ? (
                      <RequestApprovalConfirmation
                        cartId={cart.id}
                        customerId={customer?.id}
                        disabled={!customer}
                      >
                        <Button className="w-full" size="large">
                          Enviar a aprobación
                        </Button>
                      </RequestApprovalConfirmation>
                    ) : (
                      <LocalizedClientLink href={checkoutPath}>
                        <Button
                          className="w-full"
                          size="large"
                          disabled={
                            totalItems === 0 ||
                            isAccountPendingApproval ||
                            isCartPendingApproval
                          }
                        >
                          <LockClosedSolidMini />
                          {customer
                            ? isAccountPendingApproval || isCartPendingApproval
                              ? "Pendiente de aprobación"
                              : "Finalizar compra"
                            : "Inicia sesión para comprar"}
                        </Button>
                      </LocalizedClientLink>
                    )}
                    {spendLimitExceeded && (
                      <div className="flex items-center gap-x-2 bg-neutral-100 p-3 rounded-md shadow-borders-base">
                        <ExclamationCircle className="text-orange-500 w-fit overflow-visible" />
                        <p className="text-neutral-950 text-xs">
                          {isCartPendingApproval
                            ? "Este pedido ya está pendiente de aprobación interna."
                            : "Este pedido supera tu límite de gasto. Envíalo para que un responsable lo revise."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

export default CartDrawer
