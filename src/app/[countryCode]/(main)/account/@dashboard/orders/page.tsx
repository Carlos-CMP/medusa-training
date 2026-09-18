import { listApprovals } from "@/lib/data/approvals"
import { retrieveCompany } from "@/lib/data/companies"
import { retrieveCustomer } from "@/lib/data/customer"
import { listOrders } from "@/lib/data/orders"
import OrderOverview from "@/modules/account/components/order-overview"
import PendingCustomerApprovals from "@/modules/account/components/pending-customer-approvals"
import { ApprovalStatusType } from "@/types/approval"
import { Heading } from "@medusajs/ui"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pedidos",
  description: "Resumen de tus pedidos anteriores.",
}

export default async function Orders() {
  const customer = await retrieveCustomer().catch(() => null)
  const orders = await listOrders().catch(() => [])

  const { approval_settings } =
    (customer?.employee?.company_id
      ? await retrieveCompany(customer.employee.company_id).catch(() => ({}))
      : {}) || {}

  const approval_required =
    approval_settings?.requires_admin_approval ||
    approval_settings?.requires_sales_manager_approval

  const { carts_with_approvals } = await listApprovals({
    status: ApprovalStatusType.PENDING,
  }).catch(() => ({ carts_with_approvals: [] }))

  return (
    <div
      className="w-full flex flex-col gap-y-4"
      data-testid="orders-page-wrapper"
    >
      <div className="mb-4">
        <Heading>Pedidos</Heading>
      </div>
      {approval_required && (
        <div>
          <Heading level="h2" className="text-neutral-700 mb-4">
            Aprobaciones pendientes
          </Heading>

          <PendingCustomerApprovals cartsWithApprovals={carts_with_approvals} />
        </div>
      )}
      <div>
        <Heading level="h2" className="text-neutral-700 mb-4">
          Pedidos completados
        </Heading>

        <OrderOverview orders={orders} />
      </div>
    </div>
  )
}
