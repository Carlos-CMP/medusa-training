"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders, getCacheOptions } from "@/lib/data/cookies"
import {
  CatalogRuleSummary,
  StoreCatalogRule,
} from "@/lib/util/catalog-rules"
import { HttpTypes } from "@medusajs/types"

type CatalogRuleContext = {
  productId?: string
  variantId?: string
  categoryId?: string
  collectionId?: string
  regionId?: string
  currencyCode?: string
}

const getEnvContext = () => ({
  company_id:
    process.env.B2B_COMPANY_ID || process.env.NEXT_PUBLIC_B2B_COMPANY_ID,
  customer_group_id:
    process.env.B2B_CUSTOMER_GROUP_ID ||
    process.env.NEXT_PUBLIC_B2B_CUSTOMER_GROUP_ID,
  sales_channel_id:
    process.env.B2B_SALES_CHANNEL_ID ||
    process.env.NEXT_PUBLIC_B2B_SALES_CHANNEL_ID,
  zone_code: process.env.B2B_ZONE_CODE || process.env.NEXT_PUBLIC_B2B_ZONE_CODE,
})

export const getApplicableCatalogRules = async ({
  productId,
  variantId,
  categoryId,
  collectionId,
  regionId,
  currencyCode,
}: CatalogRuleContext) => {
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("catalog_rules")),
  }
  const envContext = getEnvContext()

  return sdk.client
    .fetch<{
      applicable_rules: StoreCatalogRule[]
    }>("/store/catalog-rules", {
      credentials: "include",
      method: "GET",
      query: {
        product_id: productId,
        variant_id: variantId,
        category_id: categoryId,
        collection_id: collectionId,
        region_id: regionId,
        currency_code: currencyCode,
        ...envContext,
      },
      headers,
      next,
    })
    .then(({ applicable_rules }) => applicable_rules || [])
    .catch(() => [])
}

const summarizeRules = (rules: StoreCatalogRule[]): CatalogRuleSummary => {
  const priceRule = rules.find((rule) =>
    ["discount_percentage", "fixed_price"].includes(rule.effect_type)
  )

  return {
    rules,
    hidden: rules.some((rule) => rule.effect_type === "hide"),
    requiresQuote: rules.some((rule) => rule.effect_type === "requires_quote"),
    priceRule,
  }
}

const withCatalogRuleSummary = (
  product: HttpTypes.StoreProduct,
  summary: CatalogRuleSummary
) =>
  ({
    ...product,
    metadata: {
      ...(product.metadata || {}),
      b2b_catalog_rule_summary: summary,
    },
  } as HttpTypes.StoreProduct)

export const applyCatalogRulesToProducts = async ({
  products,
  region,
  categoryId,
  collectionId,
}: {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  categoryId?: string
  collectionId?: string
}) => {
  const enriched = await Promise.all(
    products.map(async (product) => {
      const rules = await getApplicableCatalogRules({
        productId: product.id,
        categoryId: categoryId || product.categories?.[0]?.id,
        collectionId: collectionId || product.collection_id || undefined,
        regionId: region.id,
        currencyCode: region.currency_code,
      })

      return withCatalogRuleSummary(product, summarizeRules(rules))
    })
  )

  return enriched.filter((product) => {
    const summary = product.metadata
      ?.b2b_catalog_rule_summary as CatalogRuleSummary | undefined

    return !summary?.hidden
  })
}

export const applyCatalogRulesToProduct = async ({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) => {
  const rules = await getApplicableCatalogRules({
    productId: product.id,
    categoryId: product.categories?.[0]?.id,
    collectionId: product.collection_id || undefined,
    regionId: region.id,
    currencyCode: region.currency_code,
  })
  const summary = summarizeRules(rules)

  if (summary.hidden) {
    return null
  }

  return withCatalogRuleSummary(product, summary)
}
