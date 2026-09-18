import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"

export function SectionHeading({
  title,
  eyebrow,
  href,
  action,
}: {
  title: string
  eyebrow?: string
  href?: string
  action?: string
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 small:flex-row small:items-end">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase text-neutral-500">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-[26px] font-semibold leading-tight text-neutral-950 small:text-[32px]">
          {title}
        </h2>
      </div>
      {href && action && (
        <LocalizedClientLink
          href={href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-950 transition hover:text-[#d71920]"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </LocalizedClientLink>
      )}
    </div>
  )
}
