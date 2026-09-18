"use client"

import { currencySymbolMap } from "@/lib/constants"
import { signup } from "@/lib/data/customer"
import { LOGIN_VIEW } from "@/modules/account/templates/login-template"
import ErrorMessage from "@/modules/checkout/components/error-message"
import { SubmitButton } from "@/modules/checkout/components/submit-button"
import Input from "@/modules/common/components/input"
import { HttpTypes } from "@medusajs/types"
import { Checkbox, Label, Select, Text } from "@medusajs/ui"
import { ChangeEvent, ReactNode, useActionState, useState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
  regions: HttpTypes.StoreRegion[]
  countryCode: string
}

interface FormData {
  email: string
  first_name: string
  last_name: string
  company_name: string
  company_tax_id: string
  company_sector: string
  password: string
  company_address: string
  company_city: string
  company_state: string
  company_zip: string
  company_country: string
  currency_code: string
}

const initialFormData: FormData = {
  email: "",
  first_name: "",
  last_name: "",
  company_name: "",
  company_tax_id: "",
  company_sector: "",
  password: "",
  company_address: "",
  company_city: "",
  company_state: "",
  company_zip: "",
  company_country: "",
  currency_code: "",
}

const fieldClass =
  "h-11 rounded-md bg-white shadow-borders-base hover:bg-white focus:shadow-borders-interactive-with-active"

const placeholder = ({
  placeholder,
  required,
}: {
  placeholder: string
  required: boolean
}) => {
  return (
    <span className="text-ui-fg-muted">
      {placeholder}
      {required && <span className="text-ui-fg-error">*</span>}
    </span>
  )
}

const Register = ({ setCurrentView, regions, countryCode }: Props) => {
  const [message, formAction] = useActionState(signup, null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: keyof FormData) => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const isValid =
    termsAccepted &&
    !!formData.email &&
    !!formData.first_name &&
    !!formData.last_name &&
    !!formData.company_name &&
    !!formData.company_tax_id &&
    !!formData.company_sector &&
    !!formData.password &&
    !!formData.company_address &&
    !!formData.company_city &&
    !!formData.company_zip &&
    !!formData.company_country &&
    !!formData.currency_code

  const countryNames = regions
    .flatMap((region) =>
      region.countries?.map((country) => country?.display_name || country?.name)
    )
    .filter((country) => country !== undefined)

  const currencies = regions.map((region) => region.currency_code)

  return (
    <div
      className="w-full max-w-5xl rounded-md border border-neutral-200 bg-white shadow-borders-base"
      data-testid="register-page"
    >
      <div className="grid gap-6 border-b border-neutral-200 p-6 small:grid-cols-[minmax(0,1fr)_280px] small:p-8">
        <div>
          <Text className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
            Alta profesional
          </Text>
          <Text className="mt-3 text-3xl font-semibold leading-tight text-neutral-950 small:text-4xl">
            Crea tu cuenta de empresa
          </Text>
          <Text className="mt-3 max-w-2xl text-base leading-6 text-neutral-600">
            Solicita acceso a tarifas privadas, presupuestos y condiciones B2B.
            Revisaremos los datos de empresa antes de activar la compra online.
          </Text>
        </div>

        <div className="grid content-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <Text className="text-sm font-semibold text-neutral-950">
            Proceso de alta
          </Text>
          <Step label="1" text="Datos de contacto y empresa" />
          <Step label="2" text="Validación comercial" />
          <Step label="3" text="Acceso a precios y pedidos" />
        </div>
      </div>

      <form className="grid gap-6 p-6 small:p-8" action={formAction}>
        <input type="hidden" name="redirect_country_code" value={countryCode} />

        <FormSection
          title="Datos del usuario"
          description="Usaremos estos datos para crear el primer usuario administrador."
        >
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
            className={fieldClass}
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="Contraseña"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
            className={fieldClass}
            value={formData.password}
            onChange={handleChange}
          />
          <Input
            label="Nombre"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
            className={fieldClass}
            value={formData.first_name}
            onChange={handleChange}
          />
          <Input
            label="Apellidos"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
            className={fieldClass}
            value={formData.last_name}
            onChange={handleChange}
          />
        </FormSection>

        <FormSection
          title="Datos de empresa"
          description="Estos campos permiten validar condiciones comerciales y facturación."
        >
          <Input
            label="Empresa"
            name="company_name"
            required
            autoComplete="organization"
            data-testid="company-name-input"
            className={fieldClass}
            value={formData.company_name}
            onChange={handleChange}
          />
          <Input
            label="CIF / VAT"
            name="company_tax_id"
            required
            autoComplete="off"
            data-testid="company-tax-id-input"
            className={fieldClass}
            value={formData.company_tax_id}
            onChange={handleChange}
          />
          <Select
            name="company_sector"
            required
            data-testid="company-sector-input"
            value={formData.company_sector}
            onValueChange={handleSelectChange("company_sector")}
          >
            <Select.Trigger className="h-11 rounded-md bg-white px-4 shadow-borders-base">
              <Select.Value
                placeholder={placeholder({
                  placeholder: "Sector profesional",
                  required: true,
                })}
              />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="instalador">Instalador</Select.Item>
              <Select.Item value="distribuidor">Distribuidor</Select.Item>
              <Select.Item value="retail">Retail</Select.Item>
              <Select.Item value="empresa">Empresa final</Select.Item>
              <Select.Item value="integrador">Integrador</Select.Item>
            </Select.Content>
          </Select>
          <Select
            name="currency_code"
            required
            autoComplete="currency"
            data-testid="company-currency-input"
            value={formData.currency_code}
            onValueChange={handleSelectChange("currency_code")}
          >
            <Select.Trigger className="h-11 rounded-md bg-white px-4 shadow-borders-base">
              <Select.Value
                placeholder={placeholder({
                  placeholder: "Moneda",
                  required: true,
                })}
              />
            </Select.Trigger>
            <Select.Content>
              {[...new Set(currencies)].map((currency) => (
                <Select.Item key={currency} value={currency}>
                  {currency.toUpperCase()} ({currencySymbolMap[currency]})
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </FormSection>

        <FormSection
          title="Dirección fiscal"
          description="Dirección principal para facturación y validación de cuenta."
        >
          <div className="small:col-span-2">
            <Input
              label="Dirección de empresa"
              name="company_address"
              required
              autoComplete="address"
              data-testid="company-address-input"
              className={fieldClass}
              value={formData.company_address}
              onChange={handleChange}
            />
          </div>
          <Input
            label="Ciudad"
            name="company_city"
            required
            autoComplete="address-level2"
            data-testid="company-city-input"
            className={fieldClass}
            value={formData.company_city}
            onChange={handleChange}
          />
          <Input
            label="Provincia"
            name="company_state"
            autoComplete="address-level1"
            data-testid="company-state-input"
            className={fieldClass}
            value={formData.company_state}
            onChange={handleChange}
          />
          <Input
            label="Código postal"
            name="company_zip"
            required
            autoComplete="postal-code"
            data-testid="company-zip-input"
            className={fieldClass}
            value={formData.company_zip}
            onChange={handleChange}
          />
          <Select
            name="company_country"
            required
            autoComplete="country"
            data-testid="company-country-input"
            value={formData.company_country}
            onValueChange={handleSelectChange("company_country")}
          >
            <Select.Trigger className="h-11 rounded-md bg-white px-4 shadow-borders-base">
              <Select.Value
                placeholder={placeholder({
                  placeholder: "País",
                  required: true,
                })}
              />
            </Select.Trigger>
            <Select.Content>
              {countryNames?.map((country) => (
                <Select.Item key={country} value={country}>
                  {country}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </FormSection>

        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <ErrorMessage error={message} data-testid="register-error" />
          <div className="flex items-start gap-3">
            <Checkbox
              name="terms"
              id="terms-checkbox"
              data-testid="terms-checkbox"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(!!checked)}
              className="mt-0.5"
            />
            <Label
              id="terms-label"
              className="text-sm leading-5 text-neutral-700 hover:cursor-pointer"
              htmlFor="terms-checkbox"
              data-testid="terms-label"
            >
              Acepto los términos y condiciones del portal B2B.
            </Label>
          </div>

          <div className="mt-5 flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
            <SubmitButton
              className="h-11 w-full rounded-md small:w-auto small:min-w-52"
              data-testid="register-button"
              disabled={!isValid}
            >
              Solicitar acceso
            </SubmitButton>
            <span className="text-sm text-neutral-600">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => setCurrentView(LOGIN_VIEW.LOG_IN)}
                className="font-medium text-neutral-950 underline underline-offset-4"
              >
                Iniciar sesión
              </button>
            </span>
          </div>
        </div>
      </form>
    </div>
  )
}

const FormSection = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) => {
  return (
    <section className="grid gap-4 border-b border-neutral-200 pb-6 last:border-b-0 last:pb-0 small:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <Text className="text-base font-semibold text-neutral-950">{title}</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500">
          {description}
        </Text>
      </div>
      <div className="grid gap-3 small:grid-cols-2">{children}</div>
    </section>
  )
}

const Step = ({ label, text }: { label: string; text: string }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-neutral-950 text-xs font-semibold text-white">
        {label}
      </span>
      <Text className="text-sm text-neutral-700">{text}</Text>
    </div>
  )
}

export default Register
