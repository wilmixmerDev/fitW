"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Utensils, Loader2 } from "lucide-react"

interface Recipe { id: string; name: string; cookedWeight: number | null }

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno", lunch: "Almuerzo", dinner: "Cena", snack: "Merienda",
}

function detectMealByHour(): string {
  const h = new Date().getHours()
  if (h >= 5  && h < 11) return "breakfast"
  if (h >= 11 && h < 15) return "lunch"
  if (h >= 15 && h < 19) return "snack"
  return "dinner"
}

export function ServeDialog({ recipe, onClose, onSuccess }: {
  recipe: Recipe; onClose: () => void; onSuccess: () => void
}) {
  const [portionWeight, setPortionWeight] = useState("")
  const [mealType, setMealType] = useState(detectMealByHour)
  const [serving, setServing] = useState(false)

  const pct = recipe.cookedWeight && portionWeight
    ? Math.round((Number(portionWeight) / recipe.cookedWeight) * 100)
    : null

  async function handleServe() {
    if (!portionWeight || Number(portionWeight) <= 0) return
    setServing(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const res = await fetch(`/api/recipes/${recipe.id}/serve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portionWeight: Number(portionWeight), mealType, date: today }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar")
    } finally {
      setServing(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-primary" />
            Registrar porción — {recipe.name}
          </DialogTitle>
        </DialogHeader>

        {recipe.cookedWeight && (
          <p className="text-xs text-muted-foreground -mt-1">
            Olla total: <strong>{recipe.cookedWeight}g</strong>
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>¿Cuánto pesa tu plato? (g)</Label>
            <Input type="number" placeholder="ej. 350" min={1}
              value={portionWeight} onChange={(e) => setPortionWeight(e.target.value)} autoFocus />
            {pct !== null && (
              <p className="text-xs text-primary font-medium">
                = {pct}% de la olla → macros proporcionales calculados automáticamente
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Agregar a <span className="text-xs font-normal">(opcional)</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {(["breakfast", "lunch", "dinner", "snack"] as const).map((m) => (
                <button key={m} onClick={() => setMealType(m)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                    mealType === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  }`}>
                  {MEAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleServe}
            disabled={!portionWeight || Number(portionWeight) <= 0 || serving}
            className="w-full">
            {serving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Registrar en {MEAL_LABELS[mealType]}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
