import Input from "@/modules/common/components/input"
import { B2BCart, B2BCustomer } from "@/types"
import React, { useEffect, useMemo, useState } from "react"

const ContactDetailsForm = ({
  customer,
  cart,
}: {
  customer: B2BCustomer | null
  cart: B2BCart | null
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    email: "",
    invoice_recipient: "",
    cost_center: "",
    po_number: "",
    requisition_number: "",
    payment_terms: "",
    selected_payment_method: "",
    door_code: "",
    notes: "",
  })

  const savedPaymentMethods = useMemo(
    () => cart?.company?.saved_payment_methods || [],
    [cart?.company?.saved_payment_methods]
  )
  const paymentMethodOptions = useMemo(() => {
    const defaults = [
      { value: "bank_transfer", label: "Transferencia bancaria" },
      { value: "credit_account", label: "Cuenta de crédito" },
      { value: "saved_sepa", label: "SEPA guardado" },
      { value: "card_on_file", label: "Tarjeta guardada" },
    ]

    const saved = savedPaymentMethods
      .map((method) => ({
        value: String(method.id || method.code || method.type || ""),
        label: String(method.label || method.name || method.type || ""),
      }))
      .filter((method) => method.value && method.label)

    return saved.length ? saved : defaults
  }, [savedPaymentMethods])

  useEffect(() => {
    if (cart && cart.email) {
      setFormData((prevState) => ({
        ...prevState,
        email: cart.email || "",
        invoice_recipient: cart.metadata?.invoice_recipient?.toString() || "",
        cost_center: cart.metadata?.cost_center?.toString() || "",
        po_number:
          cart.metadata?.po_number?.toString() ||
          cart.metadata?.requisition_number?.toString() ||
          "",
        requisition_number: cart.metadata?.requisition_number?.toString() || "",
        payment_terms:
          cart.metadata?.payment_terms?.toString() ||
          cart.company?.payment_terms ||
          "",
        selected_payment_method:
          cart.metadata?.selected_payment_method?.toString() ||
          cart.company?.default_payment_method ||
          "",
        door_code: cart.metadata?.door_code?.toString() || "",
        notes: cart.metadata?.notes?.toString() || "",
      }))
    }
  }, [cart])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm font-semibold text-neutral-950">
          Confirmación empresarial
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Este pedido se registra para {cart?.company?.name || "la empresa"}.
          Indica referencia interna, centro de coste y condiciones acordadas.
        </p>
      </div>

      <div className="flex flex-col small:grid small:grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="email-input"
          className="small:col-span-2"
        />
        <Input
          label="Destinatario de factura"
          name="invoice_recipient"
          autoComplete="organization"
          value={formData.invoice_recipient}
          onChange={handleChange}
          data-testid="invoice-recipient-input"
        />
        <Input
          label="Centro de coste"
          name="cost_center"
          value={formData.cost_center}
          onChange={handleChange}
          data-testid="cost-center-input"
        />
        <Input
          label="Número de pedido / PO"
          name="po_number"
          value={formData.po_number}
          onChange={handleChange}
          data-testid="po-number-input"
        />
        <Input
          label="Referencia interna"
          name="requisition_number"
          value={formData.requisition_number}
          onChange={handleChange}
          data-testid="requisition-number-input"
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-700">
            Condición de pago acordada
          </span>
          <select
            name="payment_terms"
            value={formData.payment_terms}
            onChange={handleChange}
            data-testid="payment-terms-input"
            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
          >
            <option value="">Selecciona condición</option>
            <option value="prepaid">Pago anticipado</option>
            <option value="bank_transfer">Transferencia bancaria</option>
            <option value="net_30">Crédito 30 días</option>
            <option value="net_60">Crédito 60 días</option>
            <option value="net_90">Crédito 90 días</option>
            <option value="credit">Crédito comercial</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-neutral-700">
            Método de pago guardado
          </span>
          <select
            name="selected_payment_method"
            value={formData.selected_payment_method}
            onChange={handleChange}
            data-testid="saved-payment-method-input"
            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
          >
            <option value="">Selecciona método</option>
            {paymentMethodOptions.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Muelle / código de entrega"
          name="door_code"
          value={formData.door_code}
          onChange={handleChange}
          data-testid="door-code-input"
        />
        <div className="col-span-2">
          <Input
            label="Notas internas"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            data-testid="notes-input"
            className="small:col-span-2"
          />
          <label className="text-xs italic text-neutral-500">
            Esta información ayuda a compras, administración y logística a
            conciliar el pedido.
          </label>
        </div>
      </div>
    </div>
  )
}

export default ContactDetailsForm
