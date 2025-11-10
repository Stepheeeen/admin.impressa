"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Filter } from "lucide-react"
import { CustomersTable } from "@/components/admin/customers-table"
import { useState } from "react"

const customersData = [
  { id: 1, name: "John Doe", email: "john@example.com", orders: 5, spent: "₦9,300,000", status: "VIP" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", orders: 3, spent: "₦4,345,500", status: "Regular" },
  { id: 3, name: "Bob Wilson", email: "bob@example.com", orders: 1, spent: "₦748,500", status: "New" },
]

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredCustomers = customersData.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (statusFilter !== "all") {
    filteredCustomers.filter((customer) => customer.status.toLowerCase() === statusFilter)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-2">View and manage your customers</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {["all", "vip", "regular", "new"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      <CustomersTable searchTerm={searchTerm} statusFilter={statusFilter} />
    </div>
  )
}
