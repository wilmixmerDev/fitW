import type { OnboardingData } from "@/types"

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

// Maps self-reported fat level to body fat % estimate
const FAT_LEVEL_MAP = {
  male: {
    very_little: 8,
    little: 12,
    normal: 18,
    quite_a_bit: 25,
    a_lot: 32,
  },
  female: {
    very_little: 15,
    little: 20,
    normal: 26,
    quite_a_bit: 33,
    a_lot: 40,
  },
}

export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  sex: "male" | "female"
): number {
  // Mifflin-St Jeor
  const base = 10 * weight + 6.25 * height - 5 * age
  return sex === "male" ? base + 5 : base - 161
}

export function calculateTDEE(
  bmr: number,
  activityLevel: keyof typeof ACTIVITY_MULTIPLIERS
): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
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

export function calculateTargets(data: OnboardingData): {
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
} {
  const bmr = calculateBMR(data.weight, data.height, data.age, data.sex)
  const tdee = calculateTDEE(
    bmr,
    data.activityLevel as keyof typeof ACTIVITY_MULTIPLIERS
  )

  const bodyFatPct = estimateBodyFatPct(
    data.sex,
    data.fatLevel as keyof (typeof FAT_LEVEL_MAP)["male"]
  )
  const leanMass = calculateLeanMass(data.weight, bodyFatPct)

  let targetCalories: number
  switch (data.goal) {
    case "lose_fat":
      targetCalories = Math.round(tdee * 0.8)
      break
    case "gain_muscle":
      targetCalories = Math.round(tdee * 1.1)
      break
    case "recomposition":
      targetCalories = tdee
      break
    default:
      targetCalories = tdee
  }

  // Protein: 2.0 g/kg lean mass (higher for cut, slightly lower for bulk)
  const proteinMultiplier =
    data.goal === "lose_fat" ? 2.2 : data.goal === "gain_muscle" ? 1.8 : 2.0
  const targetProtein = Math.round(leanMass * proteinMultiplier)

  // Fat: 25% of calories
  const targetFat = Math.round((targetCalories * 0.25) / 9)

  // Carbs: remainder
  const proteinCals = targetProtein * 4
  const fatCals = targetFat * 9
  const targetCarbs = Math.round((targetCalories - proteinCals - fatCals) / 4)

  return { targetCalories, targetProtein, targetCarbs, targetFat }
}

export function calculateMacrosForQuantity(
  foodPer100g: { calories: number; protein: number; carbs: number; fat: number },
  quantityGrams: number
) {
  const ratio = quantityGrams / 100
  return {
    calories: Math.round(foodPer100g.calories * ratio * 10) / 10,
    protein: Math.round(foodPer100g.protein * ratio * 10) / 10,
    carbs: Math.round(foodPer100g.carbs * ratio * 10) / 10,
    fat: Math.round(foodPer100g.fat * ratio * 10) / 10,
  }
}
