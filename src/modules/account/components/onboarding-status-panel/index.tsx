import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { B2BCustomer } from "@/types"
import { ModuleCompanyOnboardingStatus } from "@/types/company/module"

type OnboardingStatusPanelProps = {
  customer: B2BCustomer
}

const OnboardingStatusPanel = ({ customer }: OnboardingStatusPanelProps) => {
  const status = customer.employee?.company?.onboarding_status
  const companyName = customer.employee?.company?.name || "tu empresa"
  const isRejected = status === ModuleCompanyOnboardingStatus.REJECTED

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-borders-base">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d71920]">
        Acceso B2B {isRejected ? "no aprobado" : "pendiente de revisión"}
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-neutral-950">
        {isRejected
          ? "No podemos activar esta cuenta automáticamente"
          : "Estamos revisando tu alta profesional"}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
        {isRejected
          ? `La solicitud de ${companyName} ha sido rechazada o necesita revisión manual. Contacta con el equipo comercial para revisar los datos fiscales y condiciones de acceso.`
          : `La solicitud de ${companyName} ya está registrada. Un administrador revisará los datos de empresa y activará tus tarifas, descuentos y compra online cuando sea aprobada.`}
      </p>
      <div className="mt-5 grid gap-3 text-sm text-neutral-700 small:grid-cols-3">
        <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
          <p className="font-semibold text-neutral-950">1. Solicitud recibida</p>
          <p className="mt-1 text-xs leading-5">Datos de empresa y usuario creados.</p>
        </div>
        <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
          <p className="font-semibold text-neutral-950">2. Revisión comercial</p>
          <p className="mt-1 text-xs leading-5">Validación fiscal, sector y condiciones B2B.</p>
        </div>
        <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
          <p className="font-semibold text-neutral-950">3. Activación</p>
          <p className="mt-1 text-xs leading-5">Acceso a precios privados, pedidos y presupuestos.</p>
        </div>
      </div>
      <LocalizedClientLink
        href="/account/profile"
        className="mt-5 inline-flex text-sm font-semibold text-neutral-950 underline"
      >
        Revisar mis datos de usuario
      </LocalizedClientLink>
    </section>
  )
}

export default OnboardingStatusPanel
