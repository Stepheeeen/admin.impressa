"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { adminApi, apiError, formatNaira } from "@/lib/admin-api"

type ReturnStatus = "requested" | "rejected-by-merchant" | "escalated" | "refunded" | "declined"

interface ReturnRequest {
  _id: string
  orderNumber: string
  items: { title: string; quantity: number; unitPrice: number }[]
  itemsValue: number
  reason: "faulty" | "wrong-item" | "not-as-described" | "changed-mind"
  details: string
  photoUrls: string[]
  refundTo: "wallet" | "card"
  returnShippingPaidBy: "merchant" | "customer"
  status: ReturnStatus
  merchantRespondBy: string
  merchantNote: string
  customerNote: string
  adminNote: string
  refund: { amount: number; toCard: number; toWallet: number } | null
  sellerName: string
  customerName: string
  createdAt: string
}

const FILTERS = [
  { value: "escalated", label: "Needs a decision" },
  { value: "open", label: "All open" },
  { value: "all", label: "All" },
] as const

const REASONS: Record<ReturnRequest["reason"], string> = {
  faulty: "Faulty",
  "wrong-item": "Wrong item",
  "not-as-described": "Not as described",
  "changed-mind": "Changed mind",
}

const STATUS_LABELS: Record<ReturnStatus, { label: string; className: string }> = {
  requested: { label: "Waiting for seller", className: "bg-yellow-100 text-yellow-800" },
  "rejected-by-merchant": { label: "Seller declined", className: "bg-orange-100 text-orange-800" },
  escalated: { label: "Needs a decision", className: "bg-red-100 text-red-800" },
  refunded: { label: "Refunded", className: "bg-green-100 text-green-800" },
  declined: { label: "Declined", className: "bg-gray-100 text-gray-700" },
}

const OPEN: ReturnStatus[] = ["requested", "rejected-by-merchant", "escalated"]

export function ReturnsManager() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("escalated")
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ReturnRequest | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const load = async (status = filter) => {
    setLoading(true)
    try {
      const res = await adminApi().get(`/admin/returns?status=${status}`)
      setReturns(res.data)
    } catch (err) {
      toast.error(apiError(err, "Couldn't load returns."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(filter)
  }, [filter])

  const open = (request: ReturnRequest) => {
    setSelected(request)
    setNote("")
    setError("")
  }

  const decide = async (decision: "approve" | "decline") => {
    if (!selected) return
    setBusy(true)
    setError("")
    try {
      const res = await adminApi().post(`/admin/returns/${selected._id}/${decision}`, { note })
      toast.success(res.data.message)
      setSelected(null)
      await load()
    } catch (err) {
      setError(apiError(err, "Couldn't save the decision. Try again."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Returns</h1>
        <p className="text-muted-foreground">
          Returns come here when the seller doesn't respond in time, the customer disputes a declined return, or the item was sold by Impressa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return requests</CardTitle>
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
            <p className="py-6 text-center text-muted-foreground">Loading returns...</p>
          ) : returns.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">{filter === "escalated" ? "Nothing needs a decision." : "No returns here."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 text-left">Order</th>
                    <th className="py-3 px-4 text-left">Seller</th>
                    <th className="py-3 px-4 text-left">Customer</th>
                    <th className="py-3 px-4 text-left">Items</th>
                    <th className="py-3 px-4 text-left">Value</th>
                    <th className="py-3 px-4 text-left">Reason</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left" />
                  </tr>
                </thead>
                <tbody>
                  {returns.map((request) => (
                    <tr key={request._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono">#{request.orderNumber}</td>
                      <td className="py-3 px-4">{request.sellerName}</td>
                      <td className="py-3 px-4">{request.customerName}</td>
                      <td className="py-3 px-4">{request.items.map((item) => `${item.quantity} × ${item.title}`).join(", ")}</td>
                      <td className="py-3 px-4 tabular-nums">{formatNaira(request.itemsValue)}</td>
                      <td className="py-3 px-4">{REASONS[request.reason]}</td>
                      <td className="py-3 px-4">
                        <Badge className={STATUS_LABELS[request.status].className}>{STATUS_LABELS[request.status].label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" onClick={() => open(request)}>
                          {OPEN.includes(request.status) ? "Review" : "View"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(isOpen) => !isOpen && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Return for order #{selected.orderNumber} · {REASONS[selected.reason]}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p>
                  {selected.items.map((item) => `${item.quantity} × ${item.title}`).join(", ")} ·{" "}
                  <span className="tabular-nums">{formatNaira(selected.itemsValue)}</span> · refund to {selected.refundTo} · return delivery paid by{" "}
                  {selected.returnShippingPaidBy}
                </p>
                <div>
                  <p className="font-medium">Customer says</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{selected.details}</p>
                </div>
                {selected.photoUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selected.photoUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="Photo from the customer" className="h-24 w-24 rounded border object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                {selected.merchantNote && (
                  <div>
                    <p className="font-medium">Seller's response</p>
                    <p className="text-muted-foreground">{selected.merchantNote}</p>
                  </div>
                )}
                {selected.customerNote && (
                  <div>
                    <p className="font-medium">Customer's reply</p>
                    <p className="text-muted-foreground">{selected.customerNote}</p>
                  </div>
                )}
                {selected.refund && (
                  <p className="rounded bg-green-50 p-3 text-green-800">
                    Refunded {formatNaira(selected.refund.amount)}
                    {selected.refund.toCard > 0 && ` (${formatNaira(selected.refund.toCard)} to card`}
                    {selected.refund.toCard > 0 && selected.refund.toWallet > 0 && `, ${formatNaira(selected.refund.toWallet)} to wallet)`}
                    {selected.refund.toCard > 0 && selected.refund.toWallet === 0 && ")"}
                    .
                  </p>
                )}
                {selected.adminNote && <p className="rounded bg-muted p-3">Decision note: {selected.adminNote}</p>}

                {OPEN.includes(selected.status) && (
                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="return-note">Note (sent to the customer if you decline)</Label>
                    <Textarea id="return-note" value={note} onChange={(e) => setNote(e.target.value)} />
                    {error && (
                      <p className="text-destructive" role="alert">
                        {error}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => decide("decline")} disabled={busy || note.trim().length < 10}>
                        Decline
                      </Button>
                      <Button onClick={() => decide("approve")} disabled={busy || note.trim().length < 10}>
                        Approve and refund
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
