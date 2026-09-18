"use client"

import Login from "@/modules/account/components/login"
import Register from "@/modules/account/components/register"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"
import { useEffect, useState } from "react"

export enum LOGIN_VIEW {
  LOG_IN = "log-in",
  REGISTER = "register",
}

const LoginTemplate = ({ regions }: { regions: HttpTypes.StoreRegion[] }) => {
  const route = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { countryCode } = useParams<{ countryCode: string }>()
  const redirectTo = searchParams.get("redirect_to")

  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(() => {
    const viewFromUrl = searchParams.get("view") as LOGIN_VIEW
    return viewFromUrl && Object.values(LOGIN_VIEW).includes(viewFromUrl)
      ? viewFromUrl
      : LOGIN_VIEW.LOG_IN
  })

  useEffect(() => {
    if (searchParams.has("view")) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("view")
      router.replace(
        `${route}${newParams.toString() ? `?${newParams.toString()}` : ""}`,
        { scroll: false }
      )
    }
  }, [searchParams, route, router])

  useEffect(() => {
    const image = new window.Image()
    image.src = "/account-block.png"
    image.onload = () => {
      setImageLoaded(true)
    }
  }, [])

  const updateView = (view: LOGIN_VIEW) => {
    setCurrentView(view)
    const nextParams = new URLSearchParams()

    nextParams.set("view", view)

    if (redirectTo) {
      nextParams.set("redirect_to", redirectTo)
    }

    router.push(`/${countryCode}/account?${nextParams.toString()}`)
  }

  const isRegisterView = currentView === LOGIN_VIEW.REGISTER

  return (
    <div
      className={clx(
        "grid grid-cols-1 gap-2 m-2 min-h-[80vh]",
        isRegisterView ? "small:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]" : "small:grid-cols-2"
      )}
    >
      <div
        className={clx(
          "flex justify-center items-center bg-neutral-100 p-6 h-full",
          isRegisterView ? "small:p-10" : "small:p-0"
        )}
      >
        {currentView === LOGIN_VIEW.LOG_IN ? (
          <Login
            setCurrentView={updateView}
            countryCode={countryCode}
            redirectTo={redirectTo}
          />
        ) : (
          <Register
            setCurrentView={updateView}
            regions={regions}
            countryCode={countryCode}
          />
        )}
      </div>

      <div className="relative">
        <Image
          src="/account-block.png"
          alt="Imagen de acceso al portal B2B"
          className={clx(
            "object-cover transition-opacity duration-300 w-full h-full",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          fill
          quality={100}
          priority
        />
      </div>
    </div>
  )
}

export default LoginTemplate
