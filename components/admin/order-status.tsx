"use client"

import { Card } from "@/components/ui/card"

export function OrderStatus() {
  const statuses = [
    { label: "Pending", count: 24, color: "bg-yellow-500" },
    { label: "Processing", count: 18, color: "bg-blue-500" },
    { label: "Completed", count: 156, color: "bg-green-500" },
    { label: "Canceled", count: 5, color: "bg-red-500" },
  ]

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Order Status</h3>
      <div className="space-y-4">
        {statuses.map((status) => (
          <div key={status.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">{status.label}</span>
              <span className="text-white font-semibold">{status.count}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className={`${status.color} h-2 rounded-full`} style={{ width: `${(status.count / 200) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
