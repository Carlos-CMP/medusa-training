import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { ClientProfile, clientProfile } from "@/lib/client-profile"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { getProductPrice } from "@/lib/util/get-product-price"
import { normalizeMediaUrl } from "@/lib/util/media-url"
import { getProductImageFallback } from "@/lib/util/product-image-fallback"
import { ArrowRight } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { PriceLoginGate } from "../price-login-gate"
import CompatibleProductsTabs, {
  CompatibleProductsSection,
} from "../compatible-products-tabs"
import RelationImage from "../relation-image"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  profile?: ClientProfile
  canViewPrices?: boolean
}

const relationSections = [
  {
    title: "Recambios",
    metadataKey: "novisound_relation_spare_part_skus",
    type: "compatible",
  },
  {
    title: "Accesorios compatibles",
    metadataKey: "novisound_relation_accessory_skus",
    type: "compatible",
  },
  {
    title: "Productos similares",
    metadataKey: "novisound_relation_similar_product_skus",
    type: "similar",
  },
  {
    title: "Compatible con",
    metadataKey: "novisound_relation_compatible_product_skus",
    type: "compatible",
  },
]

const getSkuList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(/[,\|]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const productMatchesSku = (product: HttpTypes.StoreProduct, sku: string) => {
  const metadataSku =
    product.metadata?.bluestone_product_number ||
    product.metadata?.Bluestone_SKU
  const externalId = (product as HttpTypes.StoreProduct & { external_id?: string })
    .external_id

  return (
    metadataSku === sku ||
    externalId === sku ||
    product.variants?.some((variant) => variant.sku === sku)
  )
}

const orderProductsBySku = (
  products: HttpTypes.StoreProduct[],
  skus: string[]
) => {
  return skus
    .map((sku) => products.find((item) => productMatchesSku(item, sku)))
    .filter(Boolean) as HttpTypes.StoreProduct[]
}

export default async function RelatedProducts({
  product,
  countryCode,
  profile,
  canViewPrices = false,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const queryParams: HttpTypes.StoreProductParams & {
    limit?: number
    tag_id?: string[]
    collection_id?: string[]
    is_giftcard?: boolean
  } = {}

  if (region?.id) {
    queryParams.region_id = region.id
  }

  const productMetadata = product.metadata || {}
  const explicitRelationSections = relationSections
    .map((section) => ({
      ...section,
      skus: getSkuList(productMetadata[section.metadataKey]),
    }))
    .filter((section) => section.skus.length)

  if (explicitRelationSections.length) {
    const allProducts = await listProducts({
      queryParams: {
        region_id: region.id,
        is_giftcard: false,
        limit: 100,
      },
      countryCode,
    }).then(({ response }) =>
      response.products.filter((item) => item.id !== product.id)
    )

    const sections = explicitRelationSections
      .map((section) => ({
        title: section.title,
        type: section.type,
        products: orderProductsBySku(allProducts, section.skus).slice(0, 4),
      }))
      .filter((section) => section.products.length)

    if (sections.length) {
      const compatibleSections = sections.filter(
        (section) => section.type === "compatible"
      )
      const similarSections = sections.filter(
        (section) => section.type === "similar"
      )

      return (
        <section className="grid gap-7 py-7">
          {compatibleSections.length > 0 && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
                    Compatibilidad industrial
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-950">
                    Productos compatibles
                  </h2>
                </div>
                <LocalizedClientLink
                  href="/store"
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </LocalizedClientLink>
              </div>
              <CompatibleProductsTabs
                sections={compatibleSections.map((section) =>
                  mapCompatibleSection(section, profile, canViewPrices)
                )}
              />
            </div>
          )}

          {similarSections.map((section) => (
            <div key={section.title} className="grid gap-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-neutral-950">
                  {section.title}
                </h2>
                <LocalizedClientLink
                  href="/store"
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </LocalizedClientLink>
              </div>
              <ul className="grid gap-3 xsmall:grid-cols-2 medium:grid-cols-4">
                {section.products.map((relatedProduct) => (
                  <li key={relatedProduct.id}>
                    <CompactRelatedCard
                      product={relatedProduct}
                      canViewPrices={canViewPrices}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )
    }
  }

  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }

  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((tag) => tag.id)
      .filter(Boolean) as string[]
  }

  queryParams.is_giftcard = false
  queryParams.limit = 4

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) =>
    response.products.filter((item) => item.id !== product.id).slice(0, 4)
  )

  if (!products.length) {
    return null
  }

  return (
    <section className="grid gap-5 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-950">
          Productos relacionados
        </h2>
        <LocalizedClientLink
          href="/store"
          className="inline-flex items-center gap-2 text-sm font-semibold"
        >
          Ver todos
          <ArrowRight className="h-4 w-4" />
        </LocalizedClientLink>
      </div>
      <ul className="grid gap-3 xsmall:grid-cols-2 medium:grid-cols-4">
        {products.map((relatedProduct) => {
          return (
            <li key={relatedProduct.id}>
              <CompactRelatedCard
                product={relatedProduct}
                canViewPrices={canViewPrices}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const getRelationImage = (product: HttpTypes.StoreProduct) =>
  getProductImageFallback(product.handle) ||
  normalizeMediaUrl(product.thumbnail || product.images?.[0]?.url)

const getRelationFallbackImage = (product: HttpTypes.StoreProduct) =>
  getProductImageFallback(product.handle)

const mapCompatibleSection = (
  section: {
    title: string
    products: HttpTypes.StoreProduct[]
  },
  profile?: ClientProfile,
  canViewPrices?: boolean
): CompatibleProductsSection => ({
  title: section.title,
  products: section.products.map((product) => {
    const { cheapestPrice } = getProductPrice({ product })
    const sku = product.variants?.find((variant) => variant.sku)?.sku

    return {
      href: `/products/${product.handle}`,
      image: getRelationImage(product),
      fallbackImage: getRelationFallbackImage(product),
      title: product.title,
      category:
        product.categories?.[0]?.name ||
        profile?.fallbacks.productCategoryLabel ||
        clientProfile.fallbacks.productCategoryLabel,
      sku,
      priceLabel: canViewPrices
        ? cheapestPrice?.calculated_price || "Consultar"
        : "Precio privado",
      stockLabel: "En stock",
    }
  }),
})

const CompactRelatedCard = ({
  product,
  canViewPrices,
}: {
  product: HttpTypes.StoreProduct
  canViewPrices?: boolean
}) => {
  const image = getRelationImage(product)
  const fallbackImage = getRelationFallbackImage(product)
  const { cheapestPrice } = getProductPrice({ product })
  const sku = product.variants?.find((variant) => variant.sku)?.sku

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block rounded-lg border border-neutral-200 bg-white p-3 transition hover:border-neutral-950"
    >
      <div className="relative h-36 rounded bg-neutral-50">
        <RelationImage
          src={image}
          fallbackSrc={fallbackImage}
          alt={product.title}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-contain p-3"
        />
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-normal text-neutral-500">
        {product.categories?.[0]?.name ||
          clientProfile.fallbacks.productCategoryLabel}
      </p>
      <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold text-neutral-950">
        {product.title}
      </h3>
      {sku && <p className="mt-1 text-xs uppercase text-neutral-500">{sku}</p>}
      <div className="mt-3">
        {canViewPrices ? (
          <p className="text-sm font-semibold text-neutral-950">
            {cheapestPrice?.calculated_price || "Consultar"}
          </p>
        ) : (
          <PriceLoginGate compact showLink={false} />
        )}
      </div>
      <p className="mt-2 text-xs text-green-600">En stock</p>
    </LocalizedClientLink>
  )
}
