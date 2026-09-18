import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import SquareMinus from "@/modules/common/icons/square-minus"
import SquarePlus from "@/modules/common/icons/square-plus"
import { HttpTypes } from "@medusajs/types"
import { Container, Text, clx } from "@medusajs/ui"
import { usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

const CategoryList = ({
  categories,
  currentCategory,
}: {
  categories: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
}) => {
  const visibleCategories = useMemo(
    () => categories.filter((category) => isNovisoundCategory(category)),
    [categories]
  )

  const getCategoriesToExpand = useCallback(
    (category: HttpTypes.StoreProductCategory) => {
      const categoriesToExpand = [category.id]
      let current = category
      while (current.parent_category_id) {
        categoriesToExpand.push(current.parent_category_id)
        current = visibleCategories.find(
          (cat) => cat.id === current.parent_category_id
        ) as HttpTypes.StoreProductCategory
      }
      return categoriesToExpand
    },
    [visibleCategories]
  )

  const [expandedCategories, setExpandedCategories] = useState<string[]>(() =>
    currentCategory ? getCategoriesToExpand(currentCategory) : []
  )

  const pathname = usePathname()

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const searchParams = useSearchParams()

  const isCurrentCategory = (handle: string) =>
    pathname.split("/").slice(2).join("/") === `categories/${handle}`

  const getCategoryHref = (handle: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    params.delete("page")

    const nextSearch = params.toString()
    return `/categories/${handle}${nextSearch ? `?${nextSearch}` : ""}`
  }

  useEffect(() => {
    if (currentCategory) {
      const categoriesToExpand = getCategoriesToExpand(currentCategory)
      setExpandedCategories((prev) => {
        const newCategories = categoriesToExpand.filter(
          (cat) => !prev.includes(cat)
        )
        return newCategories.length ? [...prev, ...newCategories] : prev
      })
    }
  }, [currentCategory, getCategoriesToExpand])

  const getCategoryMarginLeft = useCallback(
    (category: HttpTypes.StoreProductCategory) => {
      let level = 0
      let currentCategory = category
      while (currentCategory.parent_category_id) {
        level++
        currentCategory = visibleCategories.find(
          (cat) => cat.id === currentCategory.parent_category_id
        ) as HttpTypes.StoreProductCategory
      }
      return level * 4
    },
    [visibleCategories]
  )

  const renderCategory = (category: HttpTypes.StoreProductCategory) => {
    const hasChildren = category.category_children.length > 0
    const isExpanded = expandedCategories.includes(category.id)
    const paddingLeft = getCategoryMarginLeft(category)
    const isActive = isCurrentCategory(category.handle)
    const productsCount = category.products?.length || 0

    return (
      <li key={category.id}>
        <div
          className="mb-2 flex items-center gap-2"
          style={{ paddingLeft: `${paddingLeft * 0.25}rem` }}
        >
          {hasChildren ? (
            <div className="flex items-center gap-2 text-neutral-500 hover:text-neutral-700">
              <button
                type="button"
                aria-label={
                  isExpanded
                    ? `Contraer ${category.name}`
                    : `Expandir ${category.name}`
                }
                aria-expanded={isExpanded}
                onClick={() => toggleCategory(category.id)}
              >
                {isExpanded ? (
                  <SquareMinus className="h-3 mx-1" />
                ) : (
                  <SquarePlus className="h-3 mx-1" />
                )}
              </button>
              <LocalizedClientLink
                href={getCategoryHref(category.handle)}
                aria-current={isActive ? "page" : undefined}
                className={clx(
                  "flex items-center gap-2 hover:text-neutral-700",
                  isActive && "font-semibold text-neutral-950"
                )}
              >
                {category.name} ({productsCount})
              </LocalizedClientLink>
            </div>
          ) : (
            <LocalizedClientLink
              href={getCategoryHref(category.handle)}
              aria-current={isActive ? "page" : undefined}
              className={clx(
                "flex items-center gap-2 text-start text-neutral-500 hover:cursor-pointer hover:text-neutral-700",
                isActive && "font-semibold text-neutral-950"
              )}
            >
              <span
                aria-hidden="true"
                className={clx(
                  "h-3 w-3 shrink-0 rounded-full border border-neutral-300 bg-white",
                  isActive && "border-neutral-950 bg-neutral-950"
                )}
              />
              <span>
                {category.name} ({productsCount})
              </span>
            </LocalizedClientLink>
          )}
        </div>
        {hasChildren && isExpanded && (
          <ul>
            {category.category_children.map((childId) => {
              const childCategory = visibleCategories.find(
                (cat) => cat.id === childId.id
              )
              return childCategory ? renderCategory(childCategory) : null
            })}
          </ul>
        )}
      </li>
    )
  }

  return (
    <Container className="flex flex-col p-0 divide-y divide-neutral-200">
      <div className="flex justify-between items-center p-3">
        <Text className="text-sm font-medium">Categorías</Text>
        {pathname.includes("/categories") && (
          <LocalizedClientLink
            href="/store"
            className="text-xs text-neutral-500 hover:text-neutral-700"
          >
            Limpiar
          </LocalizedClientLink>
        )}
      </div>
      <ul className="flex flex-col gap-3 text-sm p-3 text-neutral-500">
        {visibleCategories
          .filter((cat) => cat.parent_category_id === null)
          .map(renderCategory)}
      </ul>
    </Container>
  )
}

export default CategoryList

const isNovisoundCategory = (category: HttpTypes.StoreProductCategory) => {
  const text = `${category.name || ""} ${category.handle || ""}`.toLowerCase()
  return text.includes("novisound")
}
