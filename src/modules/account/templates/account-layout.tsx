import { listApprovals } from "@/lib/data/approvals"
import { isCustomerCompanyBlocked } from "@/lib/util/b2b-access"
import AccountNav from "@/modules/account/components/account-nav"
import OnboardingStatusPanel from "@/modules/account/components/onboarding-status-panel"
import { B2BCustomer } from "@/types"
import { ApprovalStatusType, ApprovalType } from "@/types/approval"
import React from "react"

interface AccountLayoutProps {
  customer: B2BCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = async ({
  customer,
  children,
}) => {
  const { carts_with_approvals } = await listApprovals({
    type: ApprovalType.ADMIN,
    status: ApprovalStatusType.PENDING,
  }).catch(() => ({ carts_with_approvals: [] }))

  const numPendingApprovals = carts_with_approvals?.length || 0
  const shouldShowOnboardingGate =
    customer?.employee?.company && isCustomerCompanyBlocked(customer)

  return (
    <div
      className="flex-1 small:py-12 bg-neutral-100"
      data-testid="account-page"
    >
      <div className="flex-1 content-container h-full max-w-7xl mx-auto flex flex-col">
        <div className="grid grid-cols-1  small:grid-cols-[240px_1fr] py-12">
          <div>
            {customer && (
              <AccountNav
                customer={customer}
                numPendingApprovals={numPendingApprovals}
              />
            )}
          </div>
          <div className="flex-1">
            {shouldShowOnboardingGate && customer ? (
              <OnboardingStatusPanel customer={customer} />
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
