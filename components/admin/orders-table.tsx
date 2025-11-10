"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, CheckCircle, Truck, Package } from "lucide-react"
import { toast } from "sonner"
import { base_url } from "@/constant/constant"

interface Order {
  _id: string
  user: string
  itemType: string
  quantity: number
  totalAmount: number
  deliveryAddress: string
  paymentRef: string
  status: "pending" | "paid" | "shipped" | "delivered"
  createdAt: string
  updatedAt: string
}

interface OrdersTableProps {
  searchTerm: string
  statusFilter: string
}

export function OrdersTable({ searchTerm, statusFilter }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const token = typeof window !== "undefined" ? localStorage.getItem("impressa_admin_token") : null

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${base_url}/orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrders(res.data)
    } catch (err) {
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await axios.patch(
        `${base_url}/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(res.data.message)
      setOrders((prev:any) =>
        prev.map((o:any) => (o._id === id ? { ...o, status } : o))
      )
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update order")
    }
  }

  const deleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return
    try {
      await axios.delete(`${base_url}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Order deleted successfully")
      setOrders((prev) => prev.filter((o) => o._id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete order")
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.paymentRef.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-emerald-100 text-emerald-800",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} found
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, i) => (
                  <tr key={order._id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{i + 1}</td>
                    <td className="py-3 px-4">{order.itemType}</td>
                    <td className="py-3 px-4 font-semibold">₦{order.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4">{order.quantity}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[order.status]}>{order.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-NG")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Mark as Paid"
                            onClick={() => updateOrderStatus(order._id, "paid")}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {order.status === "paid" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Mark as Shipped"
                            onClick={() => updateOrderStatus(order._id, "shipped")}
                          >
                            <Truck className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {order.status === "shipped" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Mark as Delivered"
                            onClick={() => updateOrderStatus(order._id, "delivered")}
                          >
                            <Package className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Order"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteOrder(order._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">No orders found</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
