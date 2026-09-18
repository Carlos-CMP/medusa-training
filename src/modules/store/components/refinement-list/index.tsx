"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import SortProducts, { SortOptions } from "./sort-products"
import { Container } from "@medusajs/ui"
import SearchInResults from "./search-in-results"
import { HttpTypes } from "@medusajs/types"
import CategoryList from "./category-list"
import CuratedB2BFilters from "./curated-b2b-filters"

type RefinementListProps = {
  sortBy: SortOptions
  listName?: string
  "data-testid"?: string
  categories?: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
  hideOptionsPicker?: boolean
}

const RefinementList = ({
  sortBy,
  listName,
  "data-testid": dataTestId,
  categories,
  currentCategory,
  hideOptionsPicker: _hideOptionsPicker,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      params.delete("page")

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    const nextUrl = query ? `${pathname}?${query}` : pathname
    const currentSearch = searchParams.toString()
    const currentUrl = currentSearch
      ? `${pathname}?${currentSearch}`
      : pathname
    if (nextUrl === currentUrl) return
    router.push(nextUrl)
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 small:w-[280px]">
      <Container className="flex flex-col divide-y divide-neutral-200 p-0 w-full">
        <SearchInResults listName={listName} />
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={dataTestId}
        />
      </Container>
      <CuratedB2BFilters />
      {categories && (
        <CategoryList
          categories={categories}
          currentCategory={currentCategory}
        />
      )}
    </div>
  )
}

export default RefinementList
