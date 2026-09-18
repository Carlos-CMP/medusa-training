import { getCatalogRuleSummary } from "@/lib/util/catalog-rules"
import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-precentage-diff"
import { convertToLocale } from "./money"

// TODO: Remove this util and use the AdminPrice type directly
export type VariantPrice = {
  calculated_price_number: string
  calculated_price: string
  original_price_number: string
  original_price: string
  currency_code: string
  price_type: string
  percentage_diff: string
}

const applyB2BPriceRule = ({
  amount,
  product,
}: {
  amount: number
  product?: HttpTypes.StoreProduct
}) => {
  const priceRule = getCatalogRuleSummary(product)?.priceRule

  if (!priceRule) {
    return {
      amount,
      priceType: undefined,
    }
  }

  if (
    priceRule.effect_type === "discount_percentage" &&
    priceRule.discount_percentage !== null &&
    priceRule.discount_percentage !== undefined
  ) {
    return {
      amount: Number(
        (amount * (1 - Number(priceRule.discount_percentage) / 100)).toFixed(2)
      ),
      priceType: "sale",
    }
  }

  if (
    priceRule.effect_type === "fixed_price" &&
    priceRule.fixed_price !== null &&
    priceRule.fixed_price !== undefined
  ) {
    return {
      amount: Number(priceRule.fixed_price),
      priceType: "sale",
    }
  }

  return {
    amount,
    priceType: undefined,
  }
}

export const getPricesForVariant = (
  variant: any,
  product?: HttpTypes.StoreProduct
): VariantPrice | null => {
  if (!variant?.calculated_price?.calculated_amount) {
    return null
  }

  const originalAmount =
    variant.calculated_price.original_amount ||
    variant.calculated_price.calculated_amount
  const b2bPrice = applyB2BPriceRule({
    amount: variant.calculated_price.calculated_amount,
    product,
  })
  const calculatedAmount = b2bPrice.amount

  return {
    calculated_price_number: calculatedAmount,
    calculated_price: convertToLocale({
      amount: calculatedAmount,
      currency_code: variant.calculated_price.currency_code,
    }),
    original_price_number: originalAmount,
    original_price: convertToLocale({
      amount: originalAmount,
      currency_code: variant.calculated_price.currency_code,
    }),
    currency_code: variant.calculated_price.currency_code,
    price_type:
      b2bPrice.priceType ||
      variant.calculated_price.calculated_price.price_list_type,
    percentage_diff: getPercentageDiff(
      originalAmount,
      calculatedAmount
    ),
  }
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const cheapestVariant: any = product.variants
      .filter((v: any) => !!v.calculated_price)
      .sort((a: any, b: any) => {
        return (
          a.calculated_price.calculated_amount -
          b.calculated_price.calculated_amount
        )
      })[0]

    return getPricesForVariant(cheapestVariant, product)
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant: any = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId
    )

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant, product)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
