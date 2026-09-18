import { HandTruck, ReceiptPercent, ShieldCheck, Wrench } from "@medusajs/icons"
import { ClientProfile } from "@/lib/client-profile"

const defaultBenefits = [
  {
    label: "Precios B2B y descuentos por volumen",
    icon: ReceiptPercent,
  },
  {
    label: "Entrega rápida y fiable",
    icon: HandTruck,
  },
  {
    label: "Soporte técnico especializado",
    icon: Wrench,
  },
  {
    label: "Garantía y calidad profesional",
    icon: ShieldCheck,
  },
]

const benefitIcons = [ReceiptPercent, HandTruck, Wrench, ShieldCheck]

export function ProductBenefitsBar({ profile }: { profile?: ClientProfile }) {
  const benefits =
    profile?.productPage?.benefits?.slice(0, 4).map((benefit, index) => ({
      label: benefit.label,
      icon: benefitIcons[index] || ReceiptPercent,
    })) || defaultBenefits

  return (
    <div className="border-b border-neutral-200 bg-neutral-50">
      <div className="content-container grid gap-3 py-3 text-xs text-neutral-700 small:grid-cols-4">
        {benefits.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-neutral-950" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
