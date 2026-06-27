import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LogClient } from "@/components/food/log-client"

export const dynamic = "force-dynamic"

export default async function LogPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })
  if (!profile) redirect("/onboarding")

  return <LogClient profile={profile} />
}
