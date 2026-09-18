import { HomepageContent } from "@/lib/data/homepage"
import { getProductPrice } from "@/lib/util/get-product-price"
import { normalizeMediaUrl } from "@/lib/util/media-url"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { Container } from "./container"
import { SectionHeading } from "./section-heading"
import { PriceLoginGate } from "@/modules/products/components/price-login-gate"

function ProductCard({
  product,
  image,
  fallbackCategoryLabel,
  canViewPrices,
}: {
  product: HttpTypes.StoreProduct
  image: string
  fallbackCategoryLabel: string
  canViewPrices: boolean
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const productImage = normalizeMediaUrl(
    product.thumbnail || product.images?.[0]?.url || image
  )
  const category =
    product.categories?.[0]?.name ||
    product.collection?.title ||
    fallbackCategoryLabel

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group flex w-[min(240px,calc(100vw-64px))] flex-col rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-950 hover:shadow-[0_14px_35px_rgba(15,23,42,0.08)] medium:w-auto"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded bg-neutral-100">
        {productImage ? (
          <Image
            src={productImage}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 80vw"
            className="object-contain p-3 transition duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-neutral-400">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase text-neutral-500">
          {category}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-[42px] text-base font-semibold leading-5 text-neutral-950">
          {product.title}
        </h3>
        <div className="mt-2">
          {canViewPrices ? (
            <p className="text-sm font-semibold text-neutral-950">
              {cheapestPrice?.calculated_price || "Consultar precio"}
            </p>
          ) : (
            <PriceLoginGate compact showLink={false} />
          )}
        </div>
        <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 transition group-hover:bg-neutral-950 group-hover:text-white">
          Ver detalles
        </span>
      </div>
    </LocalizedClientLink>
  )
}

export function FeaturedProducts({
  products,
  content,
  canViewPrices = false,
}: {
  products: HttpTypes.StoreProduct[]
  content: HomepageContent
  canViewPrices?: boolean
}) {
  const fallbackProductImages = content.productFallbackImages

  return (
    <section className="bg-white py-10 small:py-12">
      <Container>
        <SectionHeading
          title={content.catalogTitle}
          href="/store"
          action="Ver todos los productos"
        />
        {products.length > 0 ? (
          <div className="-mx-4 flex max-w-[100vw] snap-x gap-4 overflow-x-auto overflow-y-hidden px-4 pb-2 medium:mx-0 medium:grid medium:max-w-none medium:grid-cols-5 medium:overflow-visible medium:px-0">
            {products.slice(0, 5).map((product, index) => (
              <div key={product.id} className="snap-start shrink-0 medium:shrink">
                <ProductCard
                  product={product}
                  image={
                    fallbackProductImages[
                      index % Math.max(fallbackProductImages.length, 1)
                    ] || ""
                  }
                  fallbackCategoryLabel={content.catalogEyebrow}
                  canViewPrices={canViewPrices}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
            {content.emptyCatalogMessage}
          </div>
        )}
      </Container>
    </section>
  )
}
