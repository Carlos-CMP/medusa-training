"use client"

import { deleteEmployee, updateEmployee } from "@/lib/data/companies"
import { B2B_ROLE_DEFINITIONS, getB2BRoleDefinition } from "@/lib/util/b2b-roles"
import {
  getCustomerRoleSpendingLimit,
  getOrderTotalInSpendWindow,
  getSpendWindow,
} from "@/lib/util/check-spending-limit"
import { formatAmount } from "@/modules/common/components/amount-cell"
import Button from "@/modules/common/components/button"
import NativeSelect from "@/modules/common/components/native-select"
import {
  B2BCustomer,
  ModuleEmployeeRole,
  QueryCompany,
  QueryEmployee,
  StoreUpdateEmployee,
} from "@/types"
import { HttpTypes } from "@medusajs/types"
import { Prompt, Text, clx, toast } from "@medusajs/ui"
import { useState } from "react"

const RemoveEmployeePrompt = ({ employee }: { employee: QueryEmployee }) => {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async () => {
    setIsRemoving(true)
    await deleteEmployee(employee.company_id, employee.id).catch(() => {
      toast.error("No se pudo eliminar el usuario")
    })
    setIsRemoving(false)

    toast.success("Usuario eliminado")
  }

  return (
    <Prompt variant="danger">
      <Prompt.Trigger asChild>
        <Button variant="transparent">Eliminar</Button>
      </Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Eliminar usuario</Prompt.Title>
          <Prompt.Description>
            ¿Seguro que quieres eliminar a{" "}
            <strong>{employee.customer?.email || "este usuario"}</strong> de tu
            equipo? Ya no podrá comprar en nombre de la empresa.
          </Prompt.Description>
        </Prompt.Header>
        <Prompt.Footer>
          <Prompt.Cancel className="h-10 rounded-full shadow-borders-base">
            Cancelar
          </Prompt.Cancel>
          <Prompt.Action
            className="h-10 px-4 rounded-full shadow-none"
            onClick={handleRemove}
          >
            Eliminar
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

const Employee = ({
  employee,
  company,
  orders,
  customer,
}: {
  employee: QueryEmployee
  company: QueryCompany
  orders: HttpTypes.StoreOrder[]
  customer: B2BCustomer | null
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [employeeData, setEmployeeData] = useState({
    id: employee.id,
    company_id: employee.company_id,
    is_admin: employee.is_admin,
    role: employee.role,
  })

  const isCurrentUser = employee.customer?.id === customer?.id

  const handleSubmit = async () => {
    const updateData = { ...employeeData }

    setIsSaving(true)
    await updateEmployee(updateData as StoreUpdateEmployee).catch(() => {
      toast.error("No se pudo actualizar el usuario")
    })

    setIsSaving(false)
    setIsEditing(false)

    toast.success("Usuario actualizado")
  }

  const spent = getOrderTotalInSpendWindow(orders, getSpendWindow(company)) || 0
  const amountSpent = formatAmount(spent, company.currency_code!)
  const selectedRole = employeeData.role || employee.role
  const roleSpendingLimit = getCustomerRoleSpendingLimit({
    employee: { ...employee, role: selectedRole, company },
  } as B2BCustomer)
  const role = getB2BRoleDefinition(selectedRole)

  return (
    <div className="flex flex-col">
      <div className="flex justify-between p-4 border-b border-neutral-200">
        <div className="flex flex-col gap-y-2">
          <Text className=" text-neutral-950 font-medium">
            {employee.customer?.first_name || "Usuario"}{" "}
            {employee.customer?.last_name || ""}{" "}
            {isCurrentUser && "(Tú)"}{" "}
            {employee.is_admin && (
              <>
                {" • "}
                <span className="text-blue-500">Administrador</span>
              </>
            )}
          </Text>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-950">
              {role.label}
            </span>
            <span className="text-xs text-neutral-500">{role.description}</span>
          </div>
          <div className="flex gap-x-2 small:flex-row flex-col">
            <Text className=" text-neutral-500">{employee.customer?.email || "-"}</Text>
            <Text className=" text-neutral-500 hidden small:block">
              {" • "}
            </Text>
            <Text className=" text-neutral-500">{employee.customer?.phone || "-"}</Text>
            <Text className=" text-neutral-500 hidden small:block">
              {" • "}
            </Text>
            <Text className=" text-neutral-500">
              {amountSpent} /{" "}
              {roleSpendingLimit > 0
                ? formatAmount(roleSpendingLimit, company.currency_code!)
                : "Sin límite"}{" "}
              gastado por rol
            </Text>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSaving}
              >
                Guardar
              </Button>
            </>
          ) : (
            <>
              {!isCurrentUser && <RemoveEmployeePrompt employee={employee} />}
              <Button
                variant="secondary"
                onClick={() => setIsEditing((prev) => !prev)}
              >
                Editar
              </Button>
            </>
          )}
        </div>
      </div>
      <form
        className={clx(
          "bg-neutral-50 grid grid-cols-2 gap-4 border-b border-neutral-200 transition-all duration-300 ease-in-out",
          {
            "max-h-[98px] opacity-100 p-4": isEditing,
            "max-h-0 h-0 opacity-0 border-b-0": !isEditing,
          }
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            handleSubmit()
          }
        }}
      >
        <div className="flex flex-col gap-y-2">
          <Text className=" text-neutral-950 font-medium">Rol</Text>
          <NativeSelect
            className="bg-white"
            name="role"
            value={employeeData.role || ModuleEmployeeRole.BUYER}
            disabled={!customer?.employee?.is_admin}
            onChange={(e) => {
              const nextRole = e.target.value as ModuleEmployeeRole
              setEmployeeData({
                ...employeeData,
                role: nextRole,
                is_admin: nextRole === ModuleEmployeeRole.COMPANY_ADMIN,
              })
            }}
          >
            {B2B_ROLE_DEFINITIONS.map((roleOption) => (
              <option key={roleOption.key} value={roleOption.key}>
                {roleOption.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-y-2">
          <Text className=" text-neutral-950 font-medium">Límite por rol</Text>
          <Text className="rounded border border-neutral-200 bg-white px-3 py-2 text-neutral-600">
            {roleSpendingLimit > 0
              ? formatAmount(roleSpendingLimit, company.currency_code!)
              : "Sin límite"}
          </Text>
        </div>
      </form>
    </div>
  )
}

export default Employee
