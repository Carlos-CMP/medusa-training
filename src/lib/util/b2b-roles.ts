import { ModuleEmployeeRole } from "@/types"

export type B2BRoleDefinition = {
  key: ModuleEmployeeRole
  label: string
  shortLabel: string
  description: string
  permissions: string[]
  defaultLimit: number
}

export const B2B_ROLE_DEFINITIONS: B2BRoleDefinition[] = [
  {
    key: ModuleEmployeeRole.BUYER,
    label: "Comprador",
    shortLabel: "Comprador",
    description: "Prepara pedidos y presupuestos dentro del límite asignado.",
    permissions: [
      "Puede añadir productos al carrito",
      "Puede solicitar presupuesto",
      "Necesita aprobación si supera su límite",
    ],
    defaultLimit: 2000,
  },
  {
    key: ModuleEmployeeRole.WAREHOUSE_MANAGER,
    label: "Responsable de almacén",
    shortLabel: "Almacén",
    description: "Gestiona reposiciones recurrentes con un límite controlado.",
    permissions: [
      "Puede preparar pedidos de reposición",
      "Puede consultar histórico y logística",
      "Necesita aprobación para compras grandes",
    ],
    defaultLimit: 2000,
  },
  {
    key: ModuleEmployeeRole.APPROVER,
    label: "Aprobador",
    shortLabel: "Aprobador",
    description: "Revisa y aprueba solicitudes internas antes de comprar.",
    permissions: [
      "Puede ver solicitudes pendientes",
      "Puede aprobar o denegar pedidos",
      "Puede revisar el detalle de líneas",
    ],
    defaultLimit: 15000,
  },
  {
    key: ModuleEmployeeRole.COMPANY_ADMIN,
    label: "Administrador de cuenta",
    shortLabel: "Admin",
    description: "Administra usuarios, roles, límites y datos de empresa.",
    permissions: [
      "Puede invitar y editar usuarios",
      "Puede configurar roles y límites",
      "Puede modificar datos de empresa",
    ],
    defaultLimit: 0,
  },
  {
    key: ModuleEmployeeRole.READONLY,
    label: "Solo lectura",
    shortLabel: "Lectura",
    description: "Consulta información sin capacidad de compra.",
    permissions: [
      "Puede consultar catálogo",
      "Puede revisar información de cuenta",
      "No puede confirmar compras",
    ],
    defaultLimit: 0,
  },
]

export const getB2BRoleDefinition = (role?: string | null) =>
  B2B_ROLE_DEFINITIONS.find((definition) => definition.key === role) ||
  B2B_ROLE_DEFINITIONS[0]

export const getRoleLimit = (
  limits: Record<string, number> | null | undefined,
  role: ModuleEmployeeRole | string
) => {
  const configuredLimit = Number(limits?.[role] || 0)

  if (Number.isFinite(configuredLimit) && configuredLimit > 0) {
    return configuredLimit
  }

  return getB2BRoleDefinition(role).defaultLimit
}
