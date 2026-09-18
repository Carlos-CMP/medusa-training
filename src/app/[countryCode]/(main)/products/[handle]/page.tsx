import { retrieveBrandProfile } from "@/lib/data/brand-profile"
import { retrieveCustomer } from "@/lib/data/customer"
import { getProductByHandle } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { canCustomerViewB2BPrices } from "@/lib/util/b2b-access"
import { getProductPrice } from "@/lib/util/get-product-price"
import ProductTemplate from "@/modules/products/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamicParams = true
export const dynamic = "force-dynamic"

type Props = {
  params: { countryCode: string; handle: string }
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle(handle, region.id)
  const profile = await retrieveBrandProfile()

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | ${profile.brand.name} B2B`,
    description:
      product.description ||
      product.subtitle ||
      profile.fallbacks.productTechnicalDescription,
    openGraph: {
      title: `${product.title} | ${profile.brand.name} B2B`,
      description:
        product.description ||
        product.subtitle ||
        profile.fallbacks.productTechnicalDescription,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await getProductByHandle(params.handle, region.id)
  if (!pricedProduct) {
    notFound()
  }
  const [profile, customer] = await Promise.all([
    retrieveBrandProfile(),
    retrieveCustomer().catch(() => null),
  ])
  const { cheapestPrice } = getProductPrice({ product: pricedProduct })
  const canViewPrices = canCustomerViewB2BPrices(customer)
  const category = pricedProduct.categories?.[0]
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pricedProduct.title,
    description: pricedProduct.description || pricedProduct.subtitle,
    sku: pricedProduct.variants?.[0]?.sku,
    brand: {
      "@type": "Brand",
      name: profile.brand.name,
    },
    image: pricedProduct.images?.map((image) => image.url).filter(Boolean),
    offers: canViewPrices && cheapestPrice
      ? {
          "@type": "Offer",
          price: cheapestPrice.calculated_price_number,
          priceCurrency: cheapestPrice.currency_code?.toUpperCase(),
          availability: "https://schema.org/InStock",
        }
      : undefined,
  }
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: `/${params.countryCode}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Productos",
        item: `/${params.countryCode}/store`,
      },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.name,
              item: `/${params.countryCode}/categories/${category.handle}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 4 : 3,
        name: pricedProduct.title,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        profile={profile}
        canViewPrices={canViewPrices}
      />
    </>
  )
}
