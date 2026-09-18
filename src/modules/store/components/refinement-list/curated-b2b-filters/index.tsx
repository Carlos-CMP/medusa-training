"use client"

import { Container, clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FormEvent } from "react"

const filterGroups = [
  {
    title: "Disponibilidad",
    key: "availability",
    options: [
      { label: "En stock", value: "in_stock" },
      { label: "Stock limitado", value: "low_stock" },
    ],
  },
  {
    title: "Potencia",
    key: "power_band",
    options: [
      { label: "Hasta 100 W", value: "compact" },
      { label: "100 - 500 W", value: "mid" },
      { label: "Más de 500 W", value: "high" },
    ],
  },
  {
    title: "Uso",
    key: "application",
    options: [
      { label: "Instalación fija", value: "fixed_install" },
      { label: "Eventos", value: "events" },
      { label: "Salas y hoteles", value: "business_spaces" },
      { label: "Estudio", value: "studio" },
    ],
  },
  {
    title: "Conectividad",
    key: "connectivity",
    options: [
      { label: "Cableado", value: "wired" },
      { label: "Inalámbrico", value: "wireless" },
      { label: "HDMI / AV", value: "av" },
    ],
  },
]

const paramsToClear = [
  "availability",
  "price_min",
  "price_max",
  "power_band",
  "application",
  "connectivity",
  "page",
]

const CuratedB2BFilters = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pushParams = (params: URLSearchParams) => {
    params.delete("page")
    const nextSearch = params.toString()
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname)
  }

  const toggleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    pushParams(params)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    paramsToClear.forEach((key) => params.delete(key))
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname)
  }

  const onPriceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const params = new URLSearchParams(searchParams.toString())
    const min = String(form.get("price_min") || "").trim()
    const max = String(form.get("price_max") || "").trim()

    min ? params.set("price_min", min) : params.delete("price_min")
    max ? params.set("price_max", max) : params.delete("price_max")
    pushParams(params)
  }

  const hasActiveFilters = paramsToClear.some(
    (key) => key !== "page" && searchParams.has(key)
  )

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between border-b border-neutral-200 p-3">
        <span className="text-sm font-medium text-neutral-950">
          Filtros B2B
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-neutral-500 hover:text-neutral-950"
          >
            Limpiar
          </button>
        )}
      </div>

      <form
        onSubmit={onPriceSubmit}
        className="border-b border-neutral-200 p-3"
      >
        <span className="text-xs font-semibold uppercase text-neutral-500">
          Precio
        </span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            name="price_min"
            inputMode="numeric"
            defaultValue={searchParams.get("price_min") || ""}
            placeholder="Mín."
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-500"
          />
          <input
            name="price_max"
            inputMode="numeric"
            defaultValue={searchParams.get("price_max") || ""}
            placeholder="Máx."
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-500"
          />
        </div>
        <button
          type="submit"
          className="mt-2 h-8 w-full rounded-md bg-neutral-950 text-xs font-semibold text-white hover:bg-neutral-700"
        >
          Aplicar precio
        </button>
      </form>

      <div className="divide-y divide-neutral-200">
        {filterGroups.map((group) => (
          <div key={group.key} className="p-3">
            <span className="text-xs font-semibold uppercase text-neutral-500">
              {group.title}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.options.map((option) => {
                const active = searchParams.get(group.key) === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleFilter(group.key, option.value)}
                    aria-pressed={active}
                    className={clx(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      active
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}

export default CuratedB2BFilters
