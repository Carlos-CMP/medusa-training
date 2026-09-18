import { HomepageContent } from "@/lib/data/homepage"
import { HttpTypes } from "@medusajs/types"
import { BusinessSolutions } from "../components/business-solutions"
import { CommercialCta } from "../components/commercial-cta"
import { FeaturedCategories } from "../components/featured-categories"
import { FeaturedProducts } from "../components/featured-products"
import { HeroSection } from "../components/hero-section"

export function NgsHomepage({
  content,
  categories,
  products,
  canViewPrices = false,
}: {
  content: HomepageContent
  categories: HttpTypes.StoreProductCategory[]
  products: HttpTypes.StoreProduct[]
  canViewPrices?: boolean
}) {
  return (
    <main className="bg-white text-neutral-950">
      <HeroSection content={content} />
      <FeaturedCategories categories={categories} content={content} />
      <BusinessSolutions content={content} />
      <FeaturedProducts
        products={products}
        content={content}
        canViewPrices={canViewPrices}
      />
      <CommercialCta content={content} />
    </main>
  )
}
