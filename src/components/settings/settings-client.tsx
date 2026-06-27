"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Target, Scale, LogOut, Languages } from "lucide-react"
import { useT, useLang, type Lang } from "@/contexts/language-context"
import type { Profile } from "@/types"

export function SettingsClient({ profile, userEmail }: { profile: Profile; userEmail: string }) {
  const t = useT()
  const { lang, setLang, langNames, allLangs } = useLang()
  const router = useRouter()
  const [weight, setWeight] = useState(String(profile.weight))
  const [name, setName] = useState(profile.name ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, weight: Number(weight) }),
      })
      if (!res.ok) throw new Error()
      toast.success(t.settings.saved)
      router.refresh()
    } catch {
      toast.error(t.settings.saveError)
    } finally {
      setSaving(false)
    }
  }

  const ts = t.settings
  const goalLabel = t.goals[profile.goal as keyof typeof t.goals] ?? profile.goal
  const activityLabel = t.activity[profile.activityLevel as keyof typeof t.activity] ?? profile.activityLevel

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">{ts.title}</h1>
      </motion.div>

      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" />
              {ts.language}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {allLangs.map((l) => (
                <Button
                  key={l}
                  variant={lang === l ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLang(l as Lang)}
                >
                  {langNames[l as Lang]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {ts.account}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {ts.signedInAs} <span className="text-foreground font-medium">{userEmail}</span>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Body data */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              {ts.body}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>{ts.name}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={ts.namePlaceholder} />
              </div>
              <div className="space-y-2">
                <Label>{ts.weight}</Label>
                <Input type="number" step="0.1" min={30} max={500} value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {ts.save}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Goals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              {ts.goals}
            </CardTitle>
            <CardDescription>{ts.goalsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{ts.goalLabel}</span>
              <Badge variant="secondary">{goalLabel}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{ts.activityLabel}</span>
              <span className="font-medium">{activityLabel}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 pt-1">
              {[
                { label: "Calorías", value: `${profile.targetCalories} kcal` },
                { label: "Proteína", value: `${profile.targetProtein}g` },
                { label: "Carbos", value: `${profile.targetCarbs}g` },
                { label: "Grasa", value: `${profile.targetFat}g` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-base font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => router.push("/onboarding")}>
              {ts.recalculate}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sign out */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="shadow-sm border-border/60 border-destructive/20">
          <CardContent className="pt-5 pb-5">
            <Button variant="destructive" className="w-full" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-4 h-4 mr-2" />
              {ts.signOut}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
