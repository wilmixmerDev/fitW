"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface MacroBarProps {
  label: string
  consumed: number
  target: number
  unit?: string
  color: string
}

export function MacroBar({ label, consumed, target, unit = "g", color }: MacroBarProps) {
  const pct = Math.min((consumed / target) * 100, 100)
  const remaining = Math.max(target - consumed, 0)
  const over = consumed > target

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">
          <span className={cn("font-medium", over ? "text-destructive" : "text-foreground")}>
            {consumed.toFixed(0)}{unit}
          </span>
          {" / "}{target.toFixed(0)}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {over
          ? `${(consumed - target).toFixed(0)}${unit} over target`
          : `${remaining.toFixed(0)}${unit} remaining`
        }
      </p>
    </div>
  )
}
