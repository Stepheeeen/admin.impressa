"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function ProductsPageHeader({ onAdd }: any) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-2">Manage your product catalog</p>
      </div>

      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add Product
      </Button>
    </div>
  )
}
