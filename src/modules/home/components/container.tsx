import { clx } from "@medusajs/ui"
import { ReactNode } from "react"

export function Container({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clx("content-container mx-auto w-full", className)}>
      {children}
    </div>
  )
}
