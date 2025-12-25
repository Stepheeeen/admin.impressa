import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  trend?: "up" | "down"
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-2 px-3">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground flex gap-3 items-center"><Icon className="h-4 w-4 text-primary" />{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p
              className={cn(
                "text-xs font-medium",
                trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
