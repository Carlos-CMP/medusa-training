import { ClientProfileLink } from "@/lib/client-profile"
import { retrieveBrandProfile } from "@/lib/data/brand-profile"
import { retrieveCart } from "@/lib/data/cart"
import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"
import BrandLogo from "@/modules/common/components/brand-logo"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import FilePlus from "@/modules/common/icons/file-plus"
import { MobileNavigation } from "@/modules/layout/components/mobile-navigation"
import { ProductSearchForm } from "@/modules/layout/components/product-search-form"
import { RequestQuoteConfirmation } from "@/modules/quotes/components/request-quote-confirmation"
import { RequestQuotePrompt } from "@/modules/quotes/components/request-quote-prompt"
import SkeletonAccountButton from "@/modules/skeletons/components/skeleton-account-button"
import SkeletonCartButton from "@/modules/skeletons/components/skeleton-cart-button"
import { ChevronDownMini } from "@medusajs/icons"
import { Suspense } from "react"

export async function NavigationHeader() {
  const customer = await retrieveCustomer().catch(() => null)
  const cart = await retrieveCart()
  const categories = await listCategories({ limit: 6 }).catch(() => [])
  const clientProfile = await retrieveBrandProfile()
  const navigationLinks = clientProfile.navigation.main.filter(
    (link) => link.enabled !== false
  )
  const productNavigation =
    navigationLinks.find((link) => link.label === "Productos") ||
    navigationLinks[0]
  const secondaryNavigation = navigationLinks.filter(
    (link) => link.label !== productNavigation?.label
  )
  const productChildren = getEnabledChildren(productNavigation)

  return (
    <div className="sticky inset-x-0 top-0 z-50 border-b border-neutral-200 bg-white/95 text-neutral-950 backdrop-blur">
      <header className="content-container mx-auto flex min-h-[72px] w-full min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 medium:gap-5">
          <MobileNavigation categories={categories} profile={clientProfile} />
          <div className="flex min-w-0 items-center gap-8">
            <LocalizedClientLink className="flex w-fit items-center" href="/">
              <BrandLogo
                className="h-14 w-[132px] medium:h-16 medium:w-[280px]"
                imageClassName="scale-[1.45]"
                name={clientProfile.brand.name}
                logoUrl={clientProfile.brand.logo.dark}
              />
            </LocalizedClientLink>

            <nav className="hidden items-center gap-7 text-sm font-semibold medium:flex">
              <div className="group">
                <LocalizedClientLink
                  href={productNavigation?.href || "/store"}
                  className="inline-flex items-center gap-1 py-7"
                >
                  {productNavigation?.label || "Productos"}
                  <ChevronDownMini className="h-4 w-4" />
                </LocalizedClientLink>
                <div className="invisible absolute left-0 right-0 top-full z-50 border-t border-neutral-200 bg-white opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                  <div className="content-container mx-auto grid gap-8 py-6 medium:grid-cols-[1fr_1.4fr]">
                    <MegaMenuColumn
                      title={productNavigation?.label || "Productos"}
                      description="Acceso rápido al catálogo B2B y familias de producto."
                      links={[
                        { label: "Ver catálogo completo", href: "/store" },
                        ...productChildren,
                      ]}
                    />
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                        Categorías Medusa
                      </p>
                      <div className="grid gap-2 medium:grid-cols-2">
                        {categories.slice(0, 6).map((category) => (
                          <LocalizedClientLink
                            key={category.id}
                            href={`/categories/${category.handle}`}
                            className="rounded border border-neutral-200 px-3 py-3 text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
                          >
                            {category.name}
                          </LocalizedClientLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {secondaryNavigation.map((link) => {
                const children = getEnabledChildren(link)

                if (!children.length) {
                  return (
                    <LocalizedClientLink key={link.label} href={link.href}>
                      {link.label}
                    </LocalizedClientLink>
                  )
                }

                return (
                  <div key={link.label} className="group">
                    <LocalizedClientLink
                      href={link.href}
                      className="inline-flex items-center gap-1 py-7"
                    >
                      {link.label}
                      <ChevronDownMini className="h-4 w-4" />
                    </LocalizedClientLink>
                    <div className="invisible absolute left-0 right-0 top-full z-50 border-t border-neutral-200 bg-white opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                      <div className="content-container mx-auto py-6">
                        <MegaMenuColumn
                          title={link.label}
                          description="Enlaces configurados desde el backoffice."
                          links={children}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 small:gap-2">
          <ProductSearchForm />

          <div className="hidden items-center gap-2 small:flex">
            {customer && cart?.items && cart.items.length > 0 ? (
              <RequestQuoteConfirmation>
                <button className="flex h-10 items-center gap-1.5 rounded border border-neutral-200 bg-white px-3 text-sm font-semibold shadow-none transition hover:bg-neutral-50">
                  <FilePlus />
                  <span className="hidden small:inline-block">Presupuesto</span>
                </button>
              </RequestQuoteConfirmation>
            ) : (
              <RequestQuotePrompt>
                <button className="flex h-10 items-center gap-1.5 rounded border border-neutral-200 bg-white px-3 text-sm font-semibold shadow-none transition hover:bg-neutral-50">
                  <FilePlus />
                  <span className="hidden small:inline-block">Presupuesto</span>
                </button>
              </RequestQuotePrompt>
            )}
          </div>

          <Suspense fallback={<SkeletonAccountButton />}>
            <AccountButton customer={customer} />
          </Suspense>

          <Suspense fallback={<SkeletonCartButton />}>
            <CartButton />
          </Suspense>
        </div>
      </header>
    </div>
  )
}

const getEnabledChildren = (link?: ClientProfileLink) =>
  (link?.children || []).filter((child) => child.enabled !== false)

const MegaMenuColumn = ({
  title,
  description,
  links,
}: {
  title: string
  description: string
  links: ClientProfileLink[]
}) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
      {title}
    </p>
    <p className="mt-2 max-w-md text-sm font-normal leading-6 text-neutral-600">
      {description}
    </p>
    <div className="mt-4 grid gap-2 medium:grid-cols-2">
      {links.map((link) => (
        <LocalizedClientLink
          key={`${link.label}-${link.href}`}
          href={link.href}
          className="rounded border border-neutral-200 px-3 py-3 text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
        >
          {link.label}
        </LocalizedClientLink>
      ))}
    </div>
  </div>
)
