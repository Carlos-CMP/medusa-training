import { retrieveCart } from "@/lib/data/cart"
import {
  formatPackagingDetails,
  formatPackagingLine,
  getCartLinePackaging,
} from "@/lib/util/b2b-packaging"
import { convertToLocale } from "@/lib/util/money"
import ApprovalCardActions from "@/modules/account/components/approval-card-actions"
import CalendarIcon from "@/modules/common/icons/calendar"
import DocumentIcon from "@/modules/common/icons/document"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Thumbnail from "@/modules/products/components/thumbnail"
import { ApprovalStatusType } from "@/types/approval"
import { B2BCart } from "@/types/global"
import { CheckMini, XMarkMini } from "@medusajs/icons"
import { Container, Text } from "@medusajs/ui"

type ApprovalCardProps = {
  cartWithApprovals: B2BCart
  type?: "admin" | "customer"
}

export default async function ApprovalCard({
  cartWithApprovals,
  type = "customer",
}: ApprovalCardProps) {
  const cart = await retrieveCart(cartWithApprovals.id)

  if (!cart) {
    return null
  }

  const createdAt = new Date(cart.created_at!)
  const updatedAt = new Date(cart.updated_at!)

  const numberOfLines = cart.items?.length ?? 0
  const totalUnits =
    cart.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0
  const requester = cart.customer?.email || "Comprador B2B"
  const companyName = cart.company?.name || "Empresa"

  return (
    <Container className="flex flex-col gap-4 rounded-md bg-white p-4 shadow-borders-base">
      <div className="flex flex-col gap-4 small:flex-row small:items-start small:justify-between">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3 text-small-regular text-neutral-600">
            <span className="flex items-center gap-1" data-testid="order-created-at">
              <CalendarIcon className="inline-block" />
              {createdAt.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-1">
              <DocumentIcon className="inline-block" />
              <span data-testid="order-display-id">Solicitud #{cart.id.slice(-4)}</span>
            </span>
            <ApprovalStatusLabel
              status={cartWithApprovals.approval_status?.status}
              completedAt={cartWithApprovals.completed_at}
              updatedAt={updatedAt}
            />
          </div>

          <div>
            <Text className="text-base font-semibold text-neutral-950">
              {companyName}
            </Text>
            <Text className="text-small-regular text-neutral-600">
              Solicitado por {requester}
            </Text>
          </div>
        </div>

        <div className="grid gap-2 text-left small:text-right">
          <Text className="text-xl font-semibold text-neutral-950" data-testid="order-amount">
            {convertToLocale({
              amount: cart.total,
              currency_code: cart.currency_code,
            })}
          </Text>
          <Text className="text-small-regular text-neutral-600">
            {numberOfLines} {numberOfLines === 1 ? "línea" : "líneas"} ·{" "}
            {totalUnits} uds
          </Text>
          {type === "admin" && (
            <ApprovalCardActions cartWithApprovals={cartWithApprovals} />
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-200">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-normal text-neutral-600 small:grid-cols-[minmax(0,1fr)_120px_120px_120px]">
          <span>Producto</span>
          <span className="hidden text-right small:block">Precio ud.</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Subtotal</span>
        </div>

        <div className="divide-y divide-neutral-200">
          {cart.items?.map((item) => (
            <ApprovalLineItem
              key={item.id}
              item={item}
              currencyCode={cart.currency_code}
            />
          ))}
        </div>
      </div>
    </Container>
  )
}

function ApprovalStatusLabel({
  status,
  completedAt,
  updatedAt,
}: {
  status?: ApprovalStatusType
  completedAt?: string
  updatedAt: Date
}) {
  if (status === ApprovalStatusType.APPROVED) {
    return (
      <Text className="flex items-center gap-1 text-xs text-green-700">
        <CheckMini className="inline-block" />
        {completedAt ? "Pedido completado" : "Aprobado"} el{" "}
        {updatedAt.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}
      </Text>
    )
  }

  if (status === ApprovalStatusType.REJECTED) {
    return (
      <Text className="flex items-center gap-1 text-xs text-red-700">
        <XMarkMini className="inline-block" />
        Rechazado el{" "}
        {updatedAt.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}
      </Text>
    )
  }

  return (
    <Text className="text-xs font-medium text-orange-700">
      Pendiente de aprobación
    </Text>
  )
}

function ApprovalLineItem({
  item,
  currencyCode,
}: {
  item: NonNullable<B2BCart["items"]>[number]
  currencyCode: string
}) {
  const packaging = getCartLinePackaging(item.metadata, item.quantity)
  const packagingDetails = packaging ? formatPackagingDetails(packaging) : ""
  const handle = item.product?.handle
  const unitPrice = Number((item as any).unit_price ?? 0)
  const subtotal = Number((item as any).subtotal ?? unitPrice * item.quantity)

  const content = (
    <div className="flex min-w-0 items-center gap-3">
      <Thumbnail
        thumbnail={item.thumbnail}
        images={item.product?.images}
        size="square"
        className="h-12 w-12 shrink-0 rounded-md bg-neutral-100"
      />
      <div className="min-w-0">
        <Text className="truncate text-small-semi text-neutral-950">
          {item.product?.title || item.title}
        </Text>
        <Text className="truncate text-xs text-neutral-600">
          {[item.variant?.title, item.variant?.sku].filter(Boolean).join(" · ")}
        </Text>
        {packaging && (
          <Text className="mt-1 line-clamp-2 text-[11px] text-neutral-500">
            {formatPackagingLine(packaging)}
            {packagingDetails ? ` · ${packagingDetails}` : ""}
          </Text>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 small:grid-cols-[minmax(0,1fr)_120px_120px_120px]">
      {handle ? (
        <LocalizedClientLink href={`/products/${handle}`} className="min-w-0">
          {content}
        </LocalizedClientLink>
      ) : (
        content
      )}
      <Text className="hidden text-right text-small-regular text-neutral-600 small:block">
        {convertToLocale({ amount: unitPrice, currency_code: currencyCode })}
      </Text>
      <Text className="text-right text-small-regular text-neutral-700">
        {packaging ? `${packaging.unitQuantity} uds` : `${item.quantity} uds`}
      </Text>
      <Text className="text-right text-small-semi text-neutral-950">
        {convertToLocale({ amount: subtotal, currency_code: currencyCode })}
      </Text>
    </div>
  )
}
