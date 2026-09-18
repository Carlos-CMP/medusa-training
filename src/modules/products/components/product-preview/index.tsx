import { getCatalogRuleSummary } from "@/lib/util/catalog-rules"
import { listProductPackaging } from "@/lib/data/product-packaging"
import { getProductPrice } from "@/lib/util/get-product-price"
import { getInventorySummary } from "@/lib/util/product-technical-profile"
import { HttpTypes } from "@medusajs/types"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewAddToCart from "./preview-add-to-cart"
import PreviewPrice from "./price"
import { PriceLoginGate } from "../price-login-gate"
import { getProductImageFallback } from "@/lib/util/product-image-fallback"
import { getVariantPackaging } from "@/lib/util/b2b-packaging"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
  canViewPrices = false,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  canViewPrices?: boolean
}) {
  if (!product) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  const inventory = getInventorySummary(product)
  const stableProductImage = getProductImageFallback(product.handle)
  const catalogRuleSummary = getCatalogRuleSummary(product)
  const firstVariant = product.variants?.[0]
  const firstVariantId = firstVariant?.id
  const packagingByVariantId = firstVariantId
    ? await listProductPackaging([firstVariantId])
    : {}
  const firstVariantPackaging = firstVariant
    ? getVariantPackaging(
        product,
        firstVariant,
        firstVariantId ? packagingByVariantId[firstVariantId] : undefined
      )
    : undefined
  const minimumOrderQuantity = Math.max(
    firstVariantPackaging?.minimumOrderQuantity || 1,
    firstVariantPackaging?.quantityIncrement || 1
  )
  const priceRule = catalogRuleSummary?.priceRule
  const brandName =
    typeof product.metadata?.brand === "string"
      ? product.metadata.brand
      : typeof product.metadata?.brand_name === "string"
      ? product.metadata.brand_name
      : "NGS"

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        className="relative flex h-full min-h-[420px] w-full flex-col gap-4 overflow-hidden rounded-lg bg-white p-4 shadow-borders-base transition-shadow duration-150 ease-in-out group-hover:shadow-[0_0_0_4px_rgba(0,0,0,0.1)]"
      >
        <div className="aspect-square w-full shrink-0 p-8">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            fallbackSrc={stableProductImage}
            size="square"
            isFeatured={isFeatured}
          />
        </div>
        <div className="flex min-h-[72px] flex-col txt-compact-medium">
          <div className="flex flex-wrap items-center gap-2">
            <Text className="text-neutral-600 text-xs">{brandName}</Text>
            {canViewPrices && priceRule && (
              <span className="rounded border border-neutral-950 bg-neutral-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                {priceRule.effect_type === "discount_percentage"
                  ? `${priceRule.discount_percentage}% B2B`
                  : "Precio B2B"}
              </span>
            )}
            {catalogRuleSummary?.requiresQuote && (
              <span className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-neutral-700">
                Presupuesto
              </span>
            )}
          </div>
          <Text className="text-ui-fg-base" data-testid="product-title">
            {product.title}
          </Text>
          {minimumOrderQuantity > 1 && (
            <Text className="mt-1 text-[11px] font-medium text-neutral-600">
              Compra mínima: {minimumOrderQuantity} uds
            </Text>
          )}
        </div>
        <div className="flex min-h-[48px] flex-col gap-0">
          {canViewPrices && cheapestPrice ? (
            <>
              <PreviewPrice price={cheapestPrice} />
              <Text className="text-neutral-600 text-[0.6rem]">Sin IVA</Text>
            </>
          ) : (
            <PriceLoginGate compact showLink={false} />
          )}
        </div>
        <div className="mt-auto flex min-h-10 shrink-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-row items-center gap-1">
            <span
              className={clx({
                "text-green-500": inventory.tone === "green",
                "text-orange-500":
                  inventory.tone === "amber",
                "text-red-500": inventory.tone === "red",
              })}
            >
              •
            </span>
            <Text className="truncate text-xs text-neutral-600">
              {inventory.label}
            </Text>
          </div>
          {canViewPrices && (
            <PreviewAddToCart
              product={product}
              region={region}
              packaging={
                firstVariantId ? packagingByVariantId[firstVariantId] : undefined
              }
            />
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
