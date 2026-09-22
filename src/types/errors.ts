export type StorefrontErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "rate-limit"
  | "server"
  | "network"
  | "unknown"

export interface StorefrontError {
  kind: StorefrontErrorKind
  message: string
  status?: number
  code?: string
  retryable: boolean
  originalError?: unknown
}
