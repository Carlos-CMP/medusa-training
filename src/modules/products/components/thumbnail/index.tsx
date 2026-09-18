"use client"

import { clx } from "@medusajs/ui"
import Image from "next/image"
import React, { useEffect, useState } from "react"

import { normalizeMediaUrl } from "@/lib/util/media-url"
import PlaceholderImage from "@/modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  fallbackSrc?: string
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  type?: "preview" | "full"
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  fallbackSrc,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
  type,
}) => {
  const initialImage = normalizeMediaUrl(thumbnail || images?.[0]?.url)
  const [currentImage, setCurrentImage] = useState<string | undefined>(
    initialImage || fallbackSrc
  )

  useEffect(() => {
    setCurrentImage(initialImage || fallbackSrc)
  }, [fallbackSrc, initialImage])

  return (
    <div
      className={clx("relative w-full overflow-hidden", className, {
        "aspect-[11/14]": isFeatured,
        "aspect-[9/16]": !isFeatured && size !== "square",
        "aspect-[1/1]": size === "square",
        "w-[180px]": size === "small",
        "w-[290px]": size === "medium",
        "w-[440px]": size === "large",
        "w-full": size === "full",
      })}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder
        image={currentImage}
        size={size}
        type={type}
        onError={() => {
          if (fallbackSrc && currentImage !== fallbackSrc) {
            setCurrentImage(fallbackSrc)
            return
          }

          setCurrentImage(undefined)
        }}
      />
    </div>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  type,
  onError,
}: Pick<ThumbnailProps, "size" | "type"> & {
  image?: string
  onError?: () => void
}) => {
  return image ? (
    <Image
      src={image}
      alt="Thumbnail"
      className={clx("absolute inset-0 object-contain", {
        "p-4": type === "full",
        "p-2": type === "preview",
      })}
      draggable={false}
      quality={50}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      fill
      onError={onError}
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail
