"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"

export type QuickOrderPackaging = {
  variant_id: string
  sales_unit: "unit" | "box"
  minimum_order_quantity: number
  quantity_increment: number
  units_per_box: number
  boxes_per_pallet?: number | null
  package_weight?: number | null
  package_dimensions?: string | null
}

export type QuickOrderResolvedItem = {
  sku: string
  product: {
    id: string
    title: string
    handle?: string | null
    thumbnail?: string | null
  }
  variant: {
    id: string
    title: string
    sku: string
    options?: { option?: { title?: string }; value?: string }[]
  }
  packaging: QuickOrderPackaging | null
  catalog_rule_summary?: {
    requires_quote?: boolean
  }
}

export type QuickOrderResolveResponse = {
  items: QuickOrderResolvedItem[]
  missing_skus: string[]
}

export const resolveQuickOrderSkus = async (
  skus: string[],
  regionId?: string
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client.fetch<QuickOrderResolveResponse>(
    "/store/quick-order/resolve",
    {
      method: "POST",
      headers,
      body: {
        skus,
        region_id: regionId,
      },
    }
  )
}
