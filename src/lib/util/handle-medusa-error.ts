import { normalizeError } from "@/lib/util/normalize-error"
import { StorefrontError } from "@/types/errors"

/**
 * Thrown by handleMedusaError. Carries the classified StorefrontError
 * (kind/retryable/status) alongside a normal Error, so existing
 * `.catch(handleMedusaError)` call sites keep throwing (same control flow
 * as the old medusa-error.ts), while callers that need to branch on the
 * error kind can do `error instanceof StorefrontErrorException` and read
 * `error.storefrontError`.
 */
export class StorefrontErrorException extends Error {
  readonly storefrontError: StorefrontError

  constructor(storefrontError: StorefrontError) {
    super(storefrontError.message)
    this.name = "StorefrontErrorException"
    this.storefrontError = storefrontError
  }
}

/**
 * Replaces the old medusa-error.ts, which assumed axios-shaped errors
 * (error.response/error.request/error.config). The Medusa JS SDK actually
 * throws FetchError (message/statusText/status only), so every call site
 * using the old helper always fell into its generic "Error setting up the
 * request" branch. See docs/hallazgos-frontend-backend.md, "Gestión de
 * errores".
 */
export default function handleMedusaError(error: unknown): never {
  throw new StorefrontErrorException(normalizeError(error))
}
