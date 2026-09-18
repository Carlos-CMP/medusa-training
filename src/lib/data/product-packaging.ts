"use server"

import { sdk } from "@/lib/config"

export type StoreProductPackaging = {
  id: string
  variant_id: string
  sales_unit: "unit" | "box"
  minimum_order_quantity: number
  quantity_increment: number
  units_per_box: number
  boxes_per_pallet?: number | null
  package_weight?: number | null
  package_dimensions?: string | null
}

export const listProductPackaging = async (
  variantIds: string[]
): Promise<Record<string, StoreProductPackaging>> => {
  if (!variantIds.length) {
    return {}
  }

  return sdk.client
    .fetch<{ packaging: StoreProductPackaging[] }>("/store/product-packaging", {
      method: "GET",
      query: {
        variant_id: variantIds,
      },
      next: {
        revalidate: 60,
      },
    })
    .then(({ packaging }) => {
      return packaging.reduce<Record<string, StoreProductPackaging>>(
        (acc, item) => {
          acc[item.variant_id] = item
          return acc
        },
        {}
      )
    })
    .catch(() => ({}))
}
