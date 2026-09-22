"use server"

import { sdk } from "@/lib/config"
import handleMedusaError from "@/lib/util/handle-medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async (): Promise<HttpTypes.StoreRegion[]> => {
  const next = {
    ...(await getCacheOptions("regions")),
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
    })
    .then(({ regions }: { regions: HttpTypes.StoreRegion[] }) => regions)
    .catch(handleMedusaError)
}

export const retrieveRegion = async (
  id: string
): Promise<HttpTypes.StoreRegion> => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
    })
    .then(({ region }: { region: HttpTypes.StoreRegion }) => region)
    .catch(handleMedusaError)
}

// Previously cached regions in a module-level Map that lived for the whole
// process and never respected revalidateTag. listRegions() is already
// cached by Next.js (tag-based, via getCacheOptions), so a cache hit here
// costs no network round-trip and does respect revalidation.
export const getRegion = async (
  countryCode: string
): Promise<HttpTypes.StoreRegion | null> => {
  try {
    const regions = await listRegions()

    if (!regions) {
      return null
    }

    const regionByCountryCode = new Map<string, HttpTypes.StoreRegion>()
    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionByCountryCode.set(c?.iso_2 ?? "", region)
      })
    })

    const region = countryCode
      ? regionByCountryCode.get(countryCode)
      : regionByCountryCode.get("us")

    return region ?? null
  } catch (e: any) {
    return null
  }
}
