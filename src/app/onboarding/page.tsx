import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import OnboardingForm from "@/components/onboarding/onboarding-form"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })
  if (profile) redirect("/dashboard")

  return (
    <OnboardingForm
      userId={session.user.id}
      userEmail={session.user.email ?? ""}
    />
  )
}
