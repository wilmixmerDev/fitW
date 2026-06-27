"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Trash2, Loader2, ChefHat } from "lucide-react"

interface FoodItem { id: string; name: string; calories: number; protein: number; carbs: number; fat: number }
interface IngredientEntry { foodItem: FoodItem; quantityGrams: number }

export function RecipeBuilder({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (recipe: any) => void
}) {
  const [name, setName] = useState("")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([])
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/foods?q=${encodeURIComponent(q)}&limit=10`)
      setResults(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  function handleQuery(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 300)
  }

  function addIngredient(food: FoodItem) {
    setIngredients((prev) => [...prev, { foodItem: food, quantityGrams: 100 }])
    setQuery("")
    setResults([])
  }

  function updateQuantity(index: number, grams: number) {
    setIngredients((prev) => prev.map((ing, i) => i === index ? { ...ing, quantityGrams: grams } : ing))
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const totals = ingredients.reduce(
    (acc, ing) => {
      const r = ing.quantityGrams / 100
      return {
        calories: acc.calories + ing.foodItem.calories * r,
        protein:  acc.protein  + ing.foodItem.protein  * r,
        carbs:    acc.carbs    + ing.foodItem.carbs    * r,
        fat:      acc.fat      + ing.foodItem.fat      * r,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  async function handleSave() {
    if (!name.trim()) { toast.error("Ponle un nombre a la receta"); return }
    if (ingredients.length === 0) { toast.error("Agrega al menos un ingrediente"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ingredients: ingredients.map((i) => ({
            foodItemId: i.foodItem.id,
            quantityGrams: i.quantityGrams,
          })),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onCreated(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg w-full p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-5 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-primary" />
            Nueva receta
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label>Nombre de la receta</Label>
            <Input
              placeholder="ej. Arroz con pollo y queso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Ingredient search */}
          <div className="space-y-2">
            <Label>Ingredientes (crudos o secos)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar ingrediente..." value={query} onChange={handleQuery} />
              {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {results.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <ScrollArea className="max-h-40">
                  {results.map((food) => (
                    <button key={food.id} onClick={() => addIngredient(food)}
                      className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex justify-between text-sm">
                      <span>{food.name}</span>
                      <span className="text-muted-foreground">{food.calories} kcal/100g</span>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Ingredient list */}
          {ingredients.length > 0 && (
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate">{ing.foodItem.name}</span>
                  <Input
                    type="number"
                    min={1}
                    value={ing.quantityGrams}
                    onChange={(e) => updateQuantity(i, Number(e.target.value))}
                    className="w-20 h-8 text-sm text-center"
                  />
                  <span className="text-xs text-muted-foreground w-4">g</span>
                  <button onClick={() => removeIngredient(i)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <Separator />

              <div className="grid grid-cols-4 gap-2 p-3 bg-muted/40 rounded-xl">
                {[
                  { l: "kcal", v: Math.round(totals.calories) },
                  { l: "P",    v: totals.protein.toFixed(1) + "g" },
                  { l: "C",    v: totals.carbs.toFixed(1) + "g" },
                  { l: "G",    v: totals.fat.toFixed(1) + "g" },
                ].map(({ l, v }) => (
                  <div key={l} className="text-center">
                    <p className="text-sm font-bold">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 pt-0 shrink-0 border-t border-border mt-2">
          <Button onClick={handleSave} disabled={saving || !name || ingredients.length === 0} className="w-full">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Guardar receta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
