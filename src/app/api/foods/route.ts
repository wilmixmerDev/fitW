import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50)

  const foods = await prisma.foodItem.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: [{ isVerified: "desc" }, { name: "asc" }],
    take: limit,
    select: {
      id: true, name: true, brand: true, calories: true,
      protein: true, carbs: true, fat: true, fiber: true,
      servingSize: true, servingName: true,
    },
  })

  return NextResponse.json(foods)
}
