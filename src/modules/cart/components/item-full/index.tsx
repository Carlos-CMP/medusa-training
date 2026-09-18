"use client"

import { useCart } from "@/lib/context/cart-context"
import {
  formatPackagingDetails,
  formatPackagingLine,
  getCartLinePackaging,
} from "@/lib/util/b2b-packaging"
import AddNoteButton from "@/modules/cart/components/add-note-button"
import DeleteButton from "@/modules/common/components/delete-button"
import LineItemPrice from "@/modules/common/components/line-item-price"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Spinner from "@/modules/common/icons/spinner"
import Thumbnail from "@/modules/products/components/thumbnail"
import { HttpTypes } from "@medusajs/types"
import { clx, Container, Input } from "@medusajs/ui"
import { startTransition, useEffect, useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  showBorders?: boolean
  currencyCode: string
  disabled?: boolean
  showPrices?: boolean
}

const ItemFull = ({
  item,
  showBorders = true,
  currencyCode,
  disabled,
  showPrices = true,
}: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [quantity, setQuantity] = useState(item.quantity.toString())

  const { handleDeleteItem, handleUpdateCartQuantity } = useCart()
  const maxQuantity = item.variant?.inventory_quantity ?? 100
  const packaging = getCartLinePackaging(item.metadata, item.quantity)
  const isBoxPurchase = packaging?.purchaseUnit === "box"
  const minimumOrderQuantity =
    toPositiveInteger(item.metadata?.minimum_order_quantity) ?? 1
  const quantityIncrement =
    toPositiveInteger(item.metadata?.quantity_increment) ?? 1
  const currentPackageQuantity = isBoxPurchase
    ? packaging?.packageQuantity
    : undefined
  const maxDisplayQuantity = packaging
    ? Math.max(Math.floor(maxQuantity / packaging.unitsPerBox), 1)
    : maxQuantity
  const displayedQuantity = quantity
  const quantityLabel = isBoxPurchase ? "cajas" : "uds"
  const packagingDetails = packaging ? formatPackagingDetails(packaging) : ""
  const brandName =
    typeof item.product?.metadata?.brand === "string"
      ? item.product.metadata.brand
      : typeof item.product?.metadata?.brand_name === "string"
      ? item.product.metadata.brand_name
      : "NGS"

  const changeQuantity = async (newQuantity: number) => {
    const nextQuantity = normalizeUnitQuantity(
      newQuantity,
      minimumOrderQuantity,
      quantityIncrement,
      maxQuantity
    )

    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      setUpdating(true)
      try {
        await handleDeleteItem(item.id)
      } finally {
        setUpdating(false)
      }
      return
    }

    setError(null)
    setUpdating(true)

    startTransition(() => {
      setQuantity(nextQuantity.toString())
    })

    const nextMetadata = item.metadata
      ? {
          ...item.metadata,
          purchase_unit: item.metadata.purchase_unit || "unit",
          package_quantity: 0,
          unit_quantity: nextQuantity,
        }
      : undefined

    try {
      await handleUpdateCartQuantity(item.id, nextQuantity, nextMetadata)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se ha podido actualizar la cantidad"
      )
    } finally {
      setUpdating(false)
    }
  }

  const changePackageQuantity = async (newPackageQuantity: number) => {
    if (!packaging) {
      return changeQuantity(newPackageQuantity)
    }

    const packageQuantity = Math.floor(Number(newPackageQuantity))

    if (!Number.isFinite(packageQuantity) || packageQuantity < 1) {
      setUpdating(true)
      try {
        await handleDeleteItem(item.id)
      } finally {
        setUpdating(false)
      }
      return
    }

    const unitQuantity = packageQuantity * packaging.unitsPerBox
    const nextMetadata = {
      ...(item.metadata || {}),
      package_quantity: packageQuantity,
      unit_quantity: unitQuantity,
    }

    setError(null)
    setUpdating(true)

    startTransition(() => {
      setQuantity(packageQuantity.toString())
    })

    try {
      await handleUpdateCartQuantity(item.id, unitQuantity, nextMetadata)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se ha podido actualizar la cantidad"
      )
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    setQuantity(
      currentPackageQuantity
        ? currentPackageQuantity.toString()
        : item.quantity.toString()
    )
  }, [item.quantity, currentPackageQuantity])

  const handleBlur = async (value: number) => {
    const compareValue = isBoxPurchase ? packaging?.packageQuantity : item.quantity

    if (value === compareValue) {
      return
    }

    const maxValue = isBoxPurchase ? maxDisplayQuantity : maxQuantity

    if (value > maxValue) {
      isBoxPurchase
        ? changePackageQuantity(maxDisplayQuantity)
        : changeQuantity(maxQuantity)
      return
    }

    if (value < 1) {
      setUpdating(true)
      try {
        await handleDeleteItem(item.id)
      } finally {
        setUpdating(false)
      }
      return
    }

    isBoxPurchase ? changePackageQuantity(value) : changeQuantity(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return
    }

    if (e.key === "Enter") {
      isBoxPurchase
        ? changePackageQuantity(Number(quantity))
        : changeQuantity(Number(quantity))
    }

    if (e.key === "ArrowUp" && e.shiftKey) {
      e.preventDefault()
      setQuantity(
        (Number(quantity) + (isBoxPurchase ? 1 : quantityIncrement)).toString()
      )
    }

    if (e.key === "ArrowDown" && e.shiftKey) {
      e.preventDefault()
      setQuantity(
        (Number(quantity) - (isBoxPurchase ? 1 : quantityIncrement)).toString()
      )
    }
  }

  return (
    <Container
      className={clx("flex gap-4 w-full h-full items-center justify-between", {
        "shadow-none": !showBorders,
      })}
    >
      <div className="flex gap-x-4 items-start">
        <LocalizedClientLink href={`/products/${item.product_handle}`}>
          <Thumbnail
            thumbnail={item.thumbnail}
            size="square"
            type="full"
            className="bg-neutral-100 rounded-lg w-20 h-20"
          />
        </LocalizedClientLink>
        <div className="flex flex-col gap-y-2 justify-between min-h-full self-stretch">
          <div className="flex flex-col">
            <span className="text-neutral-600 text-[0.6rem]">{brandName}</span>

            <span className="txt-medium-plus text-neutral-950">
              {item.product?.title}
            </span>
            <span className="text-neutral-600 text-xs">
              {item.variant?.title}
            </span>
            {packaging && (
              <div className="mt-2 grid gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-700">
                <span className="font-medium text-neutral-950">
                  {formatPackagingLine(packaging)}
                </span>
                {packagingDetails && <span>{packagingDetails}</span>}
              </div>
            )}
          </div>
          <div className="flex small:flex-row flex-col gap-2">
            {showPrices && (
              <LineItemPrice
                className="flex small:hidden self-start"
                item={item}
                currencyCode={currencyCode}
              />
            )}
            <div className="flex gap-x-2">
              <div className="flex gap-x-3 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] rounded-md w-fit p-px items-center">
                <button
                  type="button"
                  className={clx(
                    "w-4 h-4 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-md text-md",
                    disabled ? "opacity-50 pointer-events-none" : "opacity-100"
                  )}
                  onClick={() =>
                    isBoxPurchase
                      ? changePackageQuantity((packaging?.packageQuantity ?? 1) - 1)
                      : changeQuantity(item.quantity - quantityIncrement)
                  }
                  disabled={
                    (isBoxPurchase
                      ? (packaging?.packageQuantity ?? 1) <= 1
                      : item.quantity <= minimumOrderQuantity) ||
                    disabled
                  }
                >
                  -
                </button>
                <span className="w-4 h-4 flex items-center justify-center text-neutral-950 text-xs">
                  {updating ? (
                    <Spinner size="12" />
                  ) : (
                    <Input
                      className={clx(
                        "w-10 h-4 flex items-center justify-center text-center text-neutral-950 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent shadow-none",
                        disabled
                          ? "opacity-50 pointer-events-none"
                          : "opacity-100"
                      )}
                      type="number"
                      value={displayedQuantity}
                      onChange={(e) => {
                        setQuantity(e.target.value)
                      }}
                      onBlur={(e) => {
                        handleBlur(Number(e.target.value))
                      }}
                      onKeyDown={(e) => handleKeyDown(e)}
                      disabled={disabled}
                    />
                  )}
                </span>
                <button
                  type="button"
                  className={clx(
                    "w-4 h-4 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-md text-md",
                    disabled ? "opacity-50 pointer-events-none" : "opacity-100"
                  )}
                  onClick={() =>
                    isBoxPurchase
                      ? changePackageQuantity((packaging?.packageQuantity ?? 0) + 1)
                      : changeQuantity(item.quantity + quantityIncrement)
                  }
                  disabled={
                    (isBoxPurchase
                      ? (packaging?.packageQuantity ?? 0) >= maxDisplayQuantity
                      : item.quantity >= maxQuantity) || disabled
                  }
                >
                  +
                </button>
              </div>

              <DeleteButton id={item.id} disabled={disabled} />
            </div>
            <span className="text-[11px] text-neutral-500">{quantityLabel}</span>
            <AddNoteButton
              item={item as HttpTypes.StoreCartLineItem}
              disabled={disabled}
            />
          </div>
          {error && (
            <p className="max-w-sm text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-start justify-between min-h-full self-stretch">
        {showPrices ? (
          <LineItemPrice
            className="hidden small:flex"
            item={item}
            currencyCode={currencyCode}
            style="default"
          />
        ) : (
          <span className="hidden rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 small:flex">
            Precio privado
          </span>
        )}
      </div>
    </Container>
  )
}

export default ItemFull

const toPositiveInteger = (value: unknown) => {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.floor(numericValue)
    : undefined
}

const normalizeUnitQuantity = (
  quantity: number,
  minimumOrderQuantity: number,
  quantityIncrement: number,
  maxQuantity: number
) => {
  const nextQuantity = Math.floor(Number(quantity))

  if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
    return 0
  }

  const minimum = Math.max(minimumOrderQuantity, 1)
  const increment = Math.max(quantityIncrement, 1)
  const clampedQuantity = Math.min(Math.max(nextQuantity, minimum), maxQuantity)
  const remainder = (clampedQuantity - minimum) % increment

  return remainder === 0
    ? clampedQuantity
    : Math.min(clampedQuantity + increment - remainder, maxQuantity)
}
