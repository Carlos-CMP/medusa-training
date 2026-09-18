import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { User } from "@medusajs/icons"
import { B2BCustomer } from "@/types/global"

export default async function AccountButton({
  customer,
}: {
  customer: B2BCustomer | null
}) {
  return (
    <LocalizedClientLink className="text-neutral-950" href="/account">
      <button
        aria-label={customer ? "Abrir cuenta" : "Iniciar sesión"}
        className="flex h-10 w-10 items-center justify-center rounded border border-transparent bg-white shadow-none transition hover:bg-neutral-100 small:w-auto small:gap-2 small:px-3"
      >
        <User className="h-5 w-5" />
        <span className="hidden text-sm font-semibold small:inline-block">
          {customer ? customer.first_name : "Iniciar sesión"}
        </span>
      </button>
    </LocalizedClientLink>
  )
}
