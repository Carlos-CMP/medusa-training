import { NextRequest, NextResponse } from "next/server"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
const SUPPORTED_COUNTRY_CODES = (
  process.env.NEXT_PUBLIC_SUPPORTED_COUNTRY_CODES || "es,fr,de,dk,se,gb,it"
)
  .split(",")
  .map((code) => code.trim().toLowerCase())
  .filter(Boolean)

/**
 * Selects a storefront country code without calling Medusa from middleware.
 * Render free tier can cold-start for longer than Vercel's middleware budget,
 * so the dynamic region lookup is intentionally avoided here.
 * @param request
 */
function getCountryCode(request: NextRequest) {
  try {
    let countryCode

    const vercelCountryCode = (
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry")
    )?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && SUPPORTED_COUNTRY_CODES.includes(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (
      vercelCountryCode &&
      SUPPORTED_COUNTRY_CODES.includes(vercelCountryCode)
    ) {
      countryCode = vercelCountryCode
    } else if (SUPPORTED_COUNTRY_CODES.includes(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (SUPPORTED_COUNTRY_CODES[0]) {
      countryCode = SUPPORTED_COUNTRY_CODES[0]
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Check NEXT_PUBLIC_SUPPORTED_COUNTRY_CODES and NEXT_PUBLIC_DEFAULT_REGION."
      )
    }
  }
}

async function setCacheId(request: NextRequest, response: NextResponse) {
  const cacheId = request.nextUrl.searchParams.get("_medusa_cache_id")

  if (cacheId) {
    return cacheId
  }

  const newCacheId = crypto.randomUUID()
  response.cookies.set("_medusa_cache_id", newCacheId, { maxAge: 60 * 60 * 24 })
  return newCacheId
}

/**
 * Middleware to handle region selection and cache id.
 */
export async function middleware(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const cartId = searchParams.get("cart_id")
  const checkoutStep = searchParams.get("step")
  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cartIdCookie = request.cookies.get("_medusa_cart_id")

  let redirectUrl = request.nextUrl.href

  let response = NextResponse.next()

  // Set a cache id to invalidate the cache for this instance only
  await setCacheId(request, response)

  const countryCode = getCountryCode(request)

  const urlHasCountryCode =
    countryCode && request.nextUrl.pathname.split("/")[1].includes(countryCode)

  if (urlHasCountryCode && countryCode) {
    const accountRoot = `/${countryCode}/account`
    const isProtectedAccountPath =
      request.nextUrl.pathname.startsWith(`${accountRoot}/`)
    const hasAuthToken = Boolean(request.cookies.get("_medusa_jwt")?.value)

    if (isProtectedAccountPath && !hasAuthToken) {
      const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search}`
      const loginUrl = request.nextUrl.clone()

      loginUrl.pathname = accountRoot
      loginUrl.search = ""
      loginUrl.searchParams.set("redirect_to", redirectTo)

      return NextResponse.redirect(loginUrl, 307)
    }
  }

  // check if one of the country codes is in the url
  if (urlHasCountryCode && (!cartId || cartIdCookie)) {
    return response
  }

  // check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  // If no country code is set, we redirect to the relevant region.
  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
  }

  // If a cart_id is in the params, we set it as a cookie and redirect to the address step.
  if (cartId && !checkoutStep) {
    redirectUrl = `${redirectUrl}&step=address`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
    response.cookies.set("_medusa_cart_id", cartId, { maxAge: 60 * 60 * 24 })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
