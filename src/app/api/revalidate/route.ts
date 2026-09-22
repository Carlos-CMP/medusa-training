import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

// Only tags that are global (getGlobalCacheOptions), not per-visitor
// (getCacheOptions) — revalidating a per-visitor tag here would be a
// no-op, since this route has no way to know every visitor's
// _medusa_cache_id. See src/lib/data/cookies.ts.
const REVALIDATABLE_TAGS = ["products"]

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")
  const tag = request.nextUrl.searchParams.get("tag")

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
  }

  if (!tag || !REVALIDATABLE_TAGS.includes(tag)) {
    return NextResponse.json(
      { message: `tag must be one of: ${REVALIDATABLE_TAGS.join(", ")}` },
      { status: 400 }
    )
  }

  revalidateTag(tag)

  return NextResponse.json({ revalidated: true, tag, now: Date.now() })
}
