"use client"

import {
  quoteToCsv,
  quoteToPrintHtml,
} from "@/lib/util/convert-quote-to-export"
import Button from "@/modules/common/components/button"
import { StoreQuoteResponse } from "@/types/quote"
import { AdminOrderPreview } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { useState } from "react"

type QuoteExportButtonsProps = {
  quote: StoreQuoteResponse["quote"]
  preview: AdminOrderPreview
}

const QuoteExportButtons = ({ quote, preview }: QuoteExportButtonsProps) => {
  const [error, setError] = useState<string | null>(null)

  const filename = `presupuesto-${quote.draft_order?.display_id || quote.id}`

  const handleCsvExport = () => {
    setError(null)
    const csv = quoteToCsv(quote, preview)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePdfExport = () => {
    setError(null)
    const printWindow = window.open("", "_blank", "width=1024,height=768")

    if (!printWindow) {
      setError("El navegador ha bloqueado la ventana de impresion.")
      return
    }

    printWindow.document.open()
    printWindow.document.write(quoteToPrintHtml(quote, preview))
    printWindow.document.close()
    printWindow.focus()

    window.setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  return (
    <div className="grid gap-2">
      <Button
        className="h-10 w-full rounded-md shadow-borders-base"
        variant="secondary"
        onClick={handleCsvExport}
      >
        Descargar CSV
      </Button>
      <Button
        className="h-10 w-full rounded-md shadow-borders-base"
        variant="secondary"
        onClick={handlePdfExport}
      >
        Exportar PDF
      </Button>
      {error ? <Text className="text-red-500">{error}</Text> : null}
    </div>
  )
}

export default QuoteExportButtons
