import { retrieveBrandProfile } from "@/lib/data/brand-profile"
import { listRegions } from "@/lib/data/regions"
import LoginTemplate from "@/modules/account/templates/login-template"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const profile = await retrieveBrandProfile()

  return {
    title: "Iniciar sesión",
    description: `Accede a tu cuenta B2B ${profile.brand.name}.`,
  }
}

export default async function Login() {
  const regions = await listRegions()

  return <LoginTemplate regions={regions} />
}
