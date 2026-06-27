import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cookedWeight: z.number().positive().nullable().optional(),
})

async function getOwnedRecipe(id: string, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) return null
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: { include: { foodItem: true } } },
  })
  if (!recipe || recipe.profileId !== profile.id) return null
  return recipe
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const recipe = await getOwnedRecipe(id, session.user.id)
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(recipe)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const recipe = await getOwnedRecipe(id, session.user.id)
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const result = patchSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const updated = await prisma.recipe.update({
    where: { id },
    data: result.data,
    include: { ingredients: { include: { foodItem: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const recipe = await getOwnedRecipe(id, session.user.id)
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.recipe.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
