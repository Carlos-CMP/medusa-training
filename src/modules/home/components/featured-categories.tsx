import { HomepageContent } from "@/lib/data/homepage"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import { Container } from "./container"
import { SectionHeading } from "./section-heading"

export function FeaturedCategories({
  categories,
  content,
}: {
  categories: HttpTypes.StoreProductCategory[]
  content: HomepageContent
}) {
  const parentCategories = categories.filter(
    (category) => !category.parent_category
  )
  const items = content.featuredCategories.map((fallback) => {
    const matchingCategory = parentCategories.find((category) =>
      category.name.toLowerCase().includes(fallback.title.toLowerCase())
    )

    return {
      title: fallback.title,
      href: matchingCategory?.handle
        ? `/categories/${matchingCategory.handle}`
        : fallback.handle
        ? `/categories/${fallback.handle}`
        : "/store",
      image: fallback.image,
    }
  })

  return (
    <section className="bg-white py-10 small:py-12">
      <Container>
        <SectionHeading
          title={content.categoryTitle}
          href="/store"
          action="Ver todas las categorías"
        />
        <div className="grid gap-4 xsmall:grid-cols-2 medium:grid-cols-5">
          {items.map((item, index) => (
            <LocalizedClientLink
              key={item.title}
              href={item.href}
              className={clx(
                "group overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:border-neutral-950 hover:shadow-[0_14px_35px_rgba(15,23,42,0.09)]",
                items.length % 2 === 1 &&
                  index === items.length - 1 &&
                  "xsmall:col-span-2 medium:col-span-1"
              )}
            >
              <div className="relative aspect-square bg-neutral-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-200 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex min-h-[68px] items-center justify-between gap-3 px-4 py-4">
                <h3 className="text-sm font-semibold text-neutral-950">
                  {item.title}
                </h3>
                <ArrowRight className="h-4 w-4 shrink-0 text-neutral-950 transition group-hover:translate-x-0.5" />
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </Container>
    </section>
  )
}
