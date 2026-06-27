"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalorieRing } from "./calorie-ring"
import { MacroBar } from "./macro-bar"
import { AddFoodDialog } from "@/components/food/add-food-dialog"
import { NeatDialog } from "./neat-dialog"
import {
  Scale, Plus, Target, Flame, ChevronRight,
  UtensilsCrossed, CheckCircle2, Circle
} from "lucide-react"
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
  const [addMealType, setAddMealType] = useState<string | null>(null)
  const [showNeat, setShowNeat] = useState(false)
  const [neatBonus, setNeatBonus] = useState(0)

  const totals = mealLogs.reduce(
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

  function handleFoodAdded() {
    setAddMealType(null)
    router.refresh()
  }

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? t.dashboard.greeting.morning
    : hour < 18 ? t.dashboard.greeting.afternoon
    : t.dashboard.greeting.evening

  const goalLabel = t.goals[profile.goal as keyof typeof t.goals] ?? profile.goal
  const mealLabels = t.log.meals

  // Compact meal summary: just total kcal per meal
  const mealSummary = MEAL_ORDER.map((mealType) => {
    const log = mealLogs.find((l) => l.mealType === mealType)
    const kcal = log?.items.reduce((s, i) => s + i.calories, 0) ?? 0
    return { mealType, label: mealLabels[mealType as keyof typeof mealLabels], kcal, logged: !!log && log.items.length > 0 }
  })

  const mealsLogged = mealSummary.filter((m) => m.logged).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}{profile.name ? `, ${profile.name}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date(today).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          <Target className="w-3 h-3 mr-1" />
          {goalLabel}
        </Badge>
      </motion.div>

      {/* Calorie Ring */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 pb-5">
            <CalorieRing
              consumed={Math.round(totals.calories)}
              target={profile.targetCalories}
              neatBonus={neatBonus}
            />
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowNeat(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50 rounded-full px-3 py-1.5"
              >
                <Flame className="w-3 h-3" />
                + Actividad extra
                {neatBonus > 0 && <span className="text-primary font-semibold ml-1">({neatBonus} kcal)</span>}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Macros */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.dashboard.macros}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MacroBar label="Proteína" consumed={totals.protein} target={profile.targetProtein} color="bg-blue-500" />
            <MacroBar label="Carbos"   consumed={totals.carbs}   target={profile.targetCarbs}   color="bg-amber-500" />
            <MacroBar label="Grasa"    consumed={totals.fat}     target={profile.targetFat}     color="bg-rose-500" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3">
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scale className="w-4 h-4 text-primary" />
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
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {String(profile.targetCalories).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
                </p>
                <p className="text-xs text-muted-foreground">{t.dashboard.dailyTarget}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Compact meals overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-primary" />
                Hoy
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {mealsLogged}/4 comidas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {mealSummary.map((meal) => (
              <div key={meal.mealType}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2.5">
                  {meal.logged
                    ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    : <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  }
                  <span className={`text-sm font-medium ${meal.logged ? "" : "text-muted-foreground"}`}>
                    {meal.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {meal.logged
                    ? <span className="text-sm font-semibold tabular-nums">{Math.round(meal.kcal)} kcal</span>
                    : <span className="text-xs text-muted-foreground">—</span>
                  }
                  <button
                    onClick={() => setAddMealType(meal.mealType)}
                    className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-1">
              <Link href="/log">
                <Button variant="outline" size="sm" className="w-full text-xs h-8">
                  Ver registro completo
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {addMealType && (
        <AddFoodDialog
          mealType={addMealType}
          date={today}
          onClose={() => setAddMealType(null)}
          onSuccess={handleFoodAdded}
        />
      )}

      {showNeat && (
        <NeatDialog
          onClose={() => setShowNeat(false)}
          onAdd={(kcal) => setNeatBonus((prev) => prev + kcal)}
        />
      )}
    </div>
  )
}
