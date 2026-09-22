"use server"

import { sdk } from "@/lib/config"
import handleMedusaError from "@/lib/util/handle-medusa-error"
import { withRetry } from "@/lib/util/with-retry"
import { StoreApprovalResponse } from "@/types/approval"
import { B2BCart } from "@/types/global"
import { HttpTypes, StoreCart } from "@medusajs/types"
import { track } from "@vercel/analytics/server"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { retrieveCustomer } from "./customer"
import { getRegion } from "./regions"

const B2B_AUTH_REQUIRED_MESSAGE =
  "Inicia sesión para ver tus tarifas B2B, comprar o solicitar presupuesto."

async function requireB2BCustomer() {
  const customer = await retrieveCustomer()

  if (!customer) {
    throw new Error(B2B_AUTH_REQUIRED_MESSAGE)
  }

  return customer
}

export async function retrieveCart(id?: string) {
  const cartId = id || (await getCartId())

  if (!cartId) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}`, {
      credentials: "include",
      method: "GET",
      query: {
        fields:
          "*items, *region, *items.product, +items.product.metadata, *items.variant, +items.thumbnail, +items.metadata, *promotions, *company, *company.approval_settings, *customer, *approvals, +completed_at, *approval_status",
      },
      headers,
      next,
    })
    .then(({ cart }) => {
      return cart as B2BCart
    })
    .catch(() => {
      return null
    })
}

export async function getOrSetCart(countryCode: string) {
  let cart = await retrieveCart()
  const region = await getRegion(countryCode)
  const customer = await requireB2BCustomer()

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const body = {
      region_id: region.id,
      metadata: {
        company_id: customer?.employee?.company_id,
      },
    }

    const cartResp = await sdk.store.cart.create(body, {}, headers)

    setCartId(cartResp.cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    cart = await retrieveCart()
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  await requireB2BCustomer()

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Safe to retry: sets fields (region_id, addresses, promo_codes) to an
  // absolute value, not additive — repeating it doesn't duplicate anything.
  return withRetry(() => sdk.store.cart.update(cartId, data, {}, headers))
    .then(async ({ cart }) => {
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag)
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cart
    })
    .catch(handleMedusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  await requireB2BCustomer()

  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)
  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Not wrapped in withRetry: Medusa merges quantity into an existing line
  // item for the same variant, so this is additive, not idempotent. If the
  // create actually succeeded and only the response was lost, a retry
  // would add the quantity a second time.
  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      headers
    )
    .then(async () => {
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag)
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(handleMedusaError)
}

export async function addToCartBulk({
  lineItems,
  countryCode,
}: {
  lineItems: HttpTypes.StoreAddCartLineItem[]
  countryCode: string
}) {
  await requireB2BCustomer()

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    "Content-Type": "application/json",
    ...(await getAuthHeaders()),
  } as Record<string, any>

  if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] =
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  }

  await sdk.client
    .fetch(`/store/carts/${cart.id}/line-items/bulk`, {
      method: "POST",
      headers,
      body: { line_items: lineItems },
    })
    .then(async () => {
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag)
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(handleMedusaError)
}

export async function updateLineItem({
  lineId,
  data,
}: {
  lineId: string
  data: HttpTypes.StoreUpdateCartLineItem
}) {
  await requireB2BCustomer()

  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Safe to retry: sets quantity to an absolute value, not additive.
  await withRetry(() =>
    sdk.client.fetch(`/store/carts/${cartId}/line-items/${lineId}/b2b`, {
      method: "POST",
      headers,
      body: data,
    })
  )
    .then(async () => {
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag)
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(handleMedusaError)
}

export async function deleteLineItem(lineId: string) {
  await requireB2BCustomer()

  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Safe to retry: deleting an already-deleted line item is a no-op, not
  // a duplicate side effect.
  await withRetry(() => sdk.store.cart.deleteLineItem(cartId, lineId, {}, headers))
    .then(async () => {
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag)
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(handleMedusaError)
}

export async function emptyCart() {
  await requireB2BCustomer()

  const cart = await retrieveCart()
  if (!cart) {
    throw new Error("No existing cart found when emptying cart")
  }

  for (const item of cart.items || []) {
    await deleteLineItem(item.id)
  }

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  await requireB2BCustomer()

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Safe to retry: sets the shipping method, replacing any previous one.
  return withRetry(() =>
    sdk.store.cart.addShippingMethod(
      cartId,
      { option_id: shippingMethodId },
      {},
      headers
    )
  )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(handleMedusaError)
}

export async function initiatePaymentSession(
  cart: B2BCart,
  data: {
    provider_id: string
    context?: Record<string, unknown>
  }
) {
  await requireB2BCustomer()

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Never retried: creates a payment session with the external provider.
  // A retry after a lost response could create a second session/intent —
  // not verified idempotent against every configured provider.
  return sdk.store.payment
    .initiatePaymentSession(cart as StoreCart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return resp
    })
    .catch(handleMedusaError)
}

export async function applyPromotions(codes: string[]) {
  await requireB2BCustomer()

  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No existing cart found")
  }

  await updateCart({ promo_codes: codes })
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag)
    })
    .catch(handleMedusaError)
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag(getCacheTag("carts"))
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag(getCacheTag("carts"))
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag(getCacheTag("carts"))
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setShippingAddress(formData: FormData) {
  try {
    const customer = await requireB2BCustomer()

    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }

    const cartId = await getCartId()

    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      // customer_id: customer?.id,
      email: customer?.email || formData.get("email"),
    } as any
    await updateCart(data)
  } catch (e: any) {
    throw new Error(e)
  }
}

export async function setBillingAddress(formData: FormData) {
  try {
    await requireB2BCustomer()

    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting billing address")
    }

    const data = {
      billing_address: {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      },
    } as any

    await updateCart(data)
  } catch (e: any) {
    return e.message
  }
}

export async function setContactDetails(
  currentState: unknown,
  formData: FormData
) {
  try {
    await requireB2BCustomer()

    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting contact details")
    }
    const data = {
      email: formData.get("email") as string,
      metadata: {
        invoice_recipient: formData.get("invoice_recipient"),
        cost_center: formData.get("cost_center"),
        po_number: formData.get("po_number"),
        requisition_number: formData.get("requisition_number"),
        payment_terms: formData.get("payment_terms"),
        selected_payment_method: formData.get("selected_payment_method"),
        door_code: formData.get("door_code"),
        notes: formData.get("notes"),
      },
    }
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }
}

export async function placeOrder(
  cartId?: string
): Promise<HttpTypes.StoreCompleteCartResponse> {
  await requireB2BCustomer()

  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartsTag = await getCacheTag("carts")
  const ordersTag = await getCacheTag("orders")
  const approvalsTag = await getCacheTag("approvals")

  // Never retried: captures payment and creates the order. This is exactly
  // the case Fase 9 forbids auto-retrying without verified idempotency —
  // a duplicate call here means a duplicate charge or a duplicate order.
  const response = await sdk.store.cart
    .complete(id, {}, headers)
    .catch(handleMedusaError)

  if (response.type === "cart") {
    return response
  }

  track("order_completed", {
    order_id: response.order.id,
  })

  revalidateTag(cartsTag)
  revalidateTag(ordersTag)
  revalidateTag(approvalsTag)

  await removeCartId()

  redirect(
    `/${response.order.shipping_address?.country_code?.toLowerCase()}/order/confirmed/${
      response.order.id
    }`
  )
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await requireB2BCustomer()

    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  // "products" is a global (non-visitor-scoped) tag — see getGlobalCacheOptions.
  revalidateTag("products")

  redirect(`/${countryCode}${currentPath}`)
}

export async function createCartApproval(cartId: string, createdBy: string) {
  await requireB2BCustomer()

  const headers = {
    "Content-Type": "application/json",
    ...(await getAuthHeaders()),
  }

  // Not wrapped in withRetry: creates a new approval request, not
  // verified idempotent against a duplicate call.
  const response = await sdk.client
    .fetch<StoreApprovalResponse & { approvals?: StoreApprovalResponse["approval"][] }>(`/store/carts/${cartId}/approvals`, {
      method: "POST",
      headers,
      credentials: "include",
    })
    .catch(handleMedusaError)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  const approvalsCacheTag = await getCacheTag("approvals")
  revalidateTag(approvalsCacheTag)

  return response.approval || response.approvals?.[0]
}
