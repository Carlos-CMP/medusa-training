import { normalizeError } from "@/lib/util/normalize-error"
import { StorefrontErrorKind } from "@/types/errors"

const MESSAGE_BY_KIND: Record<StorefrontErrorKind, string> = {
  validation: "Revisa los datos introducidos.",
  unauthorized: "Tu sesión ha caducado. Inicia sesión de nuevo.",
  forbidden: "No tienes permiso para realizar esta acción.",
  "not-found": "No se ha encontrado el recurso solicitado.",
  conflict: "Esto se acaba de modificar. Vuelve a intentarlo.",
  "rate-limit": "Demasiadas solicitudes seguidas. Espera un momento y vuelve a intentarlo.",
  server: "Ha ocurrido un error en el servidor. Vuelve a intentarlo en unos minutos.",
  network: "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
  unknown: "Ha ocurrido un error inesperado.",
}

/**
 * Turns any error into a safe, user-facing message (Spanish, generic
 * enough to never leak internals) and logs the technical detail
 * separately — Fase 6: "mensaje técnico → logs, mensaje funcional → UI".
 * `fallback` overrides the default message for a specific kind (e.g. a
 * business-specific message like "cart is pending approval").
 */
export const describeStorefrontError = (
  error: unknown,
  context: string,
  fallback?: Partial<Record<StorefrontErrorKind, string>>
): string => {
  const normalized = normalizeError(error)

  console.error(`[${context}]`, normalized.message, normalized.originalError ?? normalized)

  return fallback?.[normalized.kind] ?? MESSAGE_BY_KIND[normalized.kind]
}
