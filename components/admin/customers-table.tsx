"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

const customersData = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    orders: 5,
    spent: "$6,200",
    status: "VIP",
    joinDate: "Jan 15, 2024",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1 (555) 234-5678",
    orders: 3,
    spent: "$2,897",
    status: "Regular",
    joinDate: "Feb 20, 2024",
  },
  {
    id: 3,
    name: "Bob Wilson",
    email: "bob@example.com",
    phone: "+1 (555) 345-6789",
    orders: 1,
    spent: "$499",
    status: "New",
    joinDate: "Oct 30, 2024",
  },
  {
    id: 4,
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "+1 (555) 456-7890",
    orders: 8,
    spent: "$12,450",
    status: "VIP",
    joinDate: "Dec 10, 2023",
  },
  {
    id: 5,
    name: "Charlie Brown",
    email: "charlie@example.com",
    phone: "+1 (555) 567-8901",
    orders: 2,
    spent: "$1,200",
    status: "Regular",
    joinDate: "Mar 5, 2024",
  },
]

interface CustomersTableProps {
  searchTerm: string
  statusFilter: string
}

export function CustomersTable({ searchTerm, statusFilter }: CustomersTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filteredCustomers = customersData.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || customer.status.toLowerCase() === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VIP":
        return "bg-purple-500/10 text-purple-600 border-purple-200"
      case "Regular":
        return "bg-blue-500/10 text-blue-600 border-blue-200"
      case "New":
        return "bg-slate-500/10 text-slate-600 border-slate-200"
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-200"
    }
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Orders</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Total Spent</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-medium">{customer.name}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{customer.email}</td>
                <td className="py-3 px-4 text-sm">{customer.orders}</td>
                <td className="py-3 px-4 font-semibold">{customer.spent}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(customer.status)}`}>
                    {customer.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                    className="text-xs"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">No customers found matching your filters.</div>
      )}
    </Card>
  )
}
