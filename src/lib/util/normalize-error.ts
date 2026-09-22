import { FetchError } from "@medusajs/js-sdk"
import { StorefrontError } from "@/types/errors"

type MedusaFetchError = FetchError & { status: number }

const isFetchError = (error: unknown): error is MedusaFetchError =>
  error instanceof Error &&
  "status" in error &&
  typeof (error as { status: unknown }).status === "number"

const isAbortError = (error: unknown): error is DOMException =>
  error instanceof DOMException && error.name === "AbortError"

// Node's fetch (undici) and the browser's fetch both throw a plain
// TypeError for DNS/connection failures — there is no FetchError involved
// because no HTTP response was ever received.
const isNetworkError = (error: unknown): error is TypeError =>
  error instanceof TypeError

const fromStatus = (
  status: number,
  message: string,
  code?: string
): StorefrontError => {
  if (status === 401) {
    return { kind: "unauthorized", message, status, code, retryable: false }
  }

  if (status === 403) {
    return { kind: "forbidden", message, status, code, retryable: false }
  }

  if (status === 404) {
    return { kind: "not-found", message, status, code, retryable: false }
  }

  if (status === 409) {
    return { kind: "conflict", message, status, code, retryable: true }
  }

  if (status === 400 || status === 422) {
    return { kind: "validation", message, status, code, retryable: false }
  }

  if (status === 429) {
    return { kind: "rate-limit", message, status, code, retryable: true }
  }

  if (status >= 500 && status <= 504) {
    return { kind: "server", message, status, code, retryable: true }
  }

  return { kind: "unknown", message, status, code, retryable: false }
}

/**
 * Converts any error thrown while talking to the Medusa backend into a
 * StorefrontError. This is the single place that classifies errors by
 * kind/retryability — it does not throw, log, or touch UI state.
 */
export const normalizeError = (error: unknown): StorefrontError => {
  if (isFetchError(error)) {
    return {
      ...fromStatus(error.status, error.message, error.statusText),
      originalError: error,
    }
  }

  if (isAbortError(error)) {
    return {
      kind: "network",
      message: "La operación tardó demasiado en responder.",
      retryable: true,
      originalError: error,
    }
  }

  if (isNetworkError(error)) {
    return {
      kind: "network",
      message: "No se pudo conectar con el servidor.",
      retryable: true,
      originalError: error,
    }
  }

  if (error instanceof Error) {
    return {
      kind: "unknown",
      message: error.message,
      retryable: false,
      originalError: error,
    }
  }

  return {
    kind: "unknown",
    message: "Ha ocurrido un error inesperado.",
    retryable: false,
    originalError: error,
  }
}
