"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, ChefHat, Scale, Utensils, Pencil } from "lucide-react"
import { RecipeBuilder } from "./recipe-builder"
import { ServeDialog } from "./serve-dialog"

interface FoodItem {
  id: string; name: string; calories: number; protein: number; carbs: number; fat: number
}
interface Ingredient { id: string; foodItem: FoodItem; quantityGrams: number }
interface Recipe {
  id: string; name: string; cookedWeight: number | null; ingredients: Ingredient[]
  updatedAt: string
}

function recipeTotalRaw(recipe: Recipe) {
  return recipe.ingredients.reduce(
    (acc, ing) => {
      const r = ing.quantityGrams / 100
      return {
        calories: acc.calories + ing.foodItem.calories * r,
        protein:  acc.protein  + ing.foodItem.protein  * r,
        carbs:    acc.carbs    + ing.foodItem.carbs    * r,
        fat:      acc.fat      + ing.foodItem.fat      * r,
        grams:    acc.grams    + ing.quantityGrams,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, grams: 0 }
  )
}

export function RecipesClient({ initialRecipes }: { initialRecipes: Recipe[] }) {
  const [recipes, setRecipes] = useState(initialRecipes)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingCookedWeight, setEditingCookedWeight] = useState<string | null>(null)
  const [cookedWeightInput, setCookedWeightInput] = useState("")
  const [servingRecipe, setServingRecipe] = useState<Recipe | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta receta?")) return
    await fetch(`/api/recipes/${id}`, { method: "DELETE" })
    setRecipes((prev) => prev.filter((r) => r.id !== id))
    toast.success("Receta eliminada")
  }

  async function handleSaveCookedWeight(id: string) {
    const w = Number(cookedWeightInput)
    if (!w || w <= 0) return
    const res = await fetch(`/api/recipes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookedWeight: w }),
    })
    if (res.ok) {
      const updated = await res.json()
      setRecipes((prev) => prev.map((r) => r.id === id ? updated : r))
      toast.success("Peso cocinado guardado")
    }
    setEditingCookedWeight(null)
    setCookedWeightInput("")
  }

  function handleRecipeCreated(recipe: Recipe) {
    setRecipes((prev) => [recipe, ...prev])
    setShowBuilder(false)
    toast.success("Receta creada")
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            Mis recetas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Crea recetas con ingredientes crudos y registra porciones exactas
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nueva receta
        </Button>
      </motion.div>

      {recipes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 text-muted-foreground">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aún no tienes recetas</p>
          <p className="text-sm mt-1">Crea tu primera receta para calcular porciones exactas</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe, i) => {
            const totals = recipeTotalRaw(recipe)
            const per100g = recipe.cookedWeight
              ? {
                  calories: (totals.calories / recipe.cookedWeight) * 100,
                  protein:  (totals.protein  / recipe.cookedWeight) * 100,
                  carbs:    (totals.carbs    / recipe.cookedWeight) * 100,
                  fat:      (totals.fat      / recipe.cookedWeight) * 100,
                }
              : null

            return (
              <motion.div key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Card className="shadow-sm border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{recipe.name}</CardTitle>
                      <button onClick={() => handleDelete(recipe.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{recipe.ingredients.length} ingredientes</Badge>
                      <Badge variant="outline">{Math.round(totals.grams)}g total crudo</Badge>
                      <Badge variant="outline">{Math.round(totals.calories)} kcal totales</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Ingredients list */}
                    <div className="space-y-1">
                      {recipe.ingredients.map((ing) => (
                        <div key={ing.id} className="flex justify-between text-sm py-0.5">
                          <span className="text-muted-foreground">{ing.foodItem.name}</span>
                          <span className="font-medium">{ing.quantityGrams}g</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Cooked weight */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-primary" />
                          Peso total cocinado
                        </p>
                        {recipe.cookedWeight && (
                          <span className="text-sm font-semibold">{recipe.cookedWeight}g</span>
                        )}
                      </div>

                      {editingCookedWeight === recipe.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Pesa la olla entera (g)"
                            value={cookedWeightInput}
                            onChange={(e) => setCookedWeightInput(e.target.value)}
                            className="flex-1 h-8 text-sm"
                            autoFocus
                          />
                          <Button size="sm" className="h-8"
                            onClick={() => handleSaveCookedWeight(recipe.id)}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8"
                            onClick={() => setEditingCookedWeight(null)}>
                            ×
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full text-xs h-8"
                          onClick={() => {
                            setEditingCookedWeight(recipe.id)
                            setCookedWeightInput(String(recipe.cookedWeight ?? ""))
                          }}>
                          <Pencil className="w-3 h-3 mr-1" />
                          {recipe.cookedWeight ? "Actualizar peso cocinado" : "Registrar peso cocinado"}
                        </Button>
                      )}
                    </div>

                    {/* Per 100g cooked */}
                    {per100g && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Por 100g cocinado</p>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { l: "kcal", v: Math.round(per100g.calories) },
                              { l: "P",    v: per100g.protein.toFixed(1) + "g" },
                              { l: "C",    v: per100g.carbs.toFixed(1)   + "g" },
                              { l: "G",    v: per100g.fat.toFixed(1)     + "g" },
                            ].map(({ l, v }) => (
                              <div key={l} className="text-center bg-muted/40 rounded-lg py-2">
                                <p className="text-sm font-bold">{v}</p>
                                <p className="text-xs text-muted-foreground">{l}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Serve button */}
                    <Button
                      className="w-full"
                      disabled={!recipe.cookedWeight}
                      onClick={() => setServingRecipe(recipe)}
                    >
                      <Utensils className="w-4 h-4 mr-2" />
                      {recipe.cookedWeight ? "Registrar mi porción" : "Primero registra el peso cocinado"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {showBuilder && (
        <RecipeBuilder
          onClose={() => setShowBuilder(false)}
          onCreated={handleRecipeCreated}
        />
      )}

      {servingRecipe && (
        <ServeDialog
          recipe={servingRecipe}
          onClose={() => setServingRecipe(null)}
          onSuccess={() => {
            setServingRecipe(null)
            toast.success("Porción registrada en tu diario")
          }}
        />
      )}
    </div>
  )
}
