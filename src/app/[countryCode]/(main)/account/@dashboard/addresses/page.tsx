import { retrieveCustomer } from "@/lib/data/customer"
import { getRegion } from "@/lib/data/regions"
import AddressBook from "@/modules/account/components/address-book"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Direcciones",
  description: "Consulta tus direcciones",
}

export default async function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer().catch(() => null)
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Direcciones de envío</h1>
        <p className="text-base-regular">
          Consulta y actualiza tus direcciones de envío. Las direcciones
          guardadas estaran disponibles durante el checkout.
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
