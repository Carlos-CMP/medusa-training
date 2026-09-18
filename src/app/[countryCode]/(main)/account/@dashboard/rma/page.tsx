import { demoRmaCases } from "@/lib/b2b-industrial-demo"
import { Heading } from "@medusajs/ui"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Garantías y devoluciones",
  description: "Casos RMA y soporte postventa para clientes B2B.",
}

export default async function RmaPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <Heading>Garantías y devoluciones</Heading>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Seguimiento de incidencias, garantías, recambios y revisiones técnicas
          por cuenta de empresa.
        </p>
      </div>
      <div className="grid gap-4">
        {demoRmaCases.map((item) => (
          <article
            key={item.id}
            className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 medium:grid-cols-[1fr_auto]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-950">
                  {item.id.toUpperCase()}
                </h2>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-neutral-950">
                {item.product}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Serie: {item.serial}
              </p>
              <p className="mt-3 text-sm text-neutral-700">{item.reason}</p>
            </div>
            <div className="rounded-md bg-neutral-50 px-4 py-3 text-sm">
              <p className="text-neutral-500">Última actualización</p>
              <p className="mt-1 font-semibold text-neutral-950">
                {item.updatedAt}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
