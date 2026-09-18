import { B2BCart } from "@/types/global"
import { getCatalogRuleSummary } from "./catalog-rules"

type CartLineWithRuleMetadata = {
  metadata?: Record<string, unknown> | null
  product?: {
    metadata?: Record<string, unknown> | null
  } | null
}

export const cartLineRequiresQuote = (item: CartLineWithRuleMetadata) => {
  if (
    item.metadata?.requires_quote === true ||
    item.metadata?.catalog_rule_requires_quote === true
  ) {
    return true
  }

  return getCatalogRuleSummary(item.product as any)?.requiresQuote === true
}

export const getQuoteRequiredCartItems = (cart: B2BCart | null) => {
  return (cart?.items || []).filter((item) => cartLineRequiresQuote(item))
}

export const cartRequiresQuote = (cart: B2BCart | null) => {
  return getQuoteRequiredCartItems(cart).length > 0
}
