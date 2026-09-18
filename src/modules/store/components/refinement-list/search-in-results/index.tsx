"use client"

import { MagnifyingGlassMini } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

const SearchInResults = ({ listName }: { listName?: string }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const placeholder = listName
    ? `Buscar en ${listName}`
    : "Buscar por producto, SKU o EAN"

  useEffect(() => {
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const value = query.trim()

    params.delete("page")
    if (value) {
      params.set("q", value)
    } else {
      params.delete("q")
    }

    const nextSearch = params.toString()
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname)
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="group relative text-sm focus-within:border-neutral-500 rounded-t-lg focus-within:outline focus-within:outline-neutral-500"
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full p-2 pr-8 focus:outline-none rounded-lg"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <MagnifyingGlassMini className="w-4 h-4 text-neutral-500" />
      </button>
    </form>
  )
}

export default SearchInResults
