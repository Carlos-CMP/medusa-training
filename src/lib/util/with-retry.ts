import { normalizeError } from "@/lib/util/normalize-error"

type WithRetryOptions = {
  /** Default 2 — total attempts is maxRetries + 1. */
  maxRetries?: number
  /** Override the normalizer's retryable classification for this call site. */
  isRetryable?: (error: unknown) => boolean
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const backoffWithJitter = (attempt: number) => {
  const base = 300 * 2 ** (attempt - 1) // 300ms, 600ms, 1200ms...
  const jitter = Math.random() * base * 0.3
  return base + jitter
}

/**
 * Retries a Medusa SDK call with exponential backoff + jitter. Lives inside
 * Server Actions — the client never knows a retry happened, it only sees
 * the final result. Never wrap non-idempotent mutations (payments, orders,
 * coupon redemption) without first verifying the operation is safe to
 * repeat; see docs/control de errores/sistema-errores-plan.md, Fase 9.
 *
 * The Medusa JS SDK's FetchError does not expose response headers, so
 * `Retry-After` on 429s cannot be read here — this always falls back to
 * backoff + jitter.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  { maxRetries = 2, isRetryable }: WithRetryOptions = {}
): Promise<T> => {
  let attempt = 0

  while (true) {
    try {
      return await fn()
    } catch (error) {
      attempt += 1

      const retryable = isRetryable
        ? isRetryable(error)
        : normalizeError(error).retryable

      if (!retryable || attempt > maxRetries) {
        throw error
      }

      await sleep(backoffWithJitter(attempt))
    }
  }
}
