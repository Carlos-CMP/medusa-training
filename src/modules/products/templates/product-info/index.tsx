import { getCatalogRuleSummary } from "@/lib/util/catalog-rules"
import {
  getInventorySummary,
  getProductHighlights,
  getProductSeries,
  getProductSubtitle,
} from "@/lib/util/product-technical-profile"
import { ClientProfile } from "@/lib/client-profile"
import { HttpTypes } from "@medusajs/types"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  profile?: ClientProfile
  canViewPrices?: boolean
}

const ProductInfo = ({
  product,
  profile,
  canViewPrices = false,
}: ProductInfoProps) => {
  const firstVariant = product.variants?.[0]
  const inventory = getInventorySummary(product)
  const highlights = getProductHighlights(product, profile)
  const visibleHighlights = highlights.slice(0, 4)
  const category = product.categories?.[0]?.name
  const catalogRuleSummary = getCatalogRuleSummary(product)
  const priceRule = catalogRuleSummary?.priceRule

  return (
    <section id="product-info" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
          {getProductSeries(product)}
        </p>
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
          <span
            className={
              inventory.tone === "green"
                ? "h-2 w-2 rounded-full bg-green-500"
                : inventory.tone === "amber"
                ? "h-2 w-2 rounded-full bg-amber-500"
                : "h-2 w-2 rounded-full bg-red-500"
            }
          />
          {inventory.label}
        </div>
      </div>

      <h1
        className="mt-2 text-[24px] font-semibold leading-[1.08] tracking-normal text-neutral-950 small:text-[30px]"
        data-testid="product-title"
      >
        {product.title}
      </h1>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-b border-neutral-200 pb-4 text-sm text-neutral-600">
        {firstVariant?.sku && (
          <span>
            SKU:{" "}
            <strong className="font-semibold text-neutral-950">
              {firstVariant.sku}
            </strong>
          </span>
        )}
        {category && (
          <span>
            Categoría:{" "}
            <strong className="font-semibold text-neutral-950">
              {category}
            </strong>
          </span>
        )}
        {product.collection?.title && (
          <span>
            Colección:{" "}
            <strong className="font-semibold text-neutral-950">
              {product.collection.title}
            </strong>
          </span>
        )}
      </div>

      <p
        className="mt-4 max-w-2xl text-sm leading-6 text-neutral-700"
        data-testid="product-description"
      >
        {getProductSubtitle(product, profile)}
      </p>

      {visibleHighlights.length > 1 && (
        <dl className="mt-4 grid w-full grid-cols-2 overflow-hidden rounded-lg border border-neutral-200 bg-white small:grid-cols-4">
          {visibleHighlights.map((highlight) => (
            <div
              key={highlight.label}
              className="border-neutral-200 px-3 py-3 [&:not(:last-child)]:border-r"
            >
              <dt className="text-[11px] leading-4 text-neutral-500">
                {highlight.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-neutral-950">
                {highlight.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {canViewPrices && (priceRule || catalogRuleSummary?.requiresQuote) && (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
            Condición comercial B2B
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">
            {priceRule?.effect_type === "discount_percentage"
              ? `${priceRule.discount_percentage}% de descuento aplicado a este contexto`
              : priceRule?.effect_type === "fixed_price"
              ? `Precio fijo B2B aplicado`
              : "Compra mediante presupuesto comercial"}
          </p>
          {catalogRuleSummary?.requiresQuote && (
            <p className="mt-1 text-xs text-neutral-500">
              Añade las cantidades al presupuesto para que el equipo comercial
              confirme precio, disponibilidad y condiciones.
            </p>
          )}
          {priceRule?.minimum_quantity && priceRule.minimum_quantity > 1 && (
            <p className="mt-1 text-xs text-neutral-500">
              Pedido mínimo para esta regla: {priceRule.minimum_quantity} uds.
            </p>
          )}
        </div>
      )}

    </section>
  )
}

export default ProductInfo
