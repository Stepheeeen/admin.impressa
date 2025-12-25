"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, CheckCircle, Truck, Package } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { base_url } from "@/constant/constant"

interface DeliveryAddress {
  address: string
  state: string
  country: string
  phone: string
}
export default function OrdersTable() {

interface Order {
  _id: string
  user: string
  itemType: string
  quantity: number
  totalAmount: number
  deliveryAddress: DeliveryAddress
  paymentRef: string
  status: "pending" | "paid" | "shipped" | "delivered"
  createdAt: string
  updatedAt: string
  items?: Array<{
    name?: string
    title?: string
    productName?: string
    qty?: number
    quantity?: number
    size?: string
    color?: string
    variant?: string
    options?: Record<string, any>
  }>
  tracking?: { status?: string; code?: string }
}
  const [loading, setLoading] = useState(false)
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { status?: string; code?: string }>>({})
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const token = typeof window !== "undefined" ? localStorage.getItem("impressa_admin_token") : null

  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

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

  // ✅ Tracking update (status + code)
  const updateTracking = async (id: string, tracking: { status?: string; code?: string }) => {
    try {
      const res = await axios.patch(
        `${base_url}/orders/${id}/tracking`,
        { tracking },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(res.data.message || "Tracking updated")
      setOrders((prev:any) => prev.map((o:any) => (o._id === id ? { ...o, tracking } : o)))
    } catch (err:any) {
      toast.error(err.response?.data?.error || "Failed to update tracking")
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
    const itemsText = (order.items && order.items.length > 0)
      ? order.items.map((it) => (it.name || it.title || it.productName || "")).join(" ")
      : ((order as any).itemNames && (order as any).itemNames.join(" ")) || ""
    const matchesSearch =
      itemsText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.paymentRef.toLowerCase().includes(searchTerm.toLowerCase())
    const normalizedFilter = statusFilter === "completed" ? "delivered" : statusFilter
    const matchesStatus = normalizedFilter === "all" || order.status === normalizedFilter
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
                  <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Delivery</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, i) => (
                  <tr key={order._id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{i + 1}</td>
                    <td className="py-3 px-4 break-words max-w-48">{order._id}</td>
                    <td className="py-3 px-4 font-semibold">₦{order.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4">{order.quantity}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[order.status]}>{order.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span>{order.deliveryAddress.address}</span>
                        <span>{order.deliveryAddress.state}, {order.deliveryAddress.country}</span>
                        <span className="text-gray-500">📱 {order.deliveryAddress.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-NG")}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <select
                            className="border rounded h-8 px-2 bg-background text-sm"
                            value={(trackingInputs[order._id]?.status) ?? order.tracking?.status ?? ""}
                            onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [order._id]: { ...(prev[order._id] || {}), status: e.target.value } }))}
                          >
                            <option value="">—</option>
                            <option value="processing">Processing</option>
                            <option value="in-transit">In transit</option>
                            <option value="ready-for-pickup">Ready for pickup</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                          </select>
                          <input
                            className="border rounded h-8 px-2 bg-background text-sm w-40"
                            placeholder="Tracking code/url"
                            value={(trackingInputs[order._id]?.code) ?? order.tracking?.code ?? ""}
                            onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [order._id]: { ...(prev[order._id] || {}), code: e.target.value } }))}
                          />
                          <Button size="sm" onClick={() => updateTracking(order._id, { status: (trackingInputs[order._id]?.status) ?? order.tracking?.status, code: (trackingInputs[order._id]?.code) ?? order.tracking?.code })} disabled={updatingId === order._id}>
                            Update
                          </Button>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => setViewOrder(order)} title="View items">
                          <Eye className="h-4 w-4" />
                        </Button>

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

            {/* View items modal */}
            {viewOrder && (
              <Dialog open={true} onOpenChange={(open) => { if (!open) setViewOrder(null) }}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Order {viewOrder._id} — Items</DialogTitle>
                  </DialogHeader>

                  <div className="mt-4">
                    <div className="mb-4 text-sm text-muted-foreground">Customer: {typeof viewOrder.user === 'object' ? ((viewOrder.user as any).email ?? (viewOrder.user as any)._id ?? JSON.stringify(viewOrder.user)) : viewOrder.user}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="py-2 px-3 text-left">Image</th>
                            <th className="py-2 px-3 text-left">Product</th>
                            <th className="py-2 px-3 text-left">Size</th>
                            <th className="py-2 px-3 text-left">Color</th>
                            <th className="py-2 px-3 text-left">Qty</th>
                            <th className="py-2 px-3 text-left">Options</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewOrder.items && viewOrder.items.length > 0
                            ? viewOrder.items
                            : ((viewOrder as any).itemNames || []).map((n: string) => ({ name: n })))
                            .map((it: any, idx: number) => (
                              <tr key={idx} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3 align-top">
                                  <img
                                    src={it.image || it.imageUrl || (it.imageUrls && it.imageUrls[0]) || "/placeholder.jpg"}
                                    alt={it.name || it.title || it.productName || "item"}
                                    className="w-14 h-14 object-cover rounded"
                                  />
                                </td>
                                <td className="py-2 px-3 align-top max-w-xs break-words">{it.name || it.title || it.productName || ((viewOrder as any).itemNames && (viewOrder as any).itemNames[idx]) || "Unknown product"}</td>
                                <td className="py-2 px-3 align-top">{it.size ?? it.options?.size ?? "—"}</td>
                                <td className="py-2 px-3 align-top">{it.color ?? it.options?.color ?? "—"}</td>
                                <td className="py-2 px-3 align-top">{it.qty ?? it.quantity ?? 1}</td>
                                <td className="py-2 px-3 align-top">
                                  {it.options ? Object.entries(it.options).map(([k, v]) => (
                                    <div key={k} className="text-xs text-muted-foreground">{k}: {String(v)}</div>
                                  )) : ((it as any).sku ? <div className="text-xs text-muted-foreground">SKU: {(it as any).sku}</div> : "—")}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button onClick={() => setViewOrder(null)}>Close</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {filteredOrders.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">No orders found</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
