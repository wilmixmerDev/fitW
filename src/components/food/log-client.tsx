"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AddFoodDialog } from "./add-food-dialog"
import { CalorieRing } from "@/components/dashboard/calorie-ring"
import { MacroBar } from "@/components/dashboard/macro-bar"
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useT } from "@/contexts/language-context"
import type { Profile } from "@/types"

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"]

function dateToISO(d: Date) {
  return d.toISOString().split("T")[0]
}
function addDays(d: Date, n: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export function LogClient({ profile }: { profile: Profile }) {
  const t = useT()
  const [date, setDate] = useState(new Date())
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addMealType, setAddMealType] = useState<string | null>(null)

  const dateStr = dateToISO(date)
  const isToday = dateStr === dateToISO(new Date())

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      try {
        const res = await fetch(`/api/meals?date=${dateStr}`)
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      } catch {
        toast.error(t.log.loadError)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [dateStr, t])

  const totals = logs.reduce(
    (acc: any, log: any) => {
      log.items?.forEach((item: any) => {
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
      await fetch(`/api/meals/${itemId}`, { method: "DELETE" })
      setLogs((prev: any[]) =>
        prev
          .map((l: any) => ({ ...l, items: l.items.filter((i: any) => i.id !== itemId) }))
          .filter((l: any) => l.items.length > 0)
      )
      toast.success("✓")
    } catch {
      toast.error(t.log.loadError)
    }
  }

  function handleFoodAdded() {
    setAddMealType(null)
    fetch(`/api/meals?date=${dateStr}`)
      .then((r) => r.json())
      .then((d) => setLogs(Array.isArray(d) ? d : []))
  }

  const mealLabels = t.log.meals

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.log.title}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate((d) => addDays(d, -1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium w-32 text-center">
            {isToday
              ? t.log.today
              : date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={isToday}
            onClick={() => setDate((d) => addDays(d, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardContent className="pt-6 pb-6">
          <CalorieRing consumed={Math.round(totals.calories)} target={profile.targetCalories} />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.log.macros}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MacroBar label={t.progress.tooltip.protein} consumed={totals.protein} target={profile.targetProtein} color="bg-blue-500" />
          <MacroBar label="Carbs" consumed={totals.carbs} target={profile.targetCarbs} color="bg-amber-500" />
          <MacroBar label={t.progress.tooltip.calories.slice(0, 3)} consumed={totals.fat} target={profile.targetFat} color="bg-rose-500" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {MEAL_ORDER.map((mealType) => {
          const log = logs.find((l: any) => l.mealType === mealType)
          const mealCals = log?.items?.reduce((s: number, i: any) => s + i.calories, 0) ?? 0
          const label = mealLabels[mealType as keyof typeof mealLabels]

          return (
            <motion.div key={mealType} layout>
              <Card className="shadow-sm border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{label}</span>
                      {mealCals > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(mealCals)} kcal
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => setAddMealType(mealType)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t.log.add}
                    </Button>
                  </div>

                  {loading ? (
                    <div className="py-4 flex justify-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : log?.items?.length > 0 ? (
                    <div className="space-y-0">
                      {log.items.map((item: any, idx: number) => (
                        <div key={item.id}>
                          {idx > 0 && <Separator className="my-2" />}
                          <div className="flex items-center justify-between group py-0.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.foodItem.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity}g · {Math.round(item.calories)} kcal ·{" "}
                                P: {item.protein.toFixed(1)}g · C: {item.carbs.toFixed(1)}g · G: {item.fat.toFixed(1)}g
                              </p>
                            </div>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-muted-foreground hover:text-destructive rounded transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-1">{t.log.nothing}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {addMealType && (
        <AddFoodDialog
          mealType={addMealType}
          date={dateStr}
          onClose={() => setAddMealType(null)}
          onSuccess={handleFoodAdded}
        />
      )}
    </div>
  )
}
