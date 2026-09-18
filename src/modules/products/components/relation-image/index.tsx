"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

type RelationImageProps = {
  src?: string
  fallbackSrc?: string
  alt: string
  sizes: string
  className?: string
}

const RelationImage = ({
  src,
  fallbackSrc,
  alt,
  sizes,
  className,
}: RelationImageProps) => {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc)

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc)
  }, [fallbackSrc, src])

  if (!currentSrc) {
    return null
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc)
          return
        }

        setCurrentSrc(undefined)
      }}
    />
  )
}

export default RelationImage
