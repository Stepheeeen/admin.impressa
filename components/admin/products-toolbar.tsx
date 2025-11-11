"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, Filter } from "lucide-react"

export function ProductsToolbar({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
}: any) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 md:flex-row md:gap-4 flex-1">
        {/* Search */}
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-scroll md:overflow-visible">
          {["all"].map((category) => (
            <Button
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  )
}