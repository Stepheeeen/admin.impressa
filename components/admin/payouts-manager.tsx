"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { adminApi, apiError, formatNaira } from "@/lib/admin-api"

type PayoutStatus = "processing" | "paid" | "failed"

interface Payout {
  _id: string
  merchant: { _id: string; businessName: string } | null
  amount: number
  orders: number
  reference: string
  status: PayoutStatus
  failureReason: string | null
  attempts: number
  paidAt: string | null
  createdAt: string
}

const FILTERS: { value: PayoutStatus | "all"; label: string }[] = [
  { value: "failed", label: "Failed" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "all", label: "All" },
]

const STATUS_STYLES: Record<PayoutStatus, string> = {
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

export function PayoutsManager() {
  const [filter, setFilter] = useState<PayoutStatus | "all">("failed")
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)

  const load = async (status = filter) => {
    setLoading(true)
    try {
      const res = await adminApi().get(`/admin/payouts?status=${status}`)
      setPayouts(res.data)
    } catch (err) {
      toast.error(apiError(err, "Couldn't load payouts."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(filter)
  }, [filter])

  const retry = async (payout: Payout) => {
    setRetrying(payout._id)
    try {
      const res = await adminApi().post(`/admin/payouts/${payout._id}/retry`)
      toast.success(res.data.message)
      await load()
    } catch (err) {
      toast.error(apiError(err, "Couldn't retry the payout."))
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="text-muted-foreground">
          Merchants are paid automatically once an order is delivered and its returns window has passed. Failed payouts retry
          every hour, up to 5 times.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merchant payouts</CardTitle>
          <CardDescription>
            <span className="flex flex-wrap gap-2 pt-2">
              {FILTERS.map((item) => (
                <Button key={item.value} size="sm" variant={filter === item.value ? "default" : "outline"} onClick={() => setFilter(item.value)}>
                  {item.label}
                </Button>
              ))}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground">Loading payouts...</p>
          ) : payouts.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">{filter === "failed" ? "No failed payouts." : "No payouts here."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 text-left">Merchant</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-left">Orders</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Details</th>
                    <th className="py-3 px-4 text-left">Created</th>
                    <th className="py-3 px-4 text-left" />
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{payout.merchant?.businessName ?? "—"}</td>
                      <td className="py-3 px-4 text-right tabular-nums">{formatNaira(payout.amount)}</td>
                      <td className="py-3 px-4">{payout.orders}</td>
                      <td className="py-3 px-4">
                        <Badge className={STATUS_STYLES[payout.status]}>{payout.status}</Badge>
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        {payout.status === "paid" && payout.paidAt
                          ? `Paid ${new Date(payout.paidAt).toLocaleString("en-NG")}`
                          : payout.failureReason ?? `Attempt ${payout.attempts}`}
                        <div className="font-mono text-xs text-muted-foreground">{payout.reference}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(payout.createdAt).toLocaleDateString("en-NG")}</td>
                      <td className="py-3 px-4">
                        {payout.status !== "paid" && (
                          <Button size="sm" variant="outline" onClick={() => retry(payout)} disabled={retrying === payout._id}>
                            {retrying === payout._id ? "Retrying..." : "Retry"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
