export type Sex = "male" | "female"

export type Goal =
  | "lose_fat"
  | "gain_muscle"
  | "maintain"
  | "recomposition"

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active"

export type MuscleLevel =
  | "very_little"
  | "little"
  | "normal"
  | "quite_a_bit"
  | "a_lot"

export type FatLevel =
  | "very_little"
  | "little"
  | "normal"
  | "quite_a_bit"
  | "a_lot"

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export interface OnboardingData {
  name: string
  age: number
  sex: Sex
  weight: number
  height: number
  goal: Goal
  activityLevel: ActivityLevel
  trainingYears: number
  weeklyWorkouts: number
  muscleMass: MuscleLevel
  fatLevel: FatLevel
}

export interface MacroSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface DailyLog {
  date: string
  consumed: MacroSummary
  target: MacroSummary
}

export interface FoodItem {
  id: string
  name: string
  brand?: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number | null
  servingSize?: number | null
  servingName?: string | null
}

export interface MealLogItem {
  id: string
  foodItem: FoodItem
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MealLog {
  id: string
  mealType: MealType
  items: MealLogItem[]
}

export interface Profile {
  id: string
  userId: string
  name?: string | null
  age: number
  sex: string
  weight: number
  height: number
  goal: string
  activityLevel: string
  trainingYears: number
  weeklyWorkouts: number
  muscleMass: string
  fatLevel: string
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
}

export interface DBFoodItem {
  id: string
  name: string
  brand?: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number | null
  servingSize?: number | null
  servingName?: string | null
  isVerified: boolean
  createdAt: Date
}

export interface DBMealLogItem {
  id: string
  mealLogId: string
  foodItemId: string
  foodItem: DBFoodItem
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
  createdAt: Date
}

export interface DBMealLog {
  id: string
  profileId: string
  date: Date
  mealType: string
  items: DBMealLogItem[]
  createdAt: Date
  updatedAt: Date
}
