"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalorieRing } from "./calorie-ring"
import { MacroBar } from "./macro-bar"
import { AddFoodDialog } from "@/components/food/add-food-dialog"
import { Separator } from "@/components/ui/separator"
import { Scale, Plus, Trash2, Target } from "lucide-react"
import { useT } from "@/contexts/language-context"
import type { Profile, DBMealLog as MealLogWithItems } from "@/types"

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"]

interface Props {
  profile: Profile
  mealLogs: MealLogWithItems[]
  latestWeight: number
  today: string
}

export function DashboardClient({ profile, mealLogs, latestWeight, today }: Props) {
  const t = useT()
  const router = useRouter()
  const [logs, setLogs] = useState(mealLogs)
  const [addMealType, setAddMealType] = useState<string | null>(null)

  const totals = logs.reduce(
    (acc, log) => {
      log.items.forEach((item) => {
        acc.calories += item.calories
        acc.protein += item.protein
        acc.carbs += item.carbs
        acc.fat += item.fat
      })
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  async function handleDelete(itemId: string) {
    try {
      const res = await fetch(`/api/meals/${itemId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setLogs((prev) =>
        prev
          .map((log) => ({ ...log, items: log.items.filter((i) => i.id !== itemId) }))
          .filter((log) => log.items.length > 0)
      )
      toast.success(t.dashboard.foodRemoved)
    } catch {
      toast.error(t.dashboard.foodRemoveError)
    }
  }

  function handleFoodAdded() {
    setAddMealType(null)
    router.refresh()
  }

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? t.dashboard.greeting.morning
    : hour < 18 ? t.dashboard.greeting.afternoon
    : t.dashboard.greeting.evening

  const mealLabels = t.log.meals
  const goalLabel = t.goals[profile.goal as keyof typeof t.goals] ?? profile.goal

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}{profile.name ? `, ${profile.name}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date(today).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Target className="w-3 h-3 mr-1" />
          {goalLabel}
        </Badge>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 pb-6">
            <CalorieRing consumed={Math.round(totals.calories)} target={profile.targetCalories} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.dashboard.macros}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <MacroBar label={t.progress.tooltip.protein} consumed={totals.protein} target={profile.targetProtein} color="bg-blue-500" />
            <MacroBar label="Carbs" consumed={totals.carbs} target={profile.targetCarbs} color="bg-amber-500" />
            <MacroBar label={t.progress.tabs.protein.slice(0, 3)} consumed={totals.fat} target={profile.targetFat} color="bg-rose-500" />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-2 gap-3">
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scale className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{latestWeight}<span className="text-sm font-normal text-muted-foreground ml-1">kg</span></p>
                <p className="text-xs text-muted-foreground">{t.dashboard.currentWeight}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{String(profile.targetCalories).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}<span className="text-sm font-normal text-muted-foreground ml-1">kcal</span></p>
                <p className="text-xs text-muted-foreground">{t.dashboard.dailyTarget}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t.dashboard.todayMeals}</h2>
          <Button size="sm" onClick={() => setAddMealType("snack")}>
            <Plus className="w-4 h-4 mr-1" />
            {t.dashboard.addFood}
          </Button>
        </div>

        <div className="space-y-3">
          {MEAL_ORDER.map((mealType) => {
            const log = logs.find((l) => l.mealType === mealType)
            const mealTotal = log?.items.reduce(
              (acc, i) => ({ cal: acc.cal + i.calories, p: acc.p + i.protein }),
              { cal: 0, p: 0 }
            ) ?? { cal: 0, p: 0 }
            const label = mealLabels[mealType as keyof typeof mealLabels]

            return (
              <Card key={mealType} className="shadow-sm border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{label}</span>
                      {log && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(mealTotal.cal)} kcal
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAddMealType(mealType)}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {t.dashboard.addFood}
                    </Button>
                  </div>

                  {log && log.items.length > 0 ? (
                    <div className="space-y-2">
                      {log.items.map((item, i) => (
                        <div key={item.id}>
                          {i > 0 && <Separator className="my-2" />}
                          <div className="flex items-center justify-between group">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.foodItem.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity}g · {Math.round(item.calories)} kcal · {item.protein.toFixed(1)}g P
                              </p>
                            </div>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 text-muted-foreground hover:text-destructive rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-1">{t.dashboard.noFoods}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>

      {addMealType && (
        <AddFoodDialog
          mealType={addMealType}
          date={today}
          onClose={() => setAddMealType(null)}
          onSuccess={handleFoodAdded}
        />
      )}
    </div>
  )
}
