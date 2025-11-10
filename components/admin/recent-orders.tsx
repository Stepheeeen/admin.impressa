"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { base_url } from "@/constant/constant"

const statusColors = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delivered: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100",
}

interface Order {
  _id: string
  itemType: string
  totalAmount: number
  status: string
  paymentRef: string
  createdAt: string
}

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("impressa_admin_token") // 🔑 Adjust if you're using cookies or context
        const res = await axios.get(`${base_url}/orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        // Sort by latest and pick top 5
        const latest = res.data.sort(
          (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setOrders(latest.slice(0, 5))
      } catch (err) {
        console.error("Failed to fetch orders:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Your last 5 orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent orders found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Item Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{order.paymentRef}</td>
                    <td className="py-3 px-4">{order.itemType}</td>
                    <td className="py-3 px-4">₦{order.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
