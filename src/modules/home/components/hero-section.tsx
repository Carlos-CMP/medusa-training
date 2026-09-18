import { HomepageContent } from "@/lib/data/homepage"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ArrowRight, CubeSolid, ShieldCheck, Tag, TruckFast } from "@medusajs/icons"
import Image from "next/image"
import { Container } from "./container"

const trustIcons = [ShieldCheck, CubeSolid, Tag, TruckFast]

export function HeroSection({ content }: { content: HomepageContent }) {
  const visibleTrustBlocks = content.trustBlocks
    .filter((item) => !item.isHidden)
    .slice(0, 4)

  return (
    <section className="bg-white pt-4">
      <Container>
        <div className="overflow-hidden rounded-lg border border-neutral-900 bg-neutral-950 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
          <div className="grid min-h-[620px] small:grid-cols-[0.46fr_0.54fr]">
            <div className="flex flex-col justify-center px-6 py-10 small:px-12">
              <p className="mb-5 text-xs font-semibold uppercase text-neutral-400">
                {content.heroBadgePrimary}
              </p>
              <h1 className="max-w-xl text-[38px] font-semibold leading-[1.04] tracking-normal text-white small:text-[56px]">
                {content.heroTitle}
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-neutral-300">
                {content.heroBody}
              </p>
              <div className="mt-8 flex flex-col gap-3 xsmall:flex-row">
                <LocalizedClientLink
                  href={content.primaryCtaHref}
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:bg-[#d71920] hover:text-white"
                >
                  {content.primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </LocalizedClientLink>
                <LocalizedClientLink
                  href={content.secondaryCtaHref}
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded border border-neutral-700 px-5 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-neutral-950"
                >
                  {content.secondaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </LocalizedClientLink>
              </div>
            </div>

            <div className="relative min-h-[360px] bg-neutral-950 small:min-h-full">
              <Image
                src={content.heroImage}
                alt={content.heroImageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 54vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-y-0 left-0 hidden w-44 bg-gradient-to-r from-neutral-950 to-transparent small:block" />
            </div>
          </div>

          <div className="grid border-t border-neutral-800 bg-neutral-950 xsmall:grid-cols-2 small:grid-cols-4">
            {visibleTrustBlocks.map((item, index) => {
              const Icon = trustIcons[index % trustIcons.length]

              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 border-neutral-800 px-6 py-6 small:border-r last:border-r-0"
                >
                  <Icon className="mt-1 h-7 w-7 shrink-0 text-white" />
                  <div>
                    <p className="font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-neutral-400">
                      {item.body}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}
