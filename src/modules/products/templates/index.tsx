import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@/modules/products/components/image-gallery"
import ProductActions from "@/modules/products/components/product-actions"
import ProductTabs from "@/modules/products/components/product-tabs"
import RelatedProducts from "@/modules/products/components/related-products"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import React, { Suspense } from "react"
import ProductActionsWrapper from "./product-actions-wrapper"
import { ProductBenefitsBar } from "../components/product-benefits-bar"
import { ProductBreadcrumbs } from "../components/product-breadcrumbs"
import { ProductSupportPanels } from "../components/product-support-panels"
import { ClientProfile } from "@/lib/client-profile"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  profile?: ClientProfile
  canViewPrices?: boolean
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  profile,
  canViewPrices = false,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="flex flex-col bg-white">
      <ProductBenefitsBar profile={profile} />
      <ProductBreadcrumbs product={product} />
      <div
        className="content-container grid grid-cols-1 gap-6 pb-8 medium:grid-cols-[minmax(0,0.54fr)_minmax(430px,0.46fr)] large:gap-8"
        data-testid="product-container"
      >
        <ImageGallery product={product} />
        <div className="flex h-fit w-full flex-col items-start gap-5 rounded-lg bg-neutral-50 p-4 small:p-5 medium:sticky medium:top-24">
          <ProductInfo
            product={product}
            profile={profile}
            canViewPrices={canViewPrices}
          />
          <Suspense
            fallback={
              <ProductActions
                product={product}
                region={region}
                canViewPrices={canViewPrices}
              />
            }
          >
            <ProductActionsWrapper
              id={product.id}
              region={region}
              canViewPrices={canViewPrices}
            />
          </Suspense>
        </div>
      </div>
      <div className="content-container">
        <ProductTabs product={product} profile={profile} />
      </div>
      <div
        className="content-container"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts
            product={product}
            countryCode={countryCode}
            profile={profile}
            canViewPrices={canViewPrices}
          />
        </Suspense>
      </div>
      <ProductSupportPanels profile={profile} />
    </div>
  )
}

export default ProductTemplate
