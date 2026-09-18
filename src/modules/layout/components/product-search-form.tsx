"use client"

import { MagnifyingGlass } from "@medusajs/icons"
import { useParams, useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

export function ProductSearchForm() {
  const [query, setQuery] = useState("")
  const router = useRouter()
  const { countryCode } = useParams()

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = query.trim()

    router.push(
      `/${countryCode}/store${value ? `?q=${encodeURIComponent(value)}` : ""}`
    )
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="relative hidden w-[280px] medium:block"
    >
      <label className="sr-only" htmlFor="site-product-search">
        Buscar productos
      </label>
      <input
        id="site-product-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar productos, referencias..."
        className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-4 pr-11 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded text-neutral-950 transition hover:bg-neutral-100"
      >
        <MagnifyingGlass className="h-4 w-4" />
      </button>
    </form>
  )
}
