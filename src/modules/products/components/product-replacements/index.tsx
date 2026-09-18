import { getDemoReplacements } from "@/lib/b2b-industrial-demo"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ArrowRight, Wrench } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"

type ProductReplacementsProps = {
  product: HttpTypes.StoreProduct
}

const ProductReplacements = ({ product }: ProductReplacementsProps) => {
  const replacements = getDemoReplacements(product.handle)

  if (!replacements.length) {
    return null
  }

  return (
    <section className="grid gap-5 py-8">
      <div>
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Operativa industrial
        </p>
        <h2 className="mt-1 text-xl font-semibold text-neutral-950">
          Sustitutos, recambios y compatibilidad
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          Ayuda al comprador a resolver incidencias, ampliaciones y reposiciones
          sin depender de llamadas o emails comerciales.
        </p>
      </div>
      <div className="grid gap-3 medium:grid-cols-2">
        {replacements.map((item) => (
          <LocalizedClientLink
            key={item.sku}
            href={item.href}
            className="group flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-950"
          >
            <span className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-950">
                <Wrench className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase text-neutral-500">
                  {item.sku}
                </span>
                <span className="mt-1 block text-sm font-semibold text-neutral-950">
                  {item.name}
                </span>
                <span className="mt-2 block text-sm text-neutral-600">
                  {item.reason}
                </span>
                <span className="mt-2 block text-xs font-semibold text-green-700">
                  {item.availability}
                </span>
              </span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}

export default ProductReplacements
