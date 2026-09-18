"use client"

import { inviteEmployee } from "@/lib/data/companies"
import { B2B_ROLE_DEFINITIONS, getRoleLimit } from "@/lib/util/b2b-roles"
import Button from "@/modules/common/components/button"
import Input from "@/modules/common/components/input"
import { ModuleEmployeeRole } from "@/types/company/module"
import { QueryCompany } from "@/types"
import { Container, Select, Text, toast } from "@medusajs/ui"
import { useState, useTransition } from "react"

const InviteEmployeeCard = ({ company }: { company: QueryCompany }) => {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: ModuleEmployeeRole.BUYER,
  })

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const selectedRoleLimit = getRoleLimit(
    company.role_spending_limits,
    form.role
  )

  const handleInvite = () => {
    if (!form.email) {
      toast.error("Introduce un email")
      return
    }

    startTransition(async () => {
      try {
        await inviteEmployee({
          company_id: company.id,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
        })
        toast.success("Invitación creada")
        setForm({
          first_name: "",
          last_name: "",
          email: "",
          role: ModuleEmployeeRole.BUYER,
        })
      } catch (error: any) {
        toast.error(error?.message || "No se pudo crear la invitación")
      }
    })
  }

  return (
    <Container className="p-0 overflow-hidden">
      <div className="grid small:grid-cols-4 grid-cols-2 gap-4 p-4 border-b border-neutral-200">
        <div className="flex flex-col gap-y-2">
          <Text className="font-medium text-neutral-950">Nombre</Text>
          <Input
            name="first_name"
            label="Nombre"
            value={form.first_name}
            onChange={(event) => setField("first_name", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-2 justify-end">
          <Input
            name="last_name"
            label="Apellidos"
            value={form.last_name}
            onChange={(event) => setField("last_name", event.target.value)}
          />
        </div>
        <div className="flex flex-col col-span-2 gap-y-2">
          <Text className="font-medium text-neutral-950">Email</Text>
          <Input
            name="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Text className="font-medium text-neutral-950">Rol</Text>
          <Select
            value={form.role}
            onValueChange={(value) => setField("role", value)}
          >
            <Select.Trigger className="h-10 rounded-md">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {B2B_ROLE_DEFINITIONS.map((role) => (
                <Select.Item key={role.key} value={role.key}>
                  {role.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-2">
          <Text className="font-medium text-neutral-950">Límite</Text>
          <Text className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600">
            {selectedRoleLimit > 0
              ? `Heredado del rol: ${selectedRoleLimit.toLocaleString(
                  "es-ES"
                )} ${company.currency_code?.toUpperCase() || "EUR"}`
              : "Sin límite para este rol."}
          </Text>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 bg-neutral-50 p-4">
        <Button variant="primary" onClick={handleInvite} isLoading={isPending}>
          Invitar empleado
        </Button>
      </div>
    </Container>
  )
}

export default InviteEmployeeCard
