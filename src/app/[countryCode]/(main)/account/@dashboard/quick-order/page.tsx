import { getRegion } from "@/lib/data/regions"
import QuickOrderForm from "@/modules/account/components/quick-order-form"
import { Heading } from "@medusajs/ui"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Pedido rápido",
  description: "Añade productos al carrito introduciendo SKU y cantidad.",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function QuickOrderPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="quick-order-page-wrapper">
      <div className="mb-6">
        <Heading>Pedido rápido</Heading>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Introduce referencias, cantidades y unidad de compra para preparar
          pedidos recurrentes sin navegar por el catálogo.
        </p>
      </div>
      <QuickOrderForm regionId={region.id} />
    </div>
  )
}
