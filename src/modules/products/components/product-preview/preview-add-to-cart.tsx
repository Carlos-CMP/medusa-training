"use client"

import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { getVariantPackaging } from "@/lib/util/b2b-packaging"
import type { StoreProductPackaging } from "@/lib/data/product-packaging"
import { StoreProduct, StoreRegion } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import ShoppingBag from "@/modules/common/icons/shopping-bag"
import { useState } from "react"

const PreviewAddToCart = ({
  product,
  region,
  packaging,
}: {
  product: StoreProduct
  region: StoreRegion
  packaging?: StoreProductPackaging
}) => {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    if (isAdding || !product?.variants?.[0]?.id) return null

    try {
      setIsAdding(true)

      const variant = product.variants[0]
      const variantPackaging = getVariantPackaging(product, variant, packaging)
      const quantity = Math.max(
        variantPackaging.minimumOrderQuantity,
        variantPackaging.quantityIncrement,
        1
      )

      addToCartEventBus.emitCartAdd({
        lineItems: [
          {
            productVariant: {
              ...variant,
              product,
            },
            quantity,
            metadata: {
              purchase_unit: "unit",
              package_quantity: 0,
              units_per_box: variantPackaging.unitsPerBox,
              unit_quantity: quantity,
              minimum_order_quantity: variantPackaging.minimumOrderQuantity,
              quantity_increment: variantPackaging.quantityIncrement,
              boxes_per_pallet: variantPackaging.palletUnits,
              package_weight: variantPackaging.packageWeight,
              package_dimensions: variantPackaging.packageDimensions,
            },
          },
        ],
        regionId: region.id,
      })
    } finally {
      setIsAdding(false)
    }
  }
  return (
    <Button
      size="small"
      className="h-10 min-w-[120px] shrink-0 rounded-md border-none px-3 text-xs font-semibold shadow-none"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleAddToCart()
      }}
      isLoading={isAdding}
      aria-label={`Añadir ${product.title} al carrito`}
    >
      {!isAdding && <ShoppingBag fill="#fff" />}
      Añadir
    </Button>
  )
}

export default PreviewAddToCart
