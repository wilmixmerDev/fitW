import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProgressClient } from "@/components/progress/progress-client"

export const dynamic = "force-dynamic"

export default async function ProgressPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })
  if (!profile) redirect("/onboarding")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const weightLogs = await prisma.weightLog.findMany({
    where: { profileId: profile.id, date: { gte: thirtyDaysAgo } },
    orderBy: { date: "asc" },
  })

  const mealLogs = await prisma.mealLog.findMany({
    where: { profileId: profile.id, date: { gte: thirtyDaysAgo } },
    include: { items: true },
    orderBy: { date: "asc" },
  })

  const dailyMap = new Map<string, { calories: number; protein: number }>()
  for (const log of mealLogs) {
    const key = log.date.toISOString().split("T")[0]
    const existing = dailyMap.get(key) ?? { calories: 0, protein: 0 }
    for (const item of log.items) {
      existing.calories += item.calories
      existing.protein += item.protein
    }
    dailyMap.set(key, existing)
  }

  return (
    <ProgressClient
      profile={profile}
      weightLogs={weightLogs.map((w: { date: Date; weight: number }) => ({
        date: w.date.toISOString().split("T")[0],
        weight: w.weight,
      }))}
      dailyCalories={Array.from(dailyMap.entries()).map(([date, v]) => ({
        date,
        calories: Math.round(v.calories),
        protein: Math.round(v.protein),
      }))}
    />
  )
}
