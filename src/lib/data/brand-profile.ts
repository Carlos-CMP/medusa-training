"use server"

import { clientProfile, ClientProfile } from "@/lib/client-profile"
import { sdk } from "@/lib/config"

const removeInternalLinks = (links: ClientProfile["navigation"]["main"]) =>
  links
    .filter((link) => link.enabled !== false && link.href !== "/ngs-poc")
    .map((link) => ({
      ...link,
      children: link.children ? removeInternalLinks(link.children) : undefined,
    }))

const sanitizeBrandProfile = (profile: ClientProfile): ClientProfile => ({
  ...profile,
  navigation: {
    ...profile.navigation,
    main: removeInternalLinks(profile.navigation.main),
  },
  footer: {
    ...profile.footer,
    columns: profile.footer.columns.map((column) => ({
      ...column,
      links: removeInternalLinks(column.links),
    })),
  },
})

const shouldNormalizeCopy = (value: string) =>
  !/^(https?:|\/|mailto:|tel:)/i.test(value)

const normalizeSpanishCopy = (value: unknown): unknown => {
  if (typeof value === "string") {
    if (!shouldNormalizeCopy(value)) {
      return value
    }

    return value
      .replace(/\bEnvios\b/g, "Envíos")
      .replace(/\benvios\b/g, "envíos")
      .replace(/\bGarantia\b/g, "Garantía")
      .replace(/\bgarantia\b/g, "garantía")
      .replace(/\bMas info\b/g, "Más info")
      .replace(/\bmas info\b/g, "más info")
      .replace(/\bSoporte tecnico\b/g, "Soporte técnico")
      .replace(/\bsoporte tecnico\b/g, "soporte técnico")
      .replace(/\btecnico\b/g, "técnico")
      .replace(/\bTecnico\b/g, "Técnico")
      .replace(/\brapida\b/g, "rápida")
      .replace(/\bRapida\b/g, "Rápida")
      .replace(/\blogistica\b/g, "logística")
      .replace(/\bLogistica\b/g, "Logística")
      .replace(/\bcatalogo\b/g, "catálogo")
      .replace(/\bCatalogo\b/g, "Catálogo")
      .replace(/\bsesion\b/g, "sesión")
      .replace(/\bSesion\b/g, "Sesión")
      .replace(/\bterminos\b/g, "términos")
      .replace(/\bTerminos\b/g, "Términos")
      .replace(/\bpolitica\b/g, "política")
      .replace(/\bPolitica\b/g, "Política")
  }

  if (Array.isArray(value)) {
    return value.map(normalizeSpanishCopy)
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        normalizeSpanishCopy(item),
      ])
    )
  }

  return value
}

export const retrieveBrandProfile = async (): Promise<ClientProfile> => {
  return sdk.client
    .fetch<{ brand_profile: Partial<ClientProfile> }>("/store/brand-profile", {
      method: "GET",
      next: {
        revalidate: 60,
      },
    })
    .then(({ brand_profile }) => {
      const normalizedBrandProfile = normalizeSpanishCopy(
        brand_profile
      ) as Partial<ClientProfile>
      const merged: ClientProfile = {
        ...clientProfile,
        ...normalizedBrandProfile,
        brand: {
          ...clientProfile.brand,
          ...normalizedBrandProfile.brand,
          logo: {
            ...clientProfile.brand.logo,
            ...normalizedBrandProfile.brand?.logo,
          },
          colors: {
            ...clientProfile.brand.colors,
            ...normalizedBrandProfile.brand?.colors,
          },
        },
        seo: {
          ...clientProfile.seo,
          ...normalizedBrandProfile.seo,
        },
        markets: {
          ...clientProfile.markets,
          ...normalizedBrandProfile.markets,
        },
        navigation: {
          ...clientProfile.navigation,
          ...normalizedBrandProfile.navigation,
        },
        footer: {
          ...clientProfile.footer,
          ...normalizedBrandProfile.footer,
        },
        fallbacks: {
          ...clientProfile.fallbacks,
          ...normalizedBrandProfile.fallbacks,
        },
        productPage: {
          ...clientProfile.productPage,
          ...normalizedBrandProfile.productPage,
        },
      }

      return sanitizeBrandProfile(merged)
    })
    .catch(() => sanitizeBrandProfile(clientProfile))
}
