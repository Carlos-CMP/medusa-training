import { retrieveBrandProfile } from "@/lib/data/brand-profile"
import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import {
  DEFAULT_HOMEPAGE_CONTENT,
  getHomepageContent,
} from "@/lib/data/homepage"
import { listProducts } from "@/lib/data/products"
import { canCustomerViewB2BPrices } from "@/lib/util/b2b-access"
import { getBaseURL } from "@/lib/util/env"
import { NgsHomepage } from "@/modules/home/templates/ngs-homepage"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const profile = await retrieveBrandProfile()

  return {
    title: profile.seo.title,
    description: profile.seo.description,
    alternates: {
      canonical: `${getBaseURL()}/${profile.markets.defaultCountryCode}`,
    },
    openGraph: {
      title: profile.seo.title,
      description: profile.brand.tagline,
      images: [profile.brand.logo.dark],
    },
  }
}

const withTimeout = async <T,>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 5000
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout>

  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      timeout = setTimeout(() => resolve(fallback), timeoutMs)
    }),
  ]).finally(() => clearTimeout(timeout))
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const [categories, productsResult, homepage, profile, customer] = await Promise.all([
    withTimeout(
      listCategories({ limit: 12 }).catch(() => []),
      []
    ),
    withTimeout(
      listProducts({
        countryCode,
        queryParams: {
          limit: 5,
        },
      }).catch(() => null),
      null
    ),
    withTimeout(getHomepageContent(), DEFAULT_HOMEPAGE_CONTENT),
    retrieveBrandProfile(),
    retrieveCustomer().catch(() => null),
  ])

  const products = productsResult?.response.products || []
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: profile.brand.name,
    url: getBaseURL(),
    sameAs: [],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NgsHomepage
        content={homepage}
        categories={categories}
        products={products}
        canViewPrices={canCustomerViewB2BPrices(customer)}
      />
    </>
  )
}
