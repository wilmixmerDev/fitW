import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const serveSchema = z.object({
  portionWeight: z.number().positive(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const { id } = await params
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: { include: { foodItem: true } } },
  })
  if (!recipe || recipe.profileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!recipe.cookedWeight || recipe.cookedWeight <= 0) {
    return NextResponse.json({ error: "Set the total cooked weight first" }, { status: 400 })
  }

  const body = await req.json()
  const result = serveSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  // Total raw macros for all ingredients
  const totalRaw = recipe.ingredients.reduce(
    (acc, ing) => {
      const ratio = ing.quantityGrams / 100
      return {
        calories: acc.calories + ing.foodItem.calories * ratio,
        protein:  acc.protein  + ing.foodItem.protein  * ratio,
        carbs:    acc.carbs    + ing.foodItem.carbs    * ratio,
        fat:      acc.fat      + ing.foodItem.fat      * ratio,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Portion = (portionWeight / cookedWeight) × total raw macros
  const portionRatio = result.data.portionWeight / recipe.cookedWeight
  const macros = {
    calories: Math.round(totalRaw.calories * portionRatio * 10) / 10,
    protein:  Math.round(totalRaw.protein  * portionRatio * 10) / 10,
    carbs:    Math.round(totalRaw.carbs    * portionRatio * 10) / 10,
    fat:      Math.round(totalRaw.fat      * portionRatio * 10) / 10,
  }

  const date = new Date(result.data.date + "T00:00:00.000Z")

  // Find or create the meal log for this date + meal type
  const existing = await prisma.mealLog.findFirst({
    where: { profileId: profile.id, date, mealType: result.data.mealType },
  })
  const mealLog = existing ?? await prisma.mealLog.create({
    data: { profileId: profile.id, date, mealType: result.data.mealType },
  })

  // Use a placeholder food item approach: log against the first ingredient
  // but override macros with the calculated portion values
  // We use a virtual food entry via direct MealLogItem creation
  // Since MealLogItem requires a foodItemId, we use the recipe's first ingredient's food
  // and store the portion weight as quantity but override macros
  const firstIngredient = recipe.ingredients[0]
  const item = await prisma.mealLogItem.create({
    data: {
      mealLogId: mealLog.id,
      foodItemId: firstIngredient.foodItemId,
      quantity: result.data.portionWeight,
      ...macros,
    },
    include: { foodItem: true },
  })

  // Override food item name with recipe name for display
  return NextResponse.json({
    ...item,
    foodItem: { ...item.foodItem, name: `🍲 ${recipe.name}` },
  }, { status: 201 })
}
