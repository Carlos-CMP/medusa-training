"use client"

import {
  getProductDocuments,
  getProductSpecGroups,
} from "@/lib/util/product-technical-profile"
import { ClientProfile } from "@/lib/client-profile"
import { DocumentText, ChevronRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Markdown from "react-markdown"
import { useState } from "react"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  profile?: ClientProfile
}

const tabLabels = [
  "Descripción",
  "Especificaciones",
  "Documentación",
  "Entrega",
]

const ProductTabs = ({ product, profile }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState(tabLabels[1])
  const specGroups = getProductSpecGroups(product, profile)
  const documents = getProductDocuments(product)

  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div
        role="tablist"
        aria-label="Información de producto"
        className="flex overflow-x-auto border-b border-neutral-200"
      >
        {tabLabels.map((label) => (
          <button
            key={label}
            role="tab"
            aria-selected={activeTab === label}
            onClick={() => setActiveTab(label)}
            className={clx(
              "min-h-12 shrink-0 border-b-2 px-6 text-sm font-semibold transition",
              activeTab === label
                ? "border-neutral-950 text-neutral-950"
                : "border-transparent text-neutral-500 hover:text-neutral-950"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-5 small:p-6">
        {activeTab === "Descripción" && (
          <div className="max-w-3xl text-sm leading-7 text-neutral-700">
            {product.description ? (
              <Markdown>{product.description}</Markdown>
            ) : (
              <p>No hay descripción ampliada publicada para este producto.</p>
            )}
          </div>
        )}

        {activeTab === "Especificaciones" && (
          <div className="grid gap-6 medium:grid-cols-2">
            {specGroups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-3 text-sm font-semibold text-neutral-950">
                  {group.title}
                </h3>
                <dl className="divide-y divide-neutral-200 text-sm">
                  {group.rows.map((row) => (
                    <div
                      key={`${group.title}-${row.label}`}
                      className="grid grid-cols-[0.9fr_1fr] gap-4 py-3"
                    >
                      <dt className="text-neutral-500">{row.label}</dt>
                      <dd className="font-semibold text-neutral-950">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Documentación" && (
          <div className="grid gap-3">
            {documents.length > 0 ? (
              documents.map((document) => (
                <a
                  key={document.title}
                  href={document.url}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-950"
                >
                  <span className="flex items-center gap-3">
                    <DocumentText className="h-5 w-5 text-neutral-950" />
                    <span>
                      <span className="block text-sm font-semibold text-neutral-950">
                        {document.title}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {document.type} - {document.detail}
                      </span>
                    </span>
                  </span>
                  <ChevronRightMini className="h-4 w-4" />
                </a>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
                No hay documentos técnicos publicados para este producto. La
                arquitectura queda preparada para conectar fichas, manuales,
                certificados y planos desde Medusa.
              </div>
            )}
          </div>
        )}

        {activeTab === "Entrega" && (
          <div className="grid gap-4 text-sm text-neutral-700 small:grid-cols-3">
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="font-semibold text-neutral-950">Disponibilidad</p>
              <p className="mt-2">Gestionada por región y canal de venta.</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="font-semibold text-neutral-950">Embalaje</p>
              <p className="mt-2">Unidad o caja según variante seleccionada.</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="font-semibold text-neutral-950">Soporte</p>
              <p className="mt-2">Equipo técnico disponible para preventa.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default ProductTabs
