import { retrieveCustomer } from "@/lib/data/customer"
import ApprovedApprovalRequestsAdminList from "@/modules/account/components/approval-requests-admin-list/approved-list"
import PendingApprovalRequestsAdminList from "@/modules/account/components/approval-requests-admin-list/pending-list"
import RejectedApprovalRequestsAdminList from "@/modules/account/components/approval-requests-admin-list/rejected-list"
import { Heading, Text } from "@medusajs/ui"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Aprobaciones",
  description: "Resumen de aprobaciones pendientes.",
}

export default async function Approvals({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const urlSearchParams = await searchParams
  const customer = await retrieveCustomer().catch(() => null)

  const canManageApprovals =
    customer?.employee?.is_admin || customer?.employee?.role === "approver"

  if (!canManageApprovals) {
    return (
      <div className="grid w-full gap-4">
        <ApprovalDemoIntro />
        <div className="rounded border border-neutral-200 bg-white p-6">
          <Heading>Aprobaciones</Heading>
          <Text className="mt-2 text-neutral-600">
            Esta sección está disponible para aprobadores y administradores de empresa. Para
            enseñar el flujo completo, inicia sesión con el usuario aprobador
            de la empresa demo.
          </Text>
          <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 p-4 text-small-regular text-neutral-700">
            Usa una cuenta con rol aprobador o administrador de empresa para
            revisar, aprobar o rechazar solicitudes pendientes.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-y-4">
      <ApprovalDemoIntro />
      <Heading>Aprobaciones</Heading>

      <Heading level="h2" className="text-neutral-700">
        Pendientes
      </Heading>
      <Suspense fallback={<div>Cargando...</div>}>
        <PendingApprovalRequestsAdminList searchParams={urlSearchParams} />
      </Suspense>

      <Heading level="h2" className="text-neutral-700">
        Aprobadas
      </Heading>
      <Suspense fallback={<div>Cargando...</div>}>
        <ApprovedApprovalRequestsAdminList searchParams={urlSearchParams} />
      </Suspense>

      <Heading level="h2" className="text-neutral-700">
        Rechazadas
      </Heading>
      <Suspense fallback={<div>Cargando...</div>}>
        <RejectedApprovalRequestsAdminList searchParams={urlSearchParams} />
      </Suspense>
    </div>
  )
}

function ApprovalDemoIntro() {
  return (
    <section className="rounded border border-neutral-200 bg-white p-6">
      <div className="grid gap-4 small:grid-cols-[1fr_280px] small:items-start">
        <div>
          <p className="text-small-semi uppercase tracking-normal text-red-700">
            Flujo de aprobación B2B
          </p>
          <Heading level="h2" className="mt-2">
            Cuando el comprador supera su límite, el pedido se bloquea hasta
            que aprueba un responsable.
          </Heading>
          <Text className="mt-3 text-neutral-600">
            Este bloque muestra la diferencia clave frente a B2C: el comprador
            puede preparar el pedido, pero la empresa decide quién autoriza el
            gasto.
          </Text>
        </div>
        <div className="grid gap-2 rounded border border-neutral-200 bg-neutral-50 p-3">
          <ApprovalStep label="1. Comprador" value="Crea carrito o quote" />
          <ApprovalStep label="2. Plataforma" value="Detecta límite" />
          <ApprovalStep label="3. Aprobador" value="Aprueba o rechaza" />
          <ApprovalStep label="4. Checkout" value="Pedido desbloqueado" />
        </div>
      </div>
    </section>
  )
}

function ApprovalStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-neutral-200 bg-white p-3">
      <p className="text-small-semi text-neutral-950">{label}</p>
      <p className="mt-1 text-small-regular text-neutral-600">{value}</p>
    </div>
  )
}
