import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export function ProductBreadcrumbs({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const category = product.categories?.[0]

  return (
    <nav
      aria-label="Breadcrumb"
      className="content-container flex flex-wrap items-center gap-2 py-6 text-xs text-neutral-500"
    >
      <LocalizedClientLink href="/" className="hover:text-neutral-950">
        Inicio
      </LocalizedClientLink>
      <span>/</span>
      <LocalizedClientLink href="/store" className="hover:text-neutral-950">
        Productos
      </LocalizedClientLink>
      {category && (
        <>
          <span>/</span>
          <LocalizedClientLink
            href={`/categories/${category.handle}`}
            className="hover:text-neutral-950"
          >
            {category.name}
          </LocalizedClientLink>
        </>
      )}
      <span>/</span>
      <span className="font-semibold text-neutral-950">{product.title}</span>
    </nav>
  )
}
