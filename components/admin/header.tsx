"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Menu button for mobile */}
        {/* <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button> */}

        <h1 className="text-lg font-semibold text-foreground flex-1 lg:flex-initial ml-5"></h1>

        {/* Right side actions - Add user profile, notifications, etc. here */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            I
          </div>
        </div>
      </div>
    </header>
  )
}
