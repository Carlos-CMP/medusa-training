import {
  formatPackagingDetails,
  formatPackagingLine,
  getCartLinePackaging,
} from "@/lib/util/b2b-packaging"
import { AmountCell } from "@/modules/common/components/amount-cell"
import Thumbnail from "@/modules/products/components/thumbnail"
import { AdminOrderLineItem, AdminOrderPreview } from "@medusajs/types"
import { Badge, Text } from "@medusajs/ui"
import { useMemo } from "react"

export const QuoteTableItem = ({
  item,
  originalItem,
  currencyCode,
}: {
  item: AdminOrderPreview["items"][0]
  originalItem?: AdminOrderLineItem
  currencyCode: string
}) => {
  const isAddedItem = useMemo(
    () => !!item.actions?.find((action) => action.action === "ITEM_ADD"),
    [item]
  )

  const isItemUpdated = useMemo(
    () => !!item.actions?.find((action) => action.action === "ITEM_UPDATE"),
    [item]
  )

  const isItemRemoved = useMemo(() => {
    const updateAction = item.actions?.find(
      (action) => action.action === "ITEM_UPDATE"
    )

    return !!updateAction && item.quantity === item.detail.fulfilled_quantity
  }, [item])

  const metadata = (item as { metadata?: Record<string, unknown> | null })
    .metadata
  const originalMetadata = (
    originalItem as { metadata?: Record<string, unknown> | null } | undefined
  )?.metadata
  const packaging = getCartLinePackaging(
    metadata ?? originalMetadata,
    item.quantity
  )
  const packagingDetails = packaging ? formatPackagingDetails(packaging) : ""

  return (
    <div className="flex gap-x-4">
      <Thumbnail thumbnail={item.thumbnail} size="square" className="w-16" />

      <div className="flex flex-col w-full">
        <div>
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-base"
          >
            {item.product_title}
          </Text>

          {item.variant_sku && (
            <div className="flex items-center gap-x-1">
              <Text size="small">{item.variant_sku}</Text>
            </div>
          )}
          <Text size="small">
            {item.variant?.options?.map((option) => option.value).join(" - ")}
          </Text>
          {packaging && (
            <div className="mt-1 grid gap-0.5 text-xs text-ui-fg-subtle">
              <span>{formatPackagingLine(packaging)}</span>
              {packagingDetails && <span>{packagingDetails}</span>}
            </div>
          )}
        </div>

        <div className="flex justify-between w-full items-center">
          <div>
            <Text>
              <span>{item.quantity}</span>x{" "}
            </Text>
          </div>

          <div className="flex gap-x-2">
            <AmountCell
              className="text-sm text-right justify-end items-end"
              currencyCode={currencyCode}
              amount={item.unit_price}
              originalAmount={originalItem?.unit_price}
            />

            {isAddedItem && (
              <Badge size="2xsmall" rounded="base" color="blue" className="mr-1">
                Nuevo
              </Badge>
            )}

            {isItemRemoved ? (
              <Badge size="2xsmall" rounded="base" color="red" className="mr-1">
                Eliminado
              </Badge>
            ) : (
              isItemUpdated && (
                <Badge
                  size="2xsmall"
                  rounded="base"
                  color="orange"
                  className="mr-1"
                >
                  Modified
                </Badge>
              )
            )}
          </div>

          <div>
            <AmountCell
              className="text-sm text-right justify-end items-end"
              currencyCode={currencyCode}
              amount={item.total}
              originalAmount={originalItem?.total}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
