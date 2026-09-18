import { generatedProfileBundles } from "./generated-profiles"

export type ClientProfileLink = {
  label: string
  href: string
  enabled?: boolean
  children?: ClientProfileLink[]
}

export type ClientProfile = {
  id: string
  brand: {
    name: string
    legalName: string
    tagline: string
    logo: {
      light: string
      dark: string
    }
    colors: {
      background: string
      foreground: string
      primary: string
      accent: string
      muted: string
      border: string
    }
  }
  seo: {
    title: string
    description: string
  }
  markets: {
    defaultCountryCode: string
    languages: string[]
    currency: string
  }
  navigation: {
    main: ClientProfileLink[]
  }
  footer: {
    description: string
    columns: Array<{
      title: string
      links: ClientProfileLink[]
    }>
  }
  fallbacks: {
    productCategoryLabel: string
    productTechnicalDescription: string
    productBrandKeywords: string[]
  }
  productPage?: {
    benefits?: Array<{
      label: string
    }>
    supportPanels?: Array<{
      title: string
      body: string
      action: string
      href?: string
    }>
  }
}

type ClientProfileBundle = {
  profile: ClientProfile
  homepage: Record<string, unknown>
}

const profileBundles = generatedProfileBundles as Record<
  string,
  ClientProfileBundle
>

export const getClientProfileBundle = () => {
  const activeProfile = process.env.NEXT_PUBLIC_B2B_CLIENT_PROFILE || "ngs"

  return profileBundles[activeProfile] || profileBundles.ngs
}

export const clientProfile = getClientProfileBundle().profile
export const clientHomepageContent = getClientProfileBundle().homepage

export const getClientSeoTitle = (title?: string) => {
  if (!title) {
    return clientProfile.seo.title
  }

  return `${title} | ${clientProfile.brand.name} B2B`
}
