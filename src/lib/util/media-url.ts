const backendUrl = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "https://b2b-novicell.medusajs.app"
).replace(/\/$/, "")

const legacyBackendHosts = [
  "https://ngs-medusa-backend.onrender.com",
  "http://ngs-medusa-backend.onrender.com",
  "http://localhost:9000",
  "http://127.0.0.1:9000",
]

export const normalizeMediaUrl = (url?: string | null) => {
  if (!url) {
    return url
  }

  if (
    url.startsWith("/static/") ||
    url.startsWith("/uploads/") ||
    url.startsWith("/asset-files/")
  ) {
    return `${backendUrl}${url}`
  }

  const legacyHost = legacyBackendHosts.find((host) =>
    url.startsWith(`${host}/asset-files/`)
  )

  if (legacyHost) {
    return url.replace(legacyHost, backendUrl)
  }

  return url
    .replace(/^http:\/\/localhost:9000(?=\/static\/)/, backendUrl)
    .replace(/^http:\/\/127\.0\.0\.1:9000(?=\/static\/)/, backendUrl)
}
