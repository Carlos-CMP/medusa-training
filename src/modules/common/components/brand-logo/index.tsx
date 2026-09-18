"use client"

import { clx } from "@medusajs/ui"
import { clientProfile } from "@/lib/client-profile"
import { useState } from "react"

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  name?: string
  logoUrl?: string
}

const LEGACY_ASSET_HOSTS = [
  "https://ngs-medusa-backend.onrender.com",
  "http://ngs-medusa-backend.onrender.com",
  "http://localhost:9000",
]

const getBackendUrl = () =>
  (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "https://b2b-novicell.medusajs.app"
  ).replace(/\/$/, "")

const normalizeLogoUrl = (url?: string) => {
  const value = (url || "").trim()

  if (!value) {
    return undefined
  }

  const legacyHost = LEGACY_ASSET_HOSTS.find((host) =>
    value.startsWith(`${host}/asset-files/`)
  )

  if (legacyHost) {
    const backendUrl = getBackendUrl()
    return backendUrl
      ? value.replace(legacyHost, backendUrl)
      : value.replace(legacyHost, "")
  }

  if (value.startsWith("/asset-files/")) {
    const backendUrl = getBackendUrl()

    return backendUrl ? `${backendUrl}${value}` : value
  }

  return value
}

const BrandLogo = ({
  className,
  imageClassName,
  name = clientProfile.brand.name,
  logoUrl,
}: BrandLogoProps) => {
  const [hasImageError, setHasImageError] = useState(false)
  const safeLogoUrl = !hasImageError ? normalizeLogoUrl(logoUrl) : undefined

  return (
    <span
      className={clx(
        "relative inline-flex items-center justify-center overflow-hidden rounded bg-transparent text-current",
        className
      )}
    >
      {safeLogoUrl ? (
        <img
          src={safeLogoUrl}
          alt={name}
          onError={() => setHasImageError(true)}
          className={clx("h-full w-full object-contain", imageClassName)}
        />
      ) : (
        <span className="text-[32px] font-semibold leading-none tracking-normal">
          {name}
        </span>
      )}
    </span>
  )
}

export default BrandLogo
