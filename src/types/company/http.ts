import {
  ModuleCompanyOnboardingStatus,
  ModuleCompanyPaymentTerms,
  ModuleCompanySpendingLimitResetFrequency,
  ModuleEmployeeRole,
  ModuleEmployeeStatus,
} from "./module"
import { QueryCompany, QueryEmployee } from "./query"

export type StoreCompanyResponse = {
  company: QueryCompany
}

export type StoreCompaniesResponse = {
  companies: QueryCompany[]
}

export type StoreEmployeeResponse = {
  employee: QueryEmployee
}

export type StoreCreateCompany = {
  name: string
  email: string
  currency_code: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  logo_url?: string | null
  tax_id?: string | null
  sector?: string | null
  onboarding_status?: ModuleCompanyOnboardingStatus | null
  payment_terms?: ModuleCompanyPaymentTerms | null
  default_payment_method?: string | null
  saved_payment_methods?: Record<string, unknown>[] | null
  role_spending_limits?: Record<string, number> | null
  spending_limit_reset_frequency?: ModuleCompanySpendingLimitResetFrequency | null
}

export type StoreUpdateCompany = Partial<StoreCreateCompany> & {
  id: string
}

export type StoreCreateEmployee = {
  company_id: string
  customer_id: string
  spending_limit?: number | null
  is_admin?: boolean | null
  role?: ModuleEmployeeRole
  status?: ModuleEmployeeStatus
  invitation_email?: string | null
}

export type StoreUpdateEmployee = {
  id: string
  company_id: string
  spending_limit?: number
  is_admin?: boolean
  role?: ModuleEmployeeRole
  status?: ModuleEmployeeStatus
  invitation_email?: string | null
}

export type StoreInviteEmployee = {
  company_id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  role?: ModuleEmployeeRole
  spending_limit?: number
}
