"use server"

import { sdk } from "@/lib/config"
import handleMedusaError from "@/lib/util/handle-medusa-error"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
} from "@/lib/data/cookies"
import {
  StoreCompaniesResponse,
  StoreCompanyResponse,
  StoreCreateCompany,
  StoreCreateEmployee,
  StoreEmployeeResponse,
  StoreInviteEmployee,
  StoreUpdateCompany,
  StoreUpdateEmployee,
} from "@/types"
import { track } from "@vercel/analytics/server"
import { revalidateTag } from "next/cache"

const trackSafely = (event: string, properties?: Record<string, unknown>) => {
  try {
    track(event, properties)
  } catch (error) {
    console.warn(`Analytics event "${event}" failed`, error)
  }
}

const revalidateCompaniesSafely = async () => {
  try {
    const cacheTag = await getCacheTag("companies")
    revalidateTag(cacheTag)
  } catch (error) {
    console.warn("Could not revalidate companies cache", error)
  }
}

export const retrieveCompany = async (companyId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("companies")),
  }

  const { company } = await sdk.client.fetch<StoreCompanyResponse>(
    `/store/companies/${companyId}`,
    {
      query: {
        fields:
          "+spending_limit_reset_frequency,+role_spending_limits,*employees.customer,*approval_settings",
      },
      method: "GET",
      headers,
      next,
    }
  )

  return company
}

export const createCompany = async (data: StoreCreateCompany) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const {
    companies: [company],
  } = await sdk.client.fetch<StoreCompaniesResponse>(`/store/companies`, {
    method: "POST",
    body: data,
    headers,
  })

  track("company_created", {
    company_id: company.id,
    company_name: company.name,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return company
}

export const updateCompany = async (data: StoreUpdateCompany) => {
  const { id, ...companyData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const company = await sdk.client.fetch<StoreCompanyResponse>(
    `/store/companies/${id}`,
    {
      method: "POST",
      body: companyData,
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return company
}

export const createEmployee = async (data: StoreCreateEmployee) => {
  const { company_id, ...employeeData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const employee = await sdk.client.fetch<StoreEmployeeResponse>(
    `/store/companies/${company_id}/employees`,
    {
      method: "POST",
      body: employeeData,
      headers,
    }
  )

  track("employee_created", {
    employee_id: employee.employee.id,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return employee
}

export const inviteEmployee = async (data: StoreInviteEmployee) => {
  const { company_id, ...inviteData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const employee = await sdk.client.fetch<StoreEmployeeResponse>(
    `/store/companies/${company_id}/invitations`,
    {
      method: "POST",
      body: inviteData,
      headers,
    }
  ).catch(handleMedusaError)

  trackSafely("employee_invited", {
    employee_id: employee.employee.id,
    role: inviteData.role || "buyer",
  })

  await revalidateCompaniesSafely()

  return employee
}

export const updateEmployee = async (data: StoreUpdateEmployee) => {
  const { id, company_id, ...employeeData } = data

  const headers = {
    ...(await getAuthHeaders()),
  }

  const employee = await sdk.client.fetch<StoreEmployeeResponse>(
    `/store/companies/${company_id}/employees/${id}`,
    {
      method: "POST",
      body: employeeData,
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)

  return employee
}

export const deleteEmployee = async (companyId: string, employeeId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.client.fetch(
    `/store/companies/${companyId}/employees/${employeeId}`,
    {
      method: "DELETE",
      headers,
    }
  )

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)
}

export const updateApprovalSettings = async (
  companyId: string,
  requiresAdminApproval: boolean
) => {
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    Accept: "plain/text",
  }

  await sdk.client.fetch(`/store/companies/${companyId}/approval-settings`, {
    method: "POST",
    body: {
      requires_admin_approval: requiresAdminApproval,
    },
    headers,
  })

  const cacheTag = await getCacheTag("companies")
  revalidateTag(cacheTag)
}
