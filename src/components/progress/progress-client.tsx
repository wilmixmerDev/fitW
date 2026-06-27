"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scale, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import { useT } from "@/contexts/language-context"
import type { Profile } from "@/types"

interface Props {
  profile: Profile
  weightLogs: { date: string; weight: number }[]
  dailyCalories: { date: string; calories: number; protein: number }[]
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function ProgressClient({ profile, weightLogs, dailyCalories }: Props) {
  const t = useT()
  const [newWeight, setNewWeight] = useState("")
  const [saving, setSaving] = useState(false)
  const [weights, setWeights] = useState(weightLogs)

  const latestWeight = weights.at(-1)?.weight ?? profile.weight
  const firstWeight = weights.at(0)?.weight ?? profile.weight
  const weightChange = latestWeight - firstWeight

  async function handleWeightSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newWeight) return
    setSaving(true)
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: Number(newWeight) }),
      })
      if (!res.ok) throw new Error()
      const entry = await res.json()
      setWeights((prev) => {
        const dateStr = entry.date.split("T")[0]
        const filtered = prev.filter((w) => w.date !== dateStr)
        return [...filtered, { date: dateStr, weight: entry.weight }].sort((a, b) =>
          a.date.localeCompare(b.date)
        )
      })
      toast.success(t.progress.weightLogged)
      setNewWeight("")
    } catch {
      toast.error(t.progress.weightError)
    } finally {
      setSaving(false)
    }
  }

  const WeightIcon =
    weightChange < -0.2 ? TrendingDown : weightChange > 0.2 ? TrendingUp : Minus
  const weightColor =
    profile.goal === "lose_fat"
      ? weightChange < 0 ? "text-emerald-500" : "text-rose-500"
      : profile.goal === "gain_muscle"
      ? weightChange > 0 ? "text-emerald-500" : "text-rose-500"
      : "text-foreground"

  const tp = t.progress

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">{tp.title}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{tp.subtitle}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">{tp.current}</p>
            <p className="text-2xl font-bold">{latestWeight}<span className="text-sm font-normal text-muted-foreground ml-1">kg</span></p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">{tp.change30d}</p>
            <div className={`flex items-center gap-1 ${weightColor}`}>
              <WeightIcon className="w-4 h-4" />
              <p className="text-2xl font-bold">
                {weightChange >= 0 ? "+" : ""}{weightChange.toFixed(1)}
                <span className="text-sm font-normal ml-1">kg</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">{tp.daysLogged}</p>
            <p className="text-2xl font-bold">{dailyCalories.length}<span className="text-sm font-normal text-muted-foreground ml-1">d</span></p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              {tp.logWeight}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWeightSubmit} className="flex gap-3">
              <Input
                type="number"
                placeholder={String(latestWeight)}
                min={30} max={500} step={0.1}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-32"
              />
              <Button type="submit" disabled={!newWeight || saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {tp.save}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="weight">
          <TabsList className="mb-4">
            <TabsTrigger value="weight">{tp.tabs.weight}</TabsTrigger>
            <TabsTrigger value="calories">{tp.tabs.calories}</TabsTrigger>
            <TabsTrigger value="protein">{tp.tabs.protein}</TabsTrigger>
          </TabsList>

          <TabsContent value="weight">
            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">{tp.charts.weight}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {weights.length < 2 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm text-center px-4">
                    {tp.needMore}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={weights.map((w) => ({ ...w, date: formatDate(w.date) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/50" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}kg`} />
                      <Tooltip
                        contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                        formatter={(v) => [`${Number(v)} kg`, tp.tooltip.weight]}
                      />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calories">
            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">{tp.charts.calories}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {dailyCalories.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">{tp.noData}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dailyCalories.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/50" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip
                        contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                        formatter={(v) => [`${Number(v)} kcal`, tp.tooltip.calories]}
                      />
                      <ReferenceLine y={profile.targetCalories} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: tp.tooltip.target, fontSize: 11, fill: "hsl(var(--primary))" }} />
                      <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protein">
            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">{tp.charts.protein}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {dailyCalories.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">{tp.noData}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dailyCalories.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/50" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}g`} />
                      <Tooltip
                        contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                        formatter={(v) => [`${Number(v)}g`, tp.tooltip.protein]}
                      />
                      <ReferenceLine y={profile.targetProtein} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: tp.tooltip.target, fontSize: 11, fill: "#3b82f6" }} />
                      <Bar dataKey="protein" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
