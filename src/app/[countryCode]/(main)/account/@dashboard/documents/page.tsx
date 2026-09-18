import { demoDocuments } from "@/lib/b2b-industrial-demo"
import { Heading } from "@medusajs/ui"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Facturas y albaranes",
  description: "Documentación administrativa B2B por empresa.",
}

export default async function DocumentsPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <Heading>Facturas y albaranes</Heading>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Documentos consolidados de la empresa, no solo del usuario conectado.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Número</th>
              <th className="px-5 py-3">Pedido</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3 text-right">Importe</th>
              <th className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {demoDocuments.map((document) => (
              <tr key={document.id}>
                <td className="px-5 py-4">{document.type}</td>
                <td className="px-5 py-4 font-semibold text-neutral-950">
                  {document.number}
                </td>
                <td className="px-5 py-4">{document.order}</td>
                <td className="px-5 py-4">{document.date}</td>
                <td className="px-5 py-4 text-right font-semibold">
                  {document.amount}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                    {document.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
