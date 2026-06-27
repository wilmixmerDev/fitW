"use client"

import { motion } from "motion/react"

interface CalorieRingProps {
  consumed: number
  target: number
}

function fmt(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const pct = Math.min(consumed / target, 1)
  const radius = 70
  const stroke = 10
  const normalizedR = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedR
  const dashOffset = circumference * (1 - pct)
  const remaining = Math.max(target - consumed, 0)
  const over = consumed > target

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={radius * 2} height={radius * 2} className="-rotate-90">
          <circle
            cx={radius} cy={radius} r={normalizedR}
            fill="none" stroke="currentColor" strokeWidth={stroke}
            className="text-muted/60"
          />
          <motion.circle
            cx={radius} cy={radius} r={normalizedR}
            fill="none" stroke="currentColor" strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={over ? "text-destructive" : "text-primary"}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold tabular-nums"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {fmt(consumed)}
          </motion.span>
          <span className="text-xs text-muted-foreground">kcal</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center w-full max-w-xs">
        <div>
          <p className="text-2xl font-bold tabular-nums">{fmt(target)}</p>
          <p className="text-xs text-muted-foreground">Meta</p>
        </div>
        <div className="border-x border-border">
          <p className={`text-2xl font-bold tabular-nums ${over ? "text-destructive" : "text-primary"}`}>
            {over ? `+${fmt(consumed - target)}` : fmt(remaining)}
          </p>
          <p className="text-xs text-muted-foreground">{over ? "Extra" : "Quedan"}</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{Math.round(pct * 100)}%</p>
          <p className="text-xs text-muted-foreground">Hecho</p>
        </div>
      </div>
    </div>
  )
}
