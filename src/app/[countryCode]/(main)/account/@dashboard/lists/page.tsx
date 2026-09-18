import { demoSavedLists } from "@/lib/b2b-industrial-demo"
import { Heading } from "@medusajs/ui"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Listas de compra",
  description: "Listas, proyectos y reposiciones recurrentes B2B.",
}

export default async function ListsPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <Heading>Listas de compra</Heading>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Proyectos, reposiciones y carritos recurrentes asociados a la empresa.
        </p>
      </div>
      <div className="grid gap-4">
        {demoSavedLists.map((list) => (
          <article
            key={list.id}
            className="rounded-lg border border-neutral-200 bg-white"
          >
            <div className="grid gap-3 border-b border-neutral-200 p-5 medium:grid-cols-[1fr_auto] medium:items-start">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">
                  {list.name}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Responsable: {list.owner} · Centro de coste:{" "}
                  <span className="font-semibold text-neutral-700">
                    {list.costCenter}
                  </span>
                </p>
              </div>
              <span className="rounded-md border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700">
                Actualizada {list.updatedAt}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3 text-right">Cantidad</th>
                    <th className="px-5 py-3">Unidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {list.items.map((item) => (
                    <tr key={`${list.id}-${item.sku}`}>
                      <td className="px-5 py-3 font-mono text-xs">
                        {item.sku}
                      </td>
                      <td className="px-5 py-3 font-semibold text-neutral-950">
                        {item.name}
                      </td>
                      <td className="px-5 py-3 text-right">{item.quantity}</td>
                      <td className="px-5 py-3">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
