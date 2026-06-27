"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BookOpen, TrendingUp, Settings, LogOut, Leaf, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useT } from "@/contexts/language-context"

export function Sidebar() {
  const pathname = usePathname()
  const t = useT()

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t.nav.dashboard },
    { href: "/log", icon: BookOpen, label: t.nav.log },
    { href: "/recipes", icon: ChefHat, label: t.nav.recipes },
    { href: "/progress", icon: TrendingUp, label: t.nav.progress },
    { href: "/settings", icon: Settings, label: t.nav.settings },
  ]

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0 p-4">
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Leaf className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">fitW</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive px-3"
        >
          <LogOut className="w-4 h-4" />
          {t.nav.signOut}
        </Button>
      </div>
    </aside>
  )
}
