import { fetchQuote, fetchQuotePreview } from "@/lib/data/quotes"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import QuoteDetails from "../../components/quote-details"

type Props = {
  params: Promise<{ id: string; countryCode: string }>
}

export const metadata: Metadata = {
  title: "Detalle de presupuesto",
  description: "Detalle, estado y acciones de un presupuesto B2B.",
}

export default async function QuoteDetailsPage(props: Props) {
  const params = await props.params
  const { quote } = await fetchQuote(params.id, {})

  if (!quote) {
    notFound()
  }

  const shouldPreviewOrderChange = ["pending_merchant", "pending_customer"].includes(
    quote.status
  )
  const quotePreview = shouldPreviewOrderChange
    ? (
        await fetchQuotePreview(params.id, {})
      ).quote.order_preview
    : quote.draft_order

  if (!quotePreview) {
    notFound()
  }

  return (
    <QuoteDetails
      quote={quote}
      preview={quotePreview}
      countryCode={params.countryCode}
    />
  )
}
