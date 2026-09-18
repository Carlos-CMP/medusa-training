"use client"

import { updateCompany } from "@/lib/data/companies"
import {
  B2B_ROLE_DEFINITIONS,
  getRoleLimit,
} from "@/lib/util/b2b-roles"
import { formatAmount } from "@/modules/common/components/amount-cell"
import Button from "@/modules/common/components/button"
import Input from "@/modules/common/components/input"
import { ModuleEmployeeRole, QueryCompany } from "@/types"
import { Container, Text, toast } from "@medusajs/ui"
import { useMemo, useState } from "react"

const RoleManagementCard = ({ company }: { company: QueryCompany }) => {
  const configuredLimits = useMemo(
    () => (company.role_spending_limits || {}) as Record<string, number>,
    [company.role_spending_limits]
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [limits, setLimits] = useState<Record<string, number>>(() => {
    return B2B_ROLE_DEFINITIONS.reduce<Record<string, number>>(
      (acc, role) => ({
        ...acc,
        [role.key]: getRoleLimit(configuredLimits, role.key),
      }),
      {}
    )
  })

  const employeeCounts = (company.employees || []).reduce<
    Record<string, number>
  >((acc, employee) => {
    const role = employee.role || ModuleEmployeeRole.BUYER
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  const hasWarehouseRole = Object.prototype.hasOwnProperty.call(
    configuredLimits,
    ModuleEmployeeRole.WAREHOUSE_MANAGER
  )

  const handleLimitChange = (role: ModuleEmployeeRole, value: string) => {
    const nextValue = Number(value || 0)
    setLimits((prev) => ({
      ...prev,
      [role]: Number.isFinite(nextValue) ? nextValue : 0,
    }))
  }

  const saveLimits = async (nextLimits = limits) => {
    setIsSaving(true)
    try {
      await updateCompany({
        id: company.id,
        role_spending_limits: nextLimits,
      })
      toast.success("Roles B2B actualizados")
      setIsEditing(false)
    } catch {
      toast.error("No se pudieron guardar los roles")
    } finally {
      setIsSaving(false)
    }
  }

  const createWarehouseRole = () => {
    const nextLimits = {
      ...limits,
      [ModuleEmployeeRole.WAREHOUSE_MANAGER]:
        limits[ModuleEmployeeRole.WAREHOUSE_MANAGER] || 2000,
    }

    setLimits(nextLimits)
    saveLimits(nextLimits)
  }

  return (
    <Container className="overflow-hidden p-0">
      <div className="border-b border-neutral-200 p-4">
        <Text className="font-medium text-neutral-950">Roles B2B</Text>
        <Text className="mt-1 text-neutral-600">
          Define qué puede hacer cada persona de la empresa y cuándo necesita
          aprobación interna.
        </Text>
      </div>
      <div className="divide-y divide-neutral-200">
        {B2B_ROLE_DEFINITIONS.map((role) => {
          const limit = limits[role.key] || 0

          return (
            <div
              key={role.key}
              className="grid gap-4 p-4 small:grid-cols-[1.2fr_1.4fr_180px_120px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Text className="font-medium text-neutral-950">
                    {role.label}
                  </Text>
                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600">
                    {employeeCounts[role.key] || 0} usuarios
                  </span>
                </div>
                <Text className="mt-1 text-neutral-600">
                  {role.description}
                </Text>
              </div>
              <ul className="flex flex-col gap-1 text-sm text-neutral-600">
                {role.permissions.map((permission) => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
              <div>
                <Text className="mb-2 text-xs font-semibold uppercase text-neutral-500">
                  Límite de gasto
                </Text>
                {isEditing ? (
                  <Input
                    label={`Límite ${role.label}`}
                    type="number"
                    min="0"
                    value={String(limit)}
                    onChange={(event) =>
                      handleLimitChange(role.key, event.target.value)
                    }
                  />
                ) : (
                  <Text className="font-medium text-neutral-950">
                    {limit > 0
                      ? formatAmount(limit, company.currency_code || "eur")
                      : "Sin límite"}
                  </Text>
                )}
              </div>
              <div>
                <Text className="mb-2 text-xs font-semibold uppercase text-neutral-500">
                  Estado
                </Text>
                <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
                  {hasWarehouseRole ||
                  role.key !== ModuleEmployeeRole.WAREHOUSE_MANAGER
                    ? "Activo"
                    : "Plantilla"}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 bg-neutral-50 p-4">
        {!hasWarehouseRole && (
          <Button
            variant="secondary"
            onClick={createWarehouseRole}
            isLoading={isSaving}
          >
            Crear rol almacén
          </Button>
        )}
        {isEditing ? (
          <>
            <Button
              variant="secondary"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => saveLimits()} isLoading={isSaving}>
              Guardar roles
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Editar límites
          </Button>
        )}
      </div>
    </Container>
  )
}

export default RoleManagementCard
