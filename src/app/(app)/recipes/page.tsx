import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { RecipesClient } from "@/components/recipes/recipes-client"

export default async function RecipesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) redirect("/onboarding")

  const recipes = await prisma.recipe.findMany({
    where: { profileId: profile.id },
    include: { ingredients: { include: { foodItem: true } } },
    orderBy: { updatedAt: "desc" },
  })

  return <RecipesClient initialRecipes={recipes as any} />
}
