"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Flame, Footprints, Bike, Dumbbell, Plus } from "lucide-react"

interface NeatDialogProps {
  onClose: () => void
  onAdd: (calories: number, label: string) => void
}

const PRESETS = [
  { label: "Caminata 2.5 km", kcal: 160, icon: Footprints },
  { label: "Caminata 5 km",   kcal: 320, icon: Footprints },
  { label: "Bicicleta 30 min", kcal: 250, icon: Bike },
  { label: "Cardio 30 min",   kcal: 300, icon: Flame },
  { label: "Cardio 60 min",   kcal: 600, icon: Flame },
  { label: "HIIT 20 min",     kcal: 280, icon: Dumbbell },
]

export function NeatDialog({ onClose, onAdd }: NeatDialogProps) {
  const [custom, setCustom] = useState("")

  function handlePreset(kcal: number, label: string) {
    onAdd(kcal, label)
    onClose()
  }

  function handleCustom() {
    const kcal = Number(custom)
    if (!kcal || kcal <= 0) return
    onAdd(kcal, `Actividad personalizada`)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            Actividad extra / NEAT
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-1 mb-1">
          Las calorías quemadas se suman a tu meta del día. Tu balance neto sigue protegido.
        </p>

        <div className="space-y-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.kcal, p.label)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm"
            >
              <div className="flex items-center gap-2.5">
                <p.icon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{p.label}</span>
              </div>
              <span className="text-primary font-semibold">+{p.kcal} kcal</span>
            </button>
          ))}
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <Label className="text-xs">Personalizado (kcal quemadas)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="ej. 450"
              min={1}
              max={2000}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCustom} disabled={!custom || Number(custom) <= 0} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
