"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, Check } from "lucide-react"
import { useT } from "@/contexts/language-context"
import type { FoodItem } from "@/types"

interface AddFoodDialogProps {
  mealType: string
  date: string
  onClose: () => void
  onSuccess: () => void
}

export function AddFoodDialog({ mealType, date, onClose, onSuccess }: AddFoodDialogProps) {
  const t = useT()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [mode, setMode] = useState<"weight" | "units">("weight")
  const [quantity, setQuantity] = useState("")
  const [adding, setAdding] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/foods?q=${encodeURIComponent(q)}&limit=15`)
      setResults(await res.json())
    } catch {
      toast.error(t.food.searchFailed)
    } finally {
      setLoading(false)
    }
  }, [t])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  function selectFood(food: FoodItem) {
    setSelected(food)
    if (food.servingSize) {
      setMode("units")
      setQuantity("1")
    } else {
      setMode("weight")
      setQuantity("100")
    }
  }

  // Actual grams to send to the API
  const actualGrams =
    mode === "units" && selected?.servingSize
      ? Math.round(Number(quantity) * selected.servingSize)
      : Number(quantity)

  const macros = selected && quantity && Number(quantity) > 0
    ? {
        calories: (selected.calories * actualGrams) / 100,
        protein: (selected.protein * actualGrams) / 100,
        carbs: (selected.carbs * actualGrams) / 100,
        fat: (selected.fat * actualGrams) / 100,
      }
    : null

  async function handleAdd() {
    if (!selected || !quantity || Number(quantity) <= 0) return
    setAdding(true)
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId: selected.id, quantity: actualGrams, mealType, date }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success(`${selected.name} → ${t.log.meals[mealType as keyof typeof t.log.meals] ?? mealType}`)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.food.addFailed)
    } finally {
      setAdding(false)
    }
  }

  const hasServing = !!(selected?.servingSize)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle>
            {t.food.addTo} {t.log.meals[mealType as keyof typeof t.log.meals] ?? mealType}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t.food.searchPlaceholder}
              value={query}
              onChange={handleQueryChange}
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* Results list */}
            {!selected && results.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ScrollArea className="h-64">
                  <div className="space-y-1 pr-3">
                    {results.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => selectFood(food)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{food.name}</p>
                            {food.brand && (
                              <p className="text-xs text-muted-foreground">{food.brand}</p>
                            )}
                            {food.servingName && (
                              <p className="text-xs text-primary/80">{food.servingName}</p>
                            )}
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

            {/* Selected food detail */}
            {selected && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{selected.name}</p>
                    {selected.brand && (
                      <p className="text-sm text-muted-foreground">{selected.brand}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelected(null); setQuery(""); setResults([]) }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {t.food.change}
                  </button>
                </div>

                {/* Mode toggle — only when food has serving info */}
                {hasServing && (
                  <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                    <button
                      onClick={() => { setMode("units"); setQuantity("1") }}
                      className={`flex-1 py-1.5 font-medium transition-colors ${
                        mode === "units"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t.food.byUnits}
                      {selected.servingName && (
                        <span className="ml-1 opacity-70 font-normal text-xs">
                          ({selected.servingName})
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => { setMode("weight"); setQuantity("100") }}
                      className={`flex-1 py-1.5 font-medium transition-colors ${
                        mode === "weight"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t.food.byGrams}
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {mode === "units" ? t.food.quantityUnits : t.food.quantityGrams}
                    {mode === "units" && selected.servingSize && (
                      <span className="text-muted-foreground font-normal ml-2 text-xs">
                        = {actualGrams}g
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      type="number"
                      min={mode === "units" ? 0.5 : 1}
                      step={mode === "units" ? 0.5 : 10}
                      max={mode === "units" ? 20 : 2000}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-24"
                    />
                    {mode === "units"
                      ? [1, 2, 3, 4].map((n) => (
                          <Button
                            key={n}
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(String(n))}
                            className="text-xs"
                          >
                            {n}
                          </Button>
                        ))
                      : [100, 150, 200].map((g) => (
                          <Button
                            key={g}
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(String(g))}
                            className="text-xs"
                          >
                            {g}g
                          </Button>
                        ))
                    }
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

                <Button
                  onClick={handleAdd}
                  disabled={!quantity || Number(quantity) <= 0 || adding}
                  className="w-full"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t.food.addFood}
                </Button>
              </motion.div>
            )}

            {!selected && !loading && query && results.length === 0 && (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground text-center py-8"
              >
                {t.food.searchEmpty} &quot;{query}&quot;
              </motion.p>
            )}

            {!selected && !query && (
              <p key="prompt" className="text-sm text-muted-foreground text-center py-8">
                {t.food.searchPrompt}
              </p>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
