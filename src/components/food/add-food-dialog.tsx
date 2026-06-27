"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, Check, ChefHat, Scale } from "lucide-react"
import { useT } from "@/contexts/language-context"
import type { FoodItem } from "@/types"

interface Recipe {
  id: string; name: string; cookedWeight: number | null
  ingredients: { quantityGrams: number; foodItem: { calories: number; protein: number; carbs: number; fat: number } }[]
}

interface AddFoodDialogProps {
  mealType: string; date: string; onClose: () => void; onSuccess: () => void
}

export function AddFoodDialog({ mealType, date, onClose, onSuccess }: AddFoodDialogProps) {
  const t = useT()
  const [tab, setTab] = useState<"food" | "recipes">("food")

  // ── Food search state ───────────────────────────────────────────────────
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [mode, setMode] = useState<"weight" | "units">("weight")
  const [quantity, setQuantity] = useState("")
  const [adding, setAdding] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Recipes state ───────────────────────────────────────────────────────
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipesLoaded, setRecipesLoaded] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [portionWeight, setPortionWeight] = useState("")
  const [serving, setServing] = useState(false)

  // Load recipes lazily when tab is opened
  useEffect(() => {
    if (tab === "recipes" && !recipesLoaded) {
      fetch("/api/recipes")
        .then((r) => r.json())
        .then((data) => { setRecipes(data); setRecipesLoaded(true) })
        .catch(() => setRecipesLoaded(true))
    }
  }, [tab, recipesLoaded])

  // ── Food search handlers ────────────────────────────────────────────────
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/foods?q=${encodeURIComponent(q)}&limit=15`)
      setResults(await res.json())
    } catch { toast.error(t.food.searchFailed) }
    finally { setLoading(false) }
  }, [t])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  function selectFood(food: FoodItem) {
    setSelected(food)
    if (food.servingSize) { setMode("units"); setQuantity("1") }
    else { setMode("weight"); setQuantity("100") }
  }

  const actualGrams = mode === "units" && selected?.servingSize
    ? Math.round(Number(quantity) * selected.servingSize)
    : Number(quantity)

  const macros = selected && quantity && Number(quantity) > 0 ? {
    calories: (selected.calories * actualGrams) / 100,
    protein:  (selected.protein  * actualGrams) / 100,
    carbs:    (selected.carbs    * actualGrams) / 100,
    fat:      (selected.fat      * actualGrams) / 100,
  } : null

  async function handleAdd() {
    if (!selected || !quantity || Number(quantity) <= 0) return
    setAdding(true)
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId: selected.id, quantity: actualGrams, mealType, date }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(`${selected.name} → ${t.log.meals[mealType as keyof typeof t.log.meals] ?? mealType}`)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.food.addFailed)
    } finally { setAdding(false) }
  }

  // ── Recipe serve handler ────────────────────────────────────────────────
  async function handleServe() {
    if (!selectedRecipe || !portionWeight || Number(portionWeight) <= 0) return
    setServing(true)
    try {
      const res = await fetch(`/api/recipes/${selectedRecipe.id}/serve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portionWeight: Number(portionWeight), mealType, date }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(`${selectedRecipe.name} → ${t.log.meals[mealType as keyof typeof t.log.meals] ?? mealType}`)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.food.addFailed)
    } finally { setServing(false) }
  }

  function recipeTotals(r: Recipe) {
    return r.ingredients.reduce((acc, ing) => {
      const ratio = ing.quantityGrams / 100
      return {
        calories: acc.calories + ing.foodItem.calories * ratio,
        protein:  acc.protein  + ing.foodItem.protein  * ratio,
        carbs:    acc.carbs    + ing.foodItem.carbs    * ratio,
        fat:      acc.fat      + ing.foodItem.fat      * ratio,
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  const portionMacros = selectedRecipe?.cookedWeight && portionWeight && Number(portionWeight) > 0
    ? (() => {
        const totals = recipeTotals(selectedRecipe)
        const ratio = Number(portionWeight) / selectedRecipe.cookedWeight
        return {
          calories: totals.calories * ratio,
          protein:  totals.protein  * ratio,
          carbs:    totals.carbs    * ratio,
          fat:      totals.fat      * ratio,
        }
      })()
    : null

  const mealLabel = t.log.meals[mealType as keyof typeof t.log.meals] ?? mealType

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle>{t.food.addTo} {mealLabel}</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex mx-5 mt-3 rounded-lg border border-border overflow-hidden text-sm">
          <button
            onClick={() => setTab("food")}
            className={`flex-1 py-2 font-medium transition-colors flex items-center justify-center gap-1.5 ${
              tab === "food" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Alimento
          </button>
          <button
            onClick={() => setTab("recipes")}
            className={`flex-1 py-2 font-medium transition-colors flex items-center justify-center gap-1.5 ${
              tab === "recipes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Recetas
          </button>
        </div>

        <div className="p-5 space-y-4">
          <AnimatePresence mode="wait">
            {/* ── FOOD TAB ─────────────────────────────────────────── */}
            {tab === "food" && (
              <motion.div key="food-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder={t.food.searchPlaceholder}
                    value={query} onChange={handleQueryChange} autoFocus />
                  {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>

                <AnimatePresence mode="wait">
                  {!selected && results.length > 0 && (
                    <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <ScrollArea className="h-56">
                        <div className="space-y-1 pr-3">
                          {results.map((food) => (
                            <button key={food.id} onClick={() => selectFood(food)}
                              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{food.name}</p>
                                  {food.brand && <p className="text-xs text-muted-foreground">{food.brand}</p>}
                                  {food.servingName && <p className="text-xs text-primary/80">{food.servingName}</p>}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-semibold">{food.calories} kcal</p>
                                  <p className="text-xs text-muted-foreground">{t.food.perGrams}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}

                  {selected && (
                    <motion.div key="detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{selected.name}</p>
                          {selected.brand && <p className="text-sm text-muted-foreground">{selected.brand}</p>}
                        </div>
                        <button onClick={() => { setSelected(null); setQuery(""); setResults([]) }}
                          className="text-xs text-muted-foreground hover:text-foreground underline">
                          {t.food.change}
                        </button>
                      </div>

                      {selected.servingSize && (
                        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                          <button onClick={() => { setMode("units"); setQuantity("1") }}
                            className={`flex-1 py-1.5 font-medium transition-colors ${mode === "units" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                            {t.food.byUnits}
                            {selected.servingName && <span className="ml-1 opacity-70 font-normal text-xs">({selected.servingName})</span>}
                          </button>
                          <button onClick={() => { setMode("weight"); setQuantity("100") }}
                            className={`flex-1 py-1.5 font-medium transition-colors ${mode === "weight" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                            {t.food.byGrams}
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">
                          {mode === "units" ? t.food.quantityUnits : t.food.quantityGrams}
                          {mode === "units" && selected.servingSize && (
                            <span className="text-muted-foreground font-normal ml-2 text-xs">= {actualGrams}g</span>
                          )}
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          <Input type="number" min={mode === "units" ? 0.5 : 1} step={mode === "units" ? 0.5 : 10}
                            max={mode === "units" ? 20 : 2000} value={quantity}
                            onChange={(e) => setQuantity(e.target.value)} className="w-24" />
                          {(mode === "units" ? [1, 2, 3, 4] : [100, 150, 200]).map((n) => (
                            <Button key={n} variant="outline" size="sm"
                              onClick={() => setQuantity(String(n))} className="text-xs">
                              {mode === "units" ? n : `${n}g`}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {macros && (
                        <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-xl">
                          {[
                            { label: "kcal", value: Math.round(macros.calories) },
                            { label: "P", value: macros.protein.toFixed(1) + "g" },
                            { label: "C", value: macros.carbs.toFixed(1) + "g" },
                            { label: "G", value: macros.fat.toFixed(1) + "g" },
                          ].map(({ label, value }) => (
                            <div key={label} className="text-center">
                              <p className="text-sm font-bold">{value}</p>
                              <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button onClick={handleAdd} disabled={!quantity || Number(quantity) <= 0 || adding} className="w-full">
                        {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        {t.food.addFood}
                      </Button>
                    </motion.div>
                  )}

                  {!selected && !loading && query && results.length === 0 && (
                    <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-sm text-muted-foreground text-center py-8">
                      {t.food.searchEmpty} &quot;{query}&quot;
                    </motion.p>
                  )}

                  {!selected && !query && (
                    <p key="prompt" className="text-sm text-muted-foreground text-center py-8">
                      {t.food.searchPrompt}
                    </p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── RECIPES TAB ──────────────────────────────────────── */}
            {tab === "recipes" && (
              <motion.div key="recipes-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-3">
                {!recipesLoaded ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : recipes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tienes recetas guardadas</p>
                  </div>
                ) : !selectedRecipe ? (
                  <ScrollArea className="h-72">
                    <div className="space-y-2 pr-2">
                      {recipes.map((recipe) => {
                        const totals = recipeTotals(recipe)
                        return (
                          <button key={recipe.id} onClick={() => { setSelectedRecipe(recipe); setPortionWeight("") }}
                            className="w-full text-left px-3 py-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold flex items-center gap-1.5">
                                  <ChefHat className="w-3.5 h-3.5 text-primary" />
                                  {recipe.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {Math.round(totals.calories)} kcal totales
                                  {recipe.cookedWeight && ` · olla: ${recipe.cookedWeight}g`}
                                </p>
                              </div>
                              {recipe.cookedWeight
                                ? <span className="text-xs text-primary font-medium">Registrar →</span>
                                : <span className="text-xs text-muted-foreground">Sin peso</span>
                              }
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <motion.div key="recipe-serve" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold flex items-center gap-1.5">
                          <ChefHat className="w-4 h-4 text-primary" />
                          {selectedRecipe.name}
                        </p>
                        {selectedRecipe.cookedWeight && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Olla total: {selectedRecipe.cookedWeight}g
                          </p>
                        )}
                      </div>
                      <button onClick={() => setSelectedRecipe(null)}
                        className="text-xs text-muted-foreground hover:text-foreground underline">
                        {t.food.change}
                      </button>
                    </div>

                    {!selectedRecipe.cookedWeight ? (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        Esta receta no tiene peso cocinado registrado. Ve a <strong>Recetas</strong> para registrarlo primero.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-primary" />
                            ¿Cuánto pesa tu plato? (g)
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            <Input type="number" placeholder="ej. 350" min={1}
                              value={portionWeight} onChange={(e) => setPortionWeight(e.target.value)}
                              className="w-24" autoFocus />
                            {[200, 300, 400].map((g) => (
                              <Button key={g} variant="outline" size="sm"
                                onClick={() => setPortionWeight(String(g))} className="text-xs">
                                {g}g
                              </Button>
                            ))}
                          </div>
                          {portionWeight && selectedRecipe.cookedWeight && (
                            <p className="text-xs text-primary font-medium">
                              = {Math.round((Number(portionWeight) / selectedRecipe.cookedWeight) * 100)}% de la olla
                            </p>
                          )}
                        </div>

                        {portionMacros && (
                          <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-xl">
                            {[
                              { label: "kcal", value: Math.round(portionMacros.calories) },
                              { label: "P", value: portionMacros.protein.toFixed(1) + "g" },
                              { label: "C", value: portionMacros.carbs.toFixed(1) + "g" },
                              { label: "G", value: portionMacros.fat.toFixed(1) + "g" },
                            ].map(({ label, value }) => (
                              <div key={label} className="text-center">
                                <p className="text-sm font-bold">{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button onClick={handleServe}
                          disabled={!portionWeight || Number(portionWeight) <= 0 || serving}
                          className="w-full">
                          {serving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                          Registrar en {mealLabel}
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
