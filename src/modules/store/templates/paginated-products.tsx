import { listProductsWithSort } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { canCustomerViewB2BPrices } from "@/lib/util/b2b-access"
import ProductPreview from "@/modules/products/components/product-preview"
import { Pagination } from "@/modules/store/components/pagination"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { B2BCustomer } from "@/types"
import { Container } from "@medusajs/ui"

const PRODUCT_LIMIT = 12

export type ProductFacetFilters = {
  availability?: string
  priceMin?: string
  priceMax?: string
  powerBand?: string
  application?: string
  connectivity?: string
}

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
  customer_group_id?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  customer,
  optionValueIds,
  searchQuery,
  productFilters,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  customer?: B2BCustomer | null
  optionValueIds?: string[]
  searchQuery?: string
  productFilters?: ProductFacetFilters
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  } else if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  let {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    optionValueIds,
    searchQuery,
    productFilters,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const canViewPrices = canCustomerViewB2BPrices(customer)

  return (
    <>
      <ul
        className="grid grid-cols-1 w-full small:grid-cols-3 medium:grid-cols-4 gap-3"
        data-testid="products-list"
      >
        {products.length > 0 ? (
          products.map((p) => {
            return (
              <li key={p.id}>
                <ProductPreview
                  product={p}
                  region={region}
                  canViewPrices={canViewPrices}
                />
              </li>
            )
          })
        ) : (
          <Container className="text-center text-sm text-neutral-500">
            {searchQuery
              ? `No se encontraron productos para "${searchQuery}".`
              : "No hay productos disponibles en esta selección."}
          </Container>
        )}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
