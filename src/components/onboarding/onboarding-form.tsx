"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Leaf, User, Scale, Target, Activity, Dumbbell,
  ChevronRight, ChevronLeft, Loader2, CheckCircle2
} from "lucide-react"
import type { OnboardingData, Sex, Goal, ActivityLevel, MuscleLevel, FatLevel } from "@/types"

const TOTAL_STEPS = 6

type StepProps = {
  data: Partial<OnboardingData>
  onChange: (updates: Partial<OnboardingData>) => void
}

function OptionButton({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 text-sm font-medium",
        selected
          ? "border-primary bg-primary/8 text-primary"
          : "border-border hover:border-primary/40 hover:bg-muted/60",
        className
      )}
    >
      {children}
    </button>
  )
}

function Step1({ data, onChange }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Welcome! Let&apos;s get started</h2>
        <p className="text-muted-foreground mt-1">Tell us a bit about yourself</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Your name (optional)</Label>
          <Input
            placeholder="Name"
            value={data.name ?? ""}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Age</Label>
          <Input
            type="number"
            placeholder="25"
            min={15}
            max={100}
            value={data.age ?? ""}
            onChange={(e) => onChange({ age: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Sex</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["male", "female"] as Sex[]).map((s) => (
              <OptionButton
                key={s}
                selected={data.sex === s}
                onClick={() => onChange({ sex: s })}
              >
                {s === "male" ? "♂ Male" : "♀ Female"}
              </OptionButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step2({ data, onChange }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Body measurements</h2>
        <p className="text-muted-foreground mt-1">Used to calculate your calorie needs</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Weight (kg)</Label>
          <Input
            type="number"
            placeholder="70"
            step="0.1"
            min={30}
            max={300}
            value={data.weight ?? ""}
            onChange={(e) => onChange({ weight: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Height (cm)</Label>
          <Input
            type="number"
            placeholder="175"
            min={100}
            max={250}
            value={data.height ?? ""}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}

function Step3({ data, onChange }: StepProps) {
  const goals: { value: Goal; label: string; description: string }[] = [
    { value: "lose_fat", label: "Lose fat", description: "Calorie deficit to reduce body fat" },
    { value: "gain_muscle", label: "Build muscle", description: "Calorie surplus to maximize gains" },
    { value: "maintain", label: "Maintain", description: "Keep current weight and composition" },
    { value: "recomposition", label: "Recomposition", description: "Lose fat and build muscle simultaneously" },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">What&apos;s your goal?</h2>
        <p className="text-muted-foreground mt-1">This shapes your calorie and macro targets</p>
      </div>
      <div className="space-y-3">
        {goals.map((g) => (
          <OptionButton
            key={g.value}
            selected={data.goal === g.value}
            onClick={() => onChange({ goal: g.value })}
          >
            <span className="font-semibold block">{g.label}</span>
            <span className="text-muted-foreground text-xs font-normal">{g.description}</span>
          </OptionButton>
        ))}
      </div>
    </div>
  )
}

function Step4({ data, onChange }: StepProps) {
  const levels: { value: ActivityLevel; label: string; description: string }[] = [
    { value: "sedentary", label: "Sedentary", description: "Desk job, little or no exercise" },
    { value: "light", label: "Lightly active", description: "1–3 days/week of exercise" },
    { value: "moderate", label: "Moderately active", description: "3–5 days/week of exercise" },
    { value: "active", label: "Active", description: "Hard exercise 6–7 days/week" },
    { value: "very_active", label: "Very active", description: "Physical job + intense daily training" },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">How active are you?</h2>
        <p className="text-muted-foreground mt-1">Outside of intentional exercise sessions</p>
      </div>
      <div className="space-y-2">
        {levels.map((l) => (
          <OptionButton
            key={l.value}
            selected={data.activityLevel === l.value}
            onClick={() => onChange({ activityLevel: l.value })}
          >
            <span className="font-semibold block">{l.label}</span>
            <span className="text-muted-foreground text-xs font-normal">{l.description}</span>
          </OptionButton>
        ))}
      </div>
    </div>
  )
}

function Step5({ data, onChange }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Training experience</h2>
        <p className="text-muted-foreground mt-1">Helps refine your protein and calorie targets</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Years of consistent training</Label>
          <Input
            type="number"
            placeholder="2"
            min={0}
            max={50}
            step="0.5"
            value={data.trainingYears ?? ""}
            onChange={(e) => onChange({ trainingYears: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Workouts per week</Label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <OptionButton
                key={n}
                selected={data.weeklyWorkouts === n}
                onClick={() => onChange({ weeklyWorkouts: n })}
                className="text-center py-2.5"
              >
                {n === 0 ? "0" : n}
              </OptionButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step6({ data, onChange }: StepProps) {
  const muscleOptions: { value: MuscleLevel; label: string }[] = [
    { value: "very_little", label: "Very little" },
    { value: "little", label: "Little" },
    { value: "normal", label: "Normal" },
    { value: "quite_a_bit", label: "Quite a bit" },
    { value: "a_lot", label: "A lot" },
  ]
  const fatOptions: { value: FatLevel; label: string }[] = [
    { value: "very_little", label: "Very little" },
    { value: "little", label: "Little" },
    { value: "normal", label: "Normal" },
    { value: "quite_a_bit", label: "Quite a bit" },
    { value: "a_lot", label: "A lot" },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Body composition</h2>
        <p className="text-muted-foreground mt-1">A rough self-assessment — be honest with yourself</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="font-semibold">How much muscle do you have?</Label>
          <div className="grid grid-cols-5 gap-1.5">
            {muscleOptions.map((o) => (
              <OptionButton
                key={o.value}
                selected={data.muscleMass === o.value}
                onClick={() => onChange({ muscleMass: o.value })}
                className="text-center py-2 text-xs"
              >
                {o.label}
              </OptionButton>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-semibold">How much body fat do you have?</Label>
          <div className="grid grid-cols-5 gap-1.5">
            {fatOptions.map((o) => (
              <OptionButton
                key={o.value}
                selected={data.fatLevel === o.value}
                onClick={() => onChange({ fatLevel: o.value })}
                className="text-center py-2 text-xs"
              >
                {o.label}
              </OptionButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const onboardingSchema = z.object({
  age: z.number().min(15).max(100),
  sex: z.enum(["male", "female"]),
  weight: z.number().min(30).max(300),
  height: z.number().min(100).max(250),
  goal: z.enum(["lose_fat", "gain_muscle", "maintain", "recomposition"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  trainingYears: z.number().min(0),
  weeklyWorkouts: z.number().min(0).max(7),
  muscleMass: z.enum(["very_little", "little", "normal", "quite_a_bit", "a_lot"]),
  fatLevel: z.enum(["very_little", "little", "normal", "quite_a_bit", "a_lot"]),
})

export default function OnboardingForm({
  userId,
  userEmail,
}: {
  userId: string
  userEmail: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState<Partial<OnboardingData>>({})

  function handleChange(updates: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return !!data.age && !!data.sex
      case 2:
        return !!data.weight && !!data.height
      case 3:
        return !!data.goal
      case 4:
        return !!data.activityLevel
      case 5:
        return data.weeklyWorkouts !== undefined && data.trainingYears !== undefined
      case 6:
        return !!data.muscleMass && !!data.fatLevel
      default:
        return false
    }
  }

  async function handleSubmit() {
    const result = onboardingSchema.safeParse(data)
    if (!result.success) {
      toast.error("Please complete all fields before continuing.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, name: data.name }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to save profile")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  const steps = [Step1, Step2, Step3, Step4, Step5, Step6]
  const CurrentStep = steps[step - 1]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight">fitW</span>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
        </div>

        <Card className="shadow-sm border-border/60">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CurrentStep data={data} onChange={handleChange} />
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Calculate my plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Signed in as {userEmail}
        </p>
      </div>
    </div>
  )
}
