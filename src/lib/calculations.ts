import type { OnboardingData } from "@/types"

// ─── Mifflin-St Jeor BMR ───────────────────────────────────────────────────
// More reliable than Katch-McArdle when lean mass is self-reported
// Male:   BMR = 10×W + 6.25×H - 5×A + 5
// Female: BMR = 10×W + 6.25×H - 5×A - 161
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  sex: "male" | "female"
): number {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === "male" ? base + 5 : base - 161)
}

// ─── Granular activity multiplier (days/week × experience) ─────────────────
// Replaces broad 5-level categories with exact training days
// At exactly 5 days, experience >= 3 years earns the athlete multiplier (1.375)
export function getActivityMultiplier(
  weeklyWorkouts: number,
  trainingYears: number
): number {
  if (weeklyWorkouts === 0) return 1.20
  if (weeklyWorkouts <= 2)  return 1.30
  if (weeklyWorkouts <= 4)  return 1.35
  if (weeklyWorkouts === 5) return trainingYears >= 3 ? 1.375 : 1.35
  return 1.45 // 6-7 days
}

// ─── Experience tier ────────────────────────────────────────────────────────
export function getExperienceTier(
  trainingYears: number
): "beginner" | "intermediate" | "advanced" {
  if (trainingYears < 1) return "beginner"
  if (trainingYears < 3) return "intermediate"
  return "advanced"
}

// ─── Body composition estimation (for protein targets) ─────────────────────
const FAT_LEVEL_MAP = {
  male:   { very_little: 8, little: 12, normal: 18, quite_a_bit: 25, a_lot: 32 },
  female: { very_little: 15, little: 20, normal: 26, quite_a_bit: 33, a_lot: 40 },
}

export function estimateBodyFatPct(
  sex: "male" | "female",
  fatLevel: keyof (typeof FAT_LEVEL_MAP)["male"]
): number {
  return FAT_LEVEL_MAP[sex][fatLevel]
}

export function calculateLeanMass(weight: number, bodyFatPct: number): number {
  return weight * (1 - bodyFatPct / 100)
}

// ─── Protein target (g per kg of lean mass, experience-adjusted) ───────────
const PROTEIN_MULTIPLIER: Record<string, Record<string, number>> = {
  beginner:     { lose_fat: 2.0, gain_muscle: 1.6, recomposition: 1.8, maintain: 1.6 },
  intermediate: { lose_fat: 2.2, gain_muscle: 1.8, recomposition: 2.0, maintain: 1.8 },
  advanced:     { lose_fat: 2.4, gain_muscle: 2.0, recomposition: 2.2, maintain: 2.0 },
}

// ─── Main target calculator ─────────────────────────────────────────────────
export function calculateTargets(data: OnboardingData): {
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
} {
  const weeks = data.weeklyWorkouts ?? 0
  const years = data.trainingYears ?? 0
  const tier  = getExperienceTier(years)

  // Step 1 — Mifflin-St Jeor BMR
  const bmr = calculateBMR(data.weight, data.height, data.age, data.sex as "male" | "female")

  // Step 2 — TDEE with granular multiplier (days × experience)
  const multiplier = getActivityMultiplier(weeks, years)
  const tdee = Math.round(bmr * multiplier)

  // Step 3 — Jeff Nippard: strict 20% deficit for fat loss, never more
  let targetCalories: number
  switch (data.goal) {
    case "lose_fat":
      targetCalories = Math.round(tdee * 0.80)
      break
    case "gain_muscle":
      targetCalories = Math.round(tdee * 1.10)
      break
    case "recomposition":
    case "maintain":
    default:
      targetCalories = tdee
  }

  // Protein — uses estimated lean mass so protein stays high regardless of surplus/deficit
  const bodyFatPct = estimateBodyFatPct(
    data.sex as "male" | "female",
    data.fatLevel as keyof (typeof FAT_LEVEL_MAP)["male"]
  )
  const leanMass = calculateLeanMass(data.weight, bodyFatPct)
  const proteinMultiplier = PROTEIN_MULTIPLIER[tier][data.goal] ?? 2.0
  const targetProtein = Math.round(leanMass * proteinMultiplier)

  // Fat — 25% calories (28% for advanced, supports hormonal health)
  const fatPct = tier === "advanced" ? 0.28 : 0.25
  const targetFat = Math.round((targetCalories * fatPct) / 9)

  // Carbs — fill remaining calories
  const targetCarbs = Math.max(
    Math.round((targetCalories - targetProtein * 4 - targetFat * 9) / 4),
    0
  )

  return { targetCalories, targetProtein, targetCarbs, targetFat }
}

export function calculateMacrosForQuantity(
  foodPer100g: { calories: number; protein: number; carbs: number; fat: number },
  quantityGrams: number
) {
  const ratio = quantityGrams / 100
  return {
    calories: Math.round(foodPer100g.calories * ratio * 10) / 10,
    protein:  Math.round(foodPer100g.protein  * ratio * 10) / 10,
    carbs:    Math.round(foodPer100g.carbs    * ratio * 10) / 10,
    fat:      Math.round(foodPer100g.fat      * ratio * 10) / 10,
  }
}
