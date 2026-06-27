import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })
  if (!profile) redirect("/onboarding")

  const dateStr = new Date().toISOString().split("T")[0]
  const todayDate = new Date(dateStr + "T00:00:00.000Z")

  const mealLogs = await prisma.mealLog.findMany({
    where: { profileId: profile.id, date: todayDate },
    include: {
      items: { include: { foodItem: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { mealType: "asc" },
  })

  const latestWeight = await prisma.weightLog.findFirst({
    where: { profileId: profile.id },
    orderBy: { date: "desc" },
  })

  return (
    <DashboardClient
      profile={profile}
      mealLogs={mealLogs}
      latestWeight={latestWeight?.weight ?? profile.weight}
      today={dateStr}
    />
  )
}
