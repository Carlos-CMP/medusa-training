import { retrieveBrandProfile } from "@/lib/data/brand-profile"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import BrandLogo from "@/modules/common/components/brand-logo"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await retrieveBrandProfile()

  return (
    <div className="mb-2 w-full bg-white relative small:min-h-screen">
      <div className="h-16 bg-white">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink className="hover:text-ui-fg-base" href="/">
            <span className="flex items-center">
              <BrandLogo
                className="h-12 w-[190px]"
                imageClassName="scale-[1.25]"
                name={profile.brand.name}
                logoUrl={profile.brand.logo.dark}
              />
            </span>
          </LocalizedClientLink>
        </nav>
      </div>
      <div className="relative bg-neutral-100" data-testid="checkout-container">
        {children}
      </div>
      <div className="flex w-full items-center justify-center py-4 text-sm text-neutral-500">
        Portal B2B {profile.brand.name}. Desarrollado con Medusa.
      </div>
    </div>
  )
}
