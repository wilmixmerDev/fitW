import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateMacrosForQuantity } from "@/lib/calculations"

const addItemSchema = z.object({
  foodItemId: z.string(),
  quantity: z.number().positive(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date") ?? new Date().toISOString().split("T")[0]
  const date = new Date(dateStr + "T00:00:00.000Z")

  const logs = await prisma.mealLog.findMany({
    where: { profileId: profile.id, date },
    include: {
      items: { include: { foodItem: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { mealType: "asc" },
  })

  return NextResponse.json(logs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const body = await req.json()
  const result = addItemSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { foodItemId, quantity, mealType, date: dateStr } = result.data
  const date = new Date(dateStr + "T00:00:00.000Z")

  const foodItem = await prisma.foodItem.findUnique({ where: { id: foodItemId } })
  if (!foodItem) return NextResponse.json({ error: "Food not found" }, { status: 404 })

  const macros = calculateMacrosForQuantity(foodItem, quantity)

  const existing = await prisma.mealLog.findFirst({
    where: { profileId: profile.id, date, mealType },
  })

  const mealLog = existing
    ? existing
    : await prisma.mealLog.create({
        data: { profileId: profile.id, date, mealType },
      })

  const item = await prisma.mealLogItem.create({
    data: { mealLogId: mealLog.id, foodItemId, quantity, ...macros },
    include: { foodItem: true },
  })

  return NextResponse.json(item, { status: 201 })
}
