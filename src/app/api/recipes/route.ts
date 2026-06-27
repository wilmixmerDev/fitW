import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  ingredients: z.array(z.object({
    foodItemId: z.string(),
    quantityGrams: z.number().positive(),
  })).min(1),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const recipes = await prisma.recipe.findMany({
    where: { profileId: profile.id },
    include: {
      ingredients: { include: { foodItem: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(recipes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const body = await req.json()
  const result = createSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const recipe = await prisma.recipe.create({
    data: {
      profileId: profile.id,
      name: result.data.name,
      ingredients: {
        create: result.data.ingredients.map((i) => ({
          foodItemId: i.foodItemId,
          quantityGrams: i.quantityGrams,
        })),
      },
    },
    include: { ingredients: { include: { foodItem: true } } },
  })

  return NextResponse.json(recipe, { status: 201 })
}
