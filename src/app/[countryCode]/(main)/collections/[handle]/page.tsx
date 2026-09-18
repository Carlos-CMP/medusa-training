import { getClientSeoTitle } from "@/lib/client-profile"
import { getCollectionByHandle } from "@/lib/data/collections"
import { retrieveCustomer } from "@/lib/data/customer"
import CollectionTemplate from "@/modules/collections/templates"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamicParams = true
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
    q?: string
    availability?: string
    price_min?: string
    price_max?: string
    power_band?: string
    application?: string
    connectivity?: string
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const [collection, customer] = await Promise.all([
    getCollectionByHandle(params.handle),
    retrieveCustomer().catch(() => null),
  ])

  if (!collection) {
    notFound()
  }

  const metadata = {
    title: getClientSeoTitle(collection.title),
    description: `${collection.title} collection`,
  } as Metadata

  return metadata
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const {
    sortBy,
    page,
    q,
    availability,
    price_min,
    price_max,
    power_band,
    application,
    connectivity,
  } = searchParams
  const productFilters = {
    availability,
    priceMin: price_min,
    priceMax: price_max,
    powerBand: power_band,
    application,
    connectivity,
  }

  const [collection, customer] = await Promise.all([
    getCollectionByHandle(params.handle),
    retrieveCustomer().catch(() => null),
  ])

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
      customer={customer}
      searchQuery={q}
      productFilters={productFilters}
    />
  )
}
