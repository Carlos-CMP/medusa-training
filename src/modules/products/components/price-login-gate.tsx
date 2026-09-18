import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export function PriceLoginGate({
  compact = false,
  showLink = true,
}: {
  compact?: boolean
  showLink?: boolean
}) {
  if (compact) {
    return (
      <div
        className="max-w-full rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs leading-4 text-red-800"
        data-testid="price-login-gate"
      >
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="font-semibold text-red-950">Precio privado</span>
          {showLink ? (
            <LocalizedClientLink
              href="/account"
              className="shrink-0 font-semibold text-red-900 underline underline-offset-4"
            >
              Iniciar sesión
            </LocalizedClientLink>
          ) : (
            <span className="shrink-0 font-semibold text-red-900 underline underline-offset-4">
              Iniciar sesión
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800"
      data-testid="price-login-gate"
    >
      <p className="font-semibold text-red-950">
        Precio disponible para clientes registrados
      </p>
      <p className="mt-1">
        Inicia sesión para ver tus tarifas B2B, descuentos y condiciones
        comerciales.
      </p>
      <LocalizedClientLink
        href="/account"
        className="mt-2 inline-flex text-xs font-semibold text-red-900 underline underline-offset-4"
      >
        Acceder al portal
      </LocalizedClientLink>
    </div>
  )
}
