import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const item = await prisma.mealLogItem.findUnique({
    where: { id },
    include: { mealLog: true },
  })

  if (!item || item.mealLog.profileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.mealLogItem.delete({ where: { id } })

  const remaining = await prisma.mealLogItem.count({ where: { mealLogId: item.mealLogId } })
  if (remaining === 0) {
    await prisma.mealLog.delete({ where: { id: item.mealLogId } })
  }

  return NextResponse.json({ success: true })
}
