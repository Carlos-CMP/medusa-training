import { HomepageContent } from "@/lib/data/homepage"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"
import Image from "next/image"
import { Container } from "./container"

export function BusinessSolutions({ content }: { content: HomepageContent }) {
  return (
    <section className="bg-white py-4 small:py-8">
      <Container>
        <div className="grid overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 small:grid-cols-[0.52fr_0.48fr]">
          <div className="relative min-h-[320px] bg-neutral-100">
            <Image
              src={content.detailImage}
              alt={content.detailImageAlt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-10 small:px-14">
            <p className="text-xs font-semibold uppercase text-neutral-500">
              {content.detailEyebrow}
            </p>
            <h2 className="mt-3 max-w-md text-[32px] font-semibold leading-tight text-neutral-950">
              {content.detailTitle}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-neutral-600">
              {content.detailBody}
            </p>
            <LocalizedClientLink
              href={content.detailCtaHref}
              className="mt-7 inline-flex min-h-11 w-fit items-center justify-center gap-3 rounded bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-[#d71920]"
            >
              {content.detailCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </LocalizedClientLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
