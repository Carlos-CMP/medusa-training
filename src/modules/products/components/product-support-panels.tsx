import { CubeSolid, HandTruck, ShieldCheck, Wrench } from "@medusajs/icons"
import { ClientProfile } from "@/lib/client-profile"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

const defaultPanels = [
  {
    title: "Proyecto a medida",
    body: "Nuestro equipo técnico puede revisar necesidades, cantidades y compatibilidad.",
    action: "Contactar",
    href: "/account",
    icon: Wrench,
  },
  {
    title: "Envíos a toda Europa",
    body: "Entrega rápida y segura para pedidos profesionales.",
    action: "Más info",
    href: "/store",
    icon: CubeSolid,
  },
  {
    title: "Garantía profesional",
    body: "Soporte comercial y garantía oficial para canal B2B.",
    action: "Más info",
    href: "/account",
    icon: ShieldCheck,
  },
  {
    title: "Soporte técnico",
    body: "Asistencia especializada para instalaciones y preventa.",
    action: "Contactar",
    href: "/account",
    icon: HandTruck,
  },
]

const panelIcons = [Wrench, CubeSolid, ShieldCheck, HandTruck]

export function ProductSupportPanels({ profile }: { profile?: ClientProfile }) {
  const panels =
    profile?.productPage?.supportPanels?.slice(0, 4).map((panel, index) => ({
      ...panel,
      href: panel.href || "/account",
      icon: panelIcons[index] || Wrench,
    })) || defaultPanels

  return (
    <section className="content-container grid gap-3 py-8 small:grid-cols-4">
      {panels.map(({ title, body, action, href, icon: Icon }) => (
        <article
          key={title}
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <Icon className="h-7 w-7 text-neutral-950" />
          <h3 className="mt-4 text-sm font-semibold text-neutral-950">
            {normalizeSupportCopy(title)}
          </h3>
          <p className="mt-2 text-xs leading-5 text-neutral-600">
            {normalizeSupportCopy(body)}
          </p>
          <LocalizedClientLink
            href={href}
            className="mt-3 inline-flex text-xs font-semibold underline underline-offset-4"
          >
            {normalizeSupportCopy(action)}
          </LocalizedClientLink>
        </article>
      ))}
    </section>
  )
}

const normalizeSupportCopy = (value: string) =>
  value
    .replace(/\bEnvios\b/g, "Envíos")
    .replace(/\bGarantia\b/g, "Garantía")
    .replace(/\bMas info\b/g, "Más info")
    .replace(/\bSoporte tecnico\b/g, "Soporte técnico")
    .replace(/\btecnico\b/g, "técnico")
    .replace(/\brapida\b/g, "rápida")
    .replace(/\bsegura\b/g, "segura")
