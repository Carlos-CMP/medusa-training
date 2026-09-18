import { listCategories } from "@/lib/data/categories"
import { retrieveBrandProfile } from "@/lib/data/brand-profile"
import BrandLogo from "@/modules/common/components/brand-logo"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export default async function Footer() {
  const categories = await listCategories({
    offset: 0,
    limit: 5,
  }).catch(() => [])
  const clientProfile = await retrieveBrandProfile()

  const productLinks =
    categories.length > 0
      ? categories
          .filter((category) => !category.parent_category)
          .slice(0, 5)
          .map((category) => [category.name, `/categories/${category.handle}`])
      : [
          ["Altavoces pasivos", "/store"],
          ["Altavoces activos", "/store"],
          ["Subwoofers", "/store"],
          ["Columnas", "/store"],
          ["Accesorios", "/store"],
        ]
  const footerGroups = clientProfile.footer.columns.filter(
    (group) => group.title.toLowerCase() !== "productos"
  )

  return (
    <footer className="border-t border-neutral-900 bg-neutral-950 text-white">
      <div className="content-container mx-auto w-full">
        <div className="grid gap-10 py-10 small:grid-cols-[1.35fr_3fr]">
          <div>
            <LocalizedClientLink
              href="/"
              className="inline-flex items-center"
            >
              <BrandLogo
                className="h-12 w-[188px] border border-neutral-800"
                name={clientProfile.brand.name}
                logoUrl={clientProfile.brand.logo.light}
              />
            </LocalizedClientLink>
            <p className="mt-5 max-w-xs text-sm leading-6 text-neutral-400">
              {clientProfile.footer.description}
            </p>
            <div className="mt-6 flex gap-3 text-xs font-semibold text-neutral-400">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded border border-neutral-800">
                in
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded border border-neutral-800">
                ig
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded border border-neutral-800">
                yt
              </span>
            </div>
          </div>

          <div className="grid gap-8 xsmall:grid-cols-2 medium:grid-cols-5">
            <div>
              <h3 className="text-sm font-semibold">Productos</h3>
              <ul className="mt-4 grid gap-2 text-sm text-neutral-400">
                {productLinks.map(([label, href]) => (
                  <li key={label}>
                    <LocalizedClientLink
                      href={href}
                      className="transition hover:text-white"
                    >
                      {label}
                    </LocalizedClientLink>
                  </li>
                ))}
                <li>
                  <LocalizedClientLink
                    href="/store"
                    className="transition hover:text-white"
                  >
                    Ver catálogo completo
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <ul className="mt-4 grid gap-2 text-sm text-neutral-400">
                  {group.links
                    .filter((link) => link.enabled !== false)
                    .map((link) => (
                    <li key={link.label}>
                      <LocalizedClientLink
                        href={link.href}
                        className="transition hover:text-white"
                      >
                        {link.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-neutral-800 py-6 text-xs text-neutral-500 small:flex-row small:items-center small:justify-between">
          <p>
            (c) {new Date().getFullYear()} {clientProfile.brand.name}. Todos
            los derechos reservados.
          </p>
          <div className="flex flex-wrap gap-4">
            <LocalizedClientLink href="/store">
              Términos y condiciones
            </LocalizedClientLink>
            <LocalizedClientLink href="/store">
              Política de privacidad
            </LocalizedClientLink>
            <LocalizedClientLink href="/store">Cookies</LocalizedClientLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
