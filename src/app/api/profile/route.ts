import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateTargets } from "@/lib/calculations"
import type { OnboardingData } from "@/types"

const profileSchema = z.object({
  name: z.string().optional(),
  age: z.number().min(15).max(100),
  sex: z.enum(["male", "female"]),
  weight: z.number().min(30).max(300),
  height: z.number().min(100).max(250),
  goal: z.enum(["lose_fat", "gain_muscle", "maintain", "recomposition"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  trainingYears: z.number().min(0),
  weeklyWorkouts: z.number().min(0).max(7),
  muscleMass: z.enum(["very_little", "little", "normal", "quite_a_bit", "a_lot"]),
  fatLevel: z.enum(["very_little", "little", "normal", "quite_a_bit", "a_lot"]),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const result = profileSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const targets = calculateTargets(result.data as OnboardingData)

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...result.data, ...targets },
    update: { ...result.data, ...targets },
  })

  return NextResponse.json(profile)
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  return NextResponse.json(profile)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const partial = profileSchema.partial().safeParse(body)
  if (!partial.success) {
    return NextResponse.json({ error: partial.error.issues[0].message }, { status: 400 })
  }

  const existing = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const merged = { ...existing, ...partial.data }
  const targets = calculateTargets(merged as OnboardingData)

  const updated = await prisma.profile.update({
    where: { userId: session.user.id },
    data: { ...partial.data, ...targets },
  })

  return NextResponse.json(updated)
}
