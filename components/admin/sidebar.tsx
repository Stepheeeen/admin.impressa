"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, ShoppingCart, Package, Users, Menu, X, LogOut } from "lucide-react"

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  // {
  //   label: "Customers",
  //   href: "/admin/customers",
  //   icon: Users,
  // },
]

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Toggle Button - shown on small screens */}
      <button onClick={onToggle} className="fixed left-4 top-5 z-40 lg:hidden">
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <div className="font-bold text-lg text-sidebar-foreground ml-5">Impressa</div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)

              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent"
              onClick={() => {
                // Handle logout
                window.location.href = "/"
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onToggle} />}
    </>
  )
}
