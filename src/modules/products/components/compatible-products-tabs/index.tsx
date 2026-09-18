"use client"

import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import RelationImage from "@/modules/products/components/relation-image"
import { ArrowRight } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useState } from "react"

export type CompatibleProductsSection = {
  title: string
  products: Array<{
    href: string
    image?: string
    fallbackImage?: string
    title: string
    category: string
    sku?: string
    priceLabel: string
    stockLabel: string
  }>
}

const CompatibleProductsTabs = ({
  sections,
}: {
  sections: CompatibleProductsSection[]
}) => {
  const [activeTitle, setActiveTitle] = useState(sections[0]?.title)
  const activeSection =
    sections.find((section) => section.title === activeTitle) || sections[0]

  if (!activeSection) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {sections.length > 1 && (
        <div
          role="tablist"
          aria-label="Tipos de productos compatibles"
          className="flex gap-1 overflow-x-auto border-b border-neutral-200 bg-neutral-50 p-2"
        >
          {sections.map((section) => (
            <button
              key={section.title}
              type="button"
              role="tab"
              aria-selected={activeSection.title === section.title}
              onClick={() => setActiveTitle(section.title)}
              className={clx(
                "shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-1",
                activeSection.title === section.title
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-600 hover:bg-white hover:text-neutral-950"
              )}
            >
              {section.title}
            </button>
          ))}
        </div>
      )}

      <ul className="divide-y divide-neutral-200">
        {activeSection.products.map((product) => (
          <li key={`${activeSection.title}-${product.href}-${product.sku}`}>
            <LocalizedClientLink
              href={product.href}
              className="group grid gap-3 px-4 py-3 transition hover:bg-neutral-50 small:grid-cols-[64px_minmax(0,1fr)_120px_90px_24px] small:items-center"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded bg-neutral-50">
                <RelationImage
                  src={product.image}
                  fallbackSrc={product.fallbackImage}
                  alt={product.title}
                  sizes="64px"
                  className="object-contain p-2"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-normal text-neutral-500">
                  {product.category}
                </p>
                <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-neutral-950">
                  {product.title}
                </h3>
                {product.sku && (
                  <p className="mt-1 text-xs uppercase text-neutral-500">
                    SKU: {product.sku}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold text-neutral-950">
                {product.priceLabel}
              </p>
              <p className="text-xs font-semibold text-green-700">
                {product.stockLabel}
              </p>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CompatibleProductsTabs
