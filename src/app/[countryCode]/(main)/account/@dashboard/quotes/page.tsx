import { fetchQuotes } from "@/lib/data/quotes"
import { Heading } from "@medusajs/ui"
import { Metadata } from "next"
import QuotesOverview from "./components/quotes-overview"

export const metadata: Metadata = {
  title: "Presupuestos",
  description: "Presupuestos B2B solicitados y pendientes de respuesta.",
}

export default async function Quotes() {
  const { quotes = [] } = await fetchQuotes().catch(() => ({ quotes: [] }))

  return (
    <div className="w-full" data-testid="quotes-page-wrapper">
      <div className="mb-4">
        <Heading>Presupuestos</Heading>
      </div>

      <div>
        <QuotesOverview quotes={quotes} />
      </div>
    </div>
  )
}
