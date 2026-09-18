import { getProductsById } from "@/lib/data/products"
import { listProductPackaging } from "@/lib/data/product-packaging"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@/modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
  canViewPrices = false,
}: {
  id: string
  region: HttpTypes.StoreRegion
  canViewPrices?: boolean
}) {
  const [product] = await getProductsById({
    ids: [id],
    regionId: region.id,
  })

  if (!product) {
    return null
  }

  const packagingByVariantId = await listProductPackaging(
    product.variants?.map((variant) => variant.id).filter(Boolean) || []
  )

  return (
    <ProductActions
      product={product}
      region={region}
      packagingByVariantId={packagingByVariantId}
      canViewPrices={canViewPrices}
    />
  )
}
