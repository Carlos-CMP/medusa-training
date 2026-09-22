"use server"

import { sdk } from "@/lib/config"
import {
  applyCatalogRulesToProduct,
  applyCatalogRulesToProducts,
} from "@/lib/data/catalog-rules"
import { getAuthHeaders, getGlobalCacheOptions } from "@/lib/data/cookies"
import { getRegion } from "@/lib/data/regions"
import { sortProducts } from "@/lib/util/sort-products"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"

type ProductFacetFilters = {
  availability?: string
  priceMin?: string
  priceMax?: string
  powerBand?: string
  application?: string
  connectivity?: string
}

export const getProductsById = async ({
  ids,
  regionId,
}: {
  ids: string[]
  regionId: string
}) => {
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = getGlobalCacheOptions("products")

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>(`/store/products`, {
      credentials: "include",
      method: "GET",
      query: {
        id: ids,
        region_id: regionId,
        fields:
          "*variants,*variants.calculated_price,*variants.inventory_quantity",
      },
      headers,
      next,
    })
    .then(({ products }) => products)
}

export const getProductByHandle = async (handle: string, regionId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = getGlobalCacheOptions("products")

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>(`/store/products`, {
      credentials: "include",
      method: "GET",
      query: {
        handle,
        region_id: regionId,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,*categories,*collection",
      },
      headers,
      next,
    })
    .then(async ({ products }) => {
      const product = products[0]

      if (!product) {
        return undefined
      }

      const currencyCode =
        product.variants?.find((variant) => variant.calculated_price)
          ?.calculated_price?.currency_code || "eur"

      return applyCatalogRulesToProduct({
        product,
        region: {
          id: regionId,
          currency_code: currencyCode,
        } as HttpTypes.StoreRegion,
      })
    })
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = (_pageParam - 1) * limit
  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = getGlobalCacheOptions("products")

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        credentials: "include",
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region.id,
          fields:
            "*variants.calculated_price,*variants.options,+variants.sku,+variants.title,+variants.inventory_quantity,+variants.manage_inventory,+metadata,*categories,*collection",
          ...queryParams,
        },
        headers,
        next,
      }
    )
    .then(async ({ products, count }) => {
      const visibleProducts = await applyCatalogRulesToProducts({
        products,
        region,
        categoryId: Array.isArray(queryParams?.category_id)
          ? queryParams?.category_id[0]
          : queryParams?.category_id,
        collectionId: Array.isArray(queryParams?.collection_id)
          ? queryParams?.collection_id[0]
          : queryParams?.collection_id,
      })
      const visibleCount =
        visibleProducts.length === products.length ? count : visibleProducts.length
      const nextPage = visibleCount > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products: visibleProducts,
          count: visibleCount,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
  searchQuery,
  productFilters,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams &
    HttpTypes.StoreProductParams & { option_value_id?: string | string[] }
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: string[]
  searchQuery?: string
  productFilters?: ProductFacetFilters
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const dedupedOptionValueIds = optionValueIds?.length
    ? Array.from(new Set(optionValueIds))
    : undefined

  const {
    response: { products },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      ...(dedupedOptionValueIds
        ? { option_value_id: dedupedOptionValueIds }
        : {}),
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)
  const catalogProducts = sortedProducts.filter((product) => {
    const kind = product.metadata?.product_kind

    return (
      kind !== "spare_part" &&
      kind !== "accessory" &&
      isNovisoundCatalogProduct(product)
    )
  })
  const searchedProducts = filterProductsByB2BQuery(catalogProducts, searchQuery)
  const facetedProducts = filterProductsByB2BFacets(
    searchedProducts,
    productFilters
  )

  // When filtering by option_value_id, the API's `count` may not reflect the
  // filtered set in client-side sort flows that pre-fetch a page of 100.
  // Recompute count from the actual returned list so pagination is correct.
  const effectiveCount = facetedProducts.length

  const pageParam = (page - 1) * limit

  const nextPage =
    effectiveCount > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = facetedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count: effectiveCount,
    },
    nextPage,
    queryParams,
  }
}

const filterProductsByB2BFacets = (
  products: HttpTypes.StoreProduct[],
  filters?: ProductFacetFilters
) => {
  if (!filters || !hasActiveFacetFilters(filters)) {
    return products
  }

  const minPrice = parseMoney(filters.priceMin)
  const maxPrice = parseMoney(filters.priceMax)

  return products.filter((product) => {
    const price = getProductMinPrice(product)

    if (minPrice !== undefined && price !== undefined && price < minPrice) {
      return false
    }

    if (maxPrice !== undefined && price !== undefined && price > maxPrice) {
      return false
    }

    if (
      filters.availability &&
      !matchesAvailability(product, filters.availability)
    ) {
      return false
    }

    if (filters.powerBand && !matchesPowerBand(product, filters.powerBand)) {
      return false
    }

    if (filters.application && !matchesApplication(product, filters.application)) {
      return false
    }

    if (
      filters.connectivity &&
      !matchesConnectivity(product, filters.connectivity)
    ) {
      return false
    }

    return true
  })
}

const hasActiveFacetFilters = (filters: ProductFacetFilters) =>
  Boolean(
    filters.availability ||
      filters.priceMin ||
      filters.priceMax ||
      filters.powerBand ||
      filters.application ||
      filters.connectivity
  )

const parseMoney = (value?: string) => {
  if (!value) return undefined
  const parsed = Number(String(value).replace(",", "."))
  return Number.isFinite(parsed) ? parsed : undefined
}

const getProductMinPrice = (product: HttpTypes.StoreProduct) => {
  const prices =
    product.variants
      ?.map((variant) => variant.calculated_price?.calculated_amount)
      .filter((amount): amount is number => typeof amount === "number") || []

  return prices.length ? Math.min(...prices) : undefined
}

const getProductTotalStock = (product: HttpTypes.StoreProduct) =>
  product.variants?.reduce((sum, variant) => {
    const metadataStock = Number(variant.metadata?.stock_available)
    const stock = Number.isFinite(metadataStock)
      ? metadataStock
      : Number(variant.inventory_quantity || 0)

    return sum + stock
  }, 0) || 0

const matchesAvailability = (
  product: HttpTypes.StoreProduct,
  availability: string
) => {
  const stock = getProductTotalStock(product)

  if (availability === "in_stock") {
    return stock > 0
  }

  if (availability === "low_stock") {
    return stock > 0 && stock <= 20
  }

  return true
}

const getPowerValue = (product: HttpTypes.StoreProduct) => {
  const value = String(product.metadata?.power || "")
  const multiplied = value.match(/(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)/i)

  if (multiplied) {
    return parseMoney(multiplied[1])! * parseMoney(multiplied[2])!
  }

  const values = value
    .match(/\d+(?:[.,]\d+)?/g)
    ?.map((item) => parseMoney(item))
    .filter((item): item is number => item !== undefined) || []

  return values.length ? Math.max(...values) : undefined
}

const matchesPowerBand = (product: HttpTypes.StoreProduct, band: string) => {
  const power = getPowerValue(product)

  if (power === undefined) {
    return false
  }

  if (band === "compact") {
    return power <= 100
  }

  if (band === "mid") {
    return power > 100 && power <= 500
  }

  if (band === "high") {
    return power > 500
  }

  return true
}

const normalize = (value?: unknown) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const isNovisoundCatalogProduct = (product: HttpTypes.StoreProduct) => {
  const metadata = product.metadata || {}
  const identifiers = [
    product.title,
    product.handle,
    metadata.brand,
    metadata.bluestone_product_number,
    metadata.sync_scope,
    metadata.collection,
  ]

  return identifiers.some((value) => normalize(value).includes("novisound"))
}

const productFacetText = (product: HttpTypes.StoreProduct) =>
  normalize(
    [
      product.title,
      product.subtitle,
      product.description,
      product.collection?.title,
      product.metadata?.collection,
      product.metadata?.category_name,
      product.metadata?.connectivity,
    ]
      .filter(Boolean)
      .join(" ")
  )

const matchesApplication = (
  product: HttpTypes.StoreProduct,
  application: string
) => {
  const text = productFacetText(product)
  const termsByApplication: Record<string, string[]> = {
    fixed_install: ["instalacion", "integrador", "showroom", "retail"],
    events: ["evento", "portable", "portatil", "microfono", "live"],
    business_spaces: ["hotel", "hospitality", "meeting", "reunion", "suite"],
    studio: ["studio", "estudio", "monitor", "produccion"],
  }

  return (termsByApplication[application] || []).some((term) =>
    text.includes(term)
  )
}

const matchesConnectivity = (
  product: HttpTypes.StoreProduct,
  connectivity: string
) => {
  const text = productFacetText(product)

  if (connectivity === "wired") {
    return ["xlr", "rca", "trs", "bornes", "usb", "ethernet"].some((term) =>
      text.includes(term)
    )
  }

  if (connectivity === "wireless") {
    return ["bluetooth", "uhf", "inalambrica", "wireless", "tws"].some(
      (term) => text.includes(term)
    )
  }

  if (connectivity === "av") {
    return ["hdmi", "earc", "optico", "rs-232", "av"].some((term) =>
      text.includes(term)
    )
  }

  return true
}

const filterProductsByB2BQuery = (
  products: HttpTypes.StoreProduct[],
  searchQuery?: string
) => {
  const query = searchQuery?.trim().toLowerCase()

  if (!query) {
    return products
  }

  return products.filter((product) =>
    getProductSearchText(product).includes(query)
  )
}

const getProductSearchText = (product: HttpTypes.StoreProduct) => {
  const metadata = product.metadata || {}
  const metadataValues = Object.entries(metadata)
    .filter(([key]) =>
      ["ean", "gtin", "barcode", "mpn", "reference", "referencia"].includes(
        key.toLowerCase()
      )
    )
    .map(([, value]) => String(value || ""))

  const variantValues =
    product.variants?.flatMap((variant) => [
      variant.title,
      variant.sku,
      ...(variant.options?.map((option) => option.value) || []),
    ]) || []

  return [
    product.title,
    product.subtitle,
    product.handle,
    product.description,
    ...metadataValues,
    ...variantValues,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}
