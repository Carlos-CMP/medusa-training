"use client"

import { StoreProductPackaging } from "@/lib/data/product-packaging"
import { HttpTypes } from "@medusajs/types"
import ProductVariantsTable from "../product-variants-table"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  packagingByVariantId?: Record<string, StoreProductPackaging>
  canViewPrices?: boolean
}

export default function ProductActions({
  product,
  region,
  packagingByVariantId,
  canViewPrices = false,
}: ProductActionsProps) {
  return (
    <>
      <div className="flex flex-col gap-y-2 w-full">
        <ProductVariantsTable
          product={product}
          region={region}
          packagingByVariantId={packagingByVariantId}
          canViewPrices={canViewPrices}
        />
      </div>
    </>
  )
}
