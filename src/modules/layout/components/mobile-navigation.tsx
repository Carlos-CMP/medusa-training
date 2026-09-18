"use client"

import { clientProfile } from "@/lib/client-profile"
import { ClientProfile, ClientProfileLink } from "@/lib/client-profile"
import BrandLogo from "@/modules/common/components/brand-logo"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { BarsThree, ChevronDownMini, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"

export function MobileNavigation({
  categories,
  profile = clientProfile,
}: {
  categories: HttpTypes.StoreProductCategory[]
  profile?: ClientProfile
}) {
  const [open, setOpen] = useState(false)
  const navigationLinks = profile.navigation.main.filter(
    (link) => link.enabled !== false
  )
  const productNavigation =
    navigationLinks.find((link) => link.label === "Productos") ||
    navigationLinks[0]
  const staticLinks = navigationLinks.filter(
    (link) => link.label !== productNavigation?.label
  )

  return (
    <div className="medium:hidden">
      <button
        type="button"
        aria-label="Abrir navegación"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded border border-neutral-200 text-neutral-950"
      >
        <BarsThree className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/30">
          <div className="ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <BrandLogo
                className="h-14 w-[230px]"
                imageClassName="scale-[1.45]"
                name={profile.brand.name}
                logoUrl={profile.brand.logo.dark}
              />
              <button
                type="button"
                aria-label="Cerrar navegación"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-neutral-200"
              >
                <XMark className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col px-5 py-4 text-sm font-semibold text-neutral-950">
              <MobileMenuSection
                label={productNavigation?.label || "Productos"}
                href={productNavigation?.href || "/store"}
                links={[
                  { label: "Ver catálogo completo", href: "/store" },
                  ...getEnabledChildren(productNavigation),
                  ...categories.slice(0, 6).map((category) => ({
                    label: category.name,
                    href: `/categories/${category.handle}`,
                  })),
                ]}
                defaultOpen
                onNavigate={() => setOpen(false)}
              />
              {staticLinks.map((link) => {
                const children = getEnabledChildren(link)

                if (!children.length) {
                  return (
                    <LocalizedClientLink
                      key={link.label}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="border-b border-neutral-200 py-3"
                    >
                      {link.label}
                    </LocalizedClientLink>
                  )
                }

                return (
                  <MobileMenuSection
                    key={link.label}
                    label={link.label}
                    href={link.href}
                    links={children}
                    onNavigate={() => setOpen(false)}
                  />
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

const getEnabledChildren = (link?: ClientProfileLink) =>
  (link?.children || []).filter((child) => child.enabled !== false)

const MobileMenuSection = ({
  label,
  href,
  links,
  defaultOpen,
  onNavigate,
}: {
  label: string
  href: string
  links: ClientProfileLink[]
  defaultOpen?: boolean
  onNavigate: () => void
}) => (
  <details
    className="group border-b border-neutral-200 py-3"
    defaultOpen={defaultOpen}
  >
    <summary className="flex cursor-pointer list-none items-center justify-between">
      <LocalizedClientLink href={href} onClick={onNavigate}>
        {label}
      </LocalizedClientLink>
      <ChevronDownMini className="h-4 w-4 transition group-open:rotate-180" />
    </summary>
    <div className="mt-3 grid gap-2 text-neutral-600">
      {links.map((link) => (
        <LocalizedClientLink
          key={`${link.label}-${link.href}`}
          href={link.href}
          onClick={onNavigate}
        >
          {link.label}
        </LocalizedClientLink>
      ))}
    </div>
  </details>
)
