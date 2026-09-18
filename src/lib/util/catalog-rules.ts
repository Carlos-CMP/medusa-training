import { HttpTypes } from "@medusajs/types"

export type StoreCatalogRule = {
  id: string
  name: string
  description?: string | null
  status: "draft" | "active" | "archived"
  priority: number
  rule_type: "price" | "visibility" | "assortment" | "quote"
  target_type: "all" | "product" | "variant" | "category" | "collection"
  target_id?: string | null
  company_id?: string | null
  customer_group_id?: string | null
  region_id?: string | null
  sales_channel_id?: string | null
  zone_code?: string | null
  currency_code?: string | null
  effect_type:
    | "discount_percentage"
    | "fixed_price"
    | "hide"
    | "show_only"
    | "requires_quote"
  discount_percentage?: number | null
  fixed_price?: number | null
  minimum_quantity: number
  metadata?: Record<string, unknown> | null
}

export type CatalogRuleSummary = {
  rules: StoreCatalogRule[]
  hidden: boolean
  requiresQuote: boolean
  priceRule?: StoreCatalogRule
}

export const getCatalogRuleSummary = (product?: HttpTypes.StoreProduct) =>
  product?.metadata?.b2b_catalog_rule_summary as
    | CatalogRuleSummary
    | undefined
