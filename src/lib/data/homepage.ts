import { clientHomepageContent } from "@/lib/client-profile"
import { sdk } from "@/lib/config"

export type HomepageMetric = {
  value: string
  label: string
  isHidden?: boolean
}

export type HomepageImageBlock = {
  title: string
  body: string
  image: string
  isHidden?: boolean
}

export type HomepageCategoryBlock = {
  title: string
  handle: string
  image: string
}

export type HomepageContent = {
  heroBadgePrimary: string
  heroBadgeSecondary: string
  heroTitle: string
  heroBody: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  heroImage: string
  heroImageAlt: string
  heroImageEyebrow: string
  heroImageTitle: string
  metrics: HomepageMetric[]
  trustBlocks: HomepageImageBlock[]
  capabilityEyebrow: string
  capabilityTitle: string
  capabilityBlocks: HomepageImageBlock[]
  categoryEyebrow: string
  categoryTitle: string
  featuredCategories: HomepageCategoryBlock[]
  detailEyebrow: string
  detailTitle: string
  detailBody: string
  detailCtaLabel: string
  detailCtaHref: string
  detailImage: string
  detailImageAlt: string
  detailBlocks: HomepageImageBlock[]
  catalogEyebrow: string
  catalogTitle: string
  productFallbackImages: string[]
  emptyCatalogMessage: string
  commercialCtaTitle: string
  commercialCtaBody: string
  commercialCtaLabel: string
  commercialCtaHref: string
  operationsEyebrow: string
  operationsTitle: string
  operations: string[]
}

export const DEFAULT_HOMEPAGE_CONTENT =
  clientHomepageContent as unknown as HomepageContent

export const getHomepageContent = async (): Promise<HomepageContent> => {
  return sdk.client
    .fetch<{ homepage: Partial<HomepageContent> }>("/store/homepage", {
      method: "GET",
      cache: "no-store",
    })
    .then(({ homepage }) => {
      const isLegacyBackendDefault =
        homepage.heroBadgePrimary === "Medusa B2B real" ||
        homepage.heroTitle ===
          "Portal mayorista NGS para vender mejor al canal profesional."

      if (isLegacyBackendDefault) {
        return DEFAULT_HOMEPAGE_CONTENT
      }

      return {
        ...DEFAULT_HOMEPAGE_CONTENT,
        ...homepage,
      }
    })
    .catch(() => DEFAULT_HOMEPAGE_CONTENT)
}
