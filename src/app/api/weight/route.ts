import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const weightSchema = z.object({
  weight: z.number().min(20).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get("days") ?? "30")
  const since = new Date()
  since.setDate(since.getDate() - days)

  const logs = await prisma.weightLog.findMany({
    where: { profileId: profile.id, date: { gte: since } },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(logs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const body = await req.json()
  const result = weightSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const dateStr = result.data.date ?? new Date().toISOString().split("T")[0]
  const date = new Date(dateStr + "T00:00:00.000Z")

  const log = await prisma.weightLog.upsert({
    where: { profileId_date: { profileId: profile.id, date } },
    create: { profileId: profile.id, date, weight: result.data.weight },
    update: { weight: result.data.weight },
  })

  await prisma.profile.update({
    where: { id: profile.id },
    data: { weight: result.data.weight },
  })

  return NextResponse.json(log, { status: 201 })
}
