import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/layout/sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })
  if (!profile) redirect("/onboarding")

  return (
    <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
  )
}
