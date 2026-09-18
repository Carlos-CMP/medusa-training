import { retrieveBrandProfile } from "@/lib/data/brand-profile"
import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import PaginatedProducts from "@/modules/store/templates/paginated-products"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamicParams = true

const getCatalogBrandName = (brandName: string) =>
  brandName.toLowerCase() === "ngs" ? "Novisound" : brandName

export async function generateMetadata(): Promise<Metadata> {
  const profile = await retrieveBrandProfile()
  const catalogBrandName = getCatalogBrandName(profile.brand.name)

  return {
    title: `Catálogo | ${catalogBrandName} B2B`,
    description: `Catálogo mayorista ${catalogBrandName} con filtros, disponibilidad y tarifas B2B bajo acceso.`,
  }
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
    availability?: string
    price_min?: string
    price_max?: string
    power_band?: string
    application?: string
    connectivity?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
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

  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1
  const productFilters = {
    availability,
    priceMin: price_min,
    priceMax: price_max,
    powerBand: power_band,
    application,
    connectivity,
  }

  const [categories, customer] = await Promise.all([
    listCategories(),
    retrieveCustomer(),
  ])
  const profile = await retrieveBrandProfile()
  const catalogBrandName = getCatalogBrandName(profile.brand.name)

  return (
    <div className="bg-neutral-100">
      <section className="border-b border-neutral-200 bg-white">
        <div className="content-container py-8">
          <p className="text-xs font-semibold uppercase text-[#d71920]">
            Catálogo profesional
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Productos {catalogBrandName} para compra B2B
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
            Filtra por categoría y atributos. Las tarifas negociadas, descuentos
            y compra online están disponibles tras iniciar sesión.
          </p>
        </div>
      </section>
      <div
        className="flex flex-col py-6 content-container gap-4"
        data-testid="category-container"
      >
        <StoreBreadcrumb />
        <div className="flex flex-col small:flex-row small:items-start gap-3">
          <RefinementList
            sortBy={sort}
            categories={categories}
          />
          <div className="w-full">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={params.countryCode}
                customer={customer}
                searchQuery={q}
                productFilters={productFilters}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
