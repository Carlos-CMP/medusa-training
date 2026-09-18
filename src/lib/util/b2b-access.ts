import { B2BCustomer } from "@/types"
import { ModuleCompanyOnboardingStatus } from "@/types/company/module"

export const getCustomerCompanyStatus = (customer?: B2BCustomer | null) =>
  customer?.employee?.company?.onboarding_status || null

export const isCustomerCompanyApproved = (customer?: B2BCustomer | null) =>
  getCustomerCompanyStatus(customer) === ModuleCompanyOnboardingStatus.APPROVED

export const isCustomerCompanyBlocked = (customer?: B2BCustomer | null) => {
  const status = getCustomerCompanyStatus(customer)

  return (
    status === ModuleCompanyOnboardingStatus.PENDING ||
    status === ModuleCompanyOnboardingStatus.REJECTED
  )
}

export const canCustomerViewB2BPrices = (customer?: B2BCustomer | null) =>
  Boolean(customer && isCustomerCompanyApproved(customer))
