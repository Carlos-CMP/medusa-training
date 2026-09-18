import { retrieveCompany } from "@/lib/data/companies"
import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import ApprovalSettingsCard from "@/modules/account/components/approval-settings-card"
import CompanyCard from "@/modules/account/components/company-card"
import EmployeesCard from "@/modules/account/components/employees-card"
import InviteEmployeeCard from "@/modules/account/components/invite-employee-card"
import RoleManagementCard from "@/modules/account/components/role-management-card"
import { Heading, Text } from "@medusajs/ui"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Empresa",
  description: "Datos, usuarios y reglas de aprobación de la empresa.",
}

export default async function Company() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !customer?.employee?.company) return notFound()

  const company = await retrieveCompany(customer.employee.company.id).catch(
    () => null
  )

  if (!company) {
    return (
      <div className="w-full rounded border border-neutral-200 bg-white p-6">
        <Heading level="h2" className="text-lg text-neutral-950">
          Datos de empresa
        </Heading>
        <Text className="mt-2 text-neutral-600">
          Tu usuario no tiene permisos para administrar la empresa. Puedes seguir
          comprando, solicitando presupuestos y revisando pedidos.
        </Text>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h2" className="text-lg text-neutral-950">
          Datos de empresa
        </Heading>
        <CompanyCard company={company} regions={regions} />
      </div>
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h2" className="text-lg text-neutral-950">
          Reglas de aprobación
        </Heading>
        <ApprovalSettingsCard company={company} customer={customer} />
      </div>
      {customer.employee?.is_admin && (
        <div className="mb-8 flex flex-col gap-y-4">
          <Heading level="h2" className="text-lg text-neutral-950">
            Roles y permisos
          </Heading>
          <RoleManagementCard company={company} />
        </div>
      )}
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h2" className="text-lg text-neutral-950">
          Usuarios
        </Heading>
        <EmployeesCard company={company} />
      </div>
      {customer.employee?.is_admin && (
        <div className="mb-8 flex flex-col gap-y-4">
          <Heading level="h2" className="text-lg text-neutral-950">
            Invitar usuarios
          </Heading>
          <InviteEmployeeCard company={company} />
        </div>
      )}
    </div>
  )
}
