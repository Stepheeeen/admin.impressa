"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { adminApi, apiError, formatNaira } from "@/lib/admin-api"

export interface Parcel {
  _id: string
  sellerName: string
  merchant: string | null
  status: "paid" | "shipped" | "delivered" | "cancelled"
  tracking: { status?: string; code?: string } | null
  items: { title: string; quantity: number; unitPrice: number; size: string | null; color: string | null }[]
  itemsSubtotal: number
  deliveryFee: number
  commissionPercent: number
  commission: number
  payout: number
  payoutStatus: string
  needsAttention: boolean
  oversoldItems: string[]
  deliveredAt: string | null
  returnWindowEndsAt: string | null
}

const STATUS_STYLES: Record<Parcel["status"], string> = {
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-700",
}

// One seller's part of an order, with admin overrides for delivery and cancellation.
export function ParcelCard({ parcel, onChanged }: { parcel: Parcel; onChanged: () => void }) {
  const [stage, setStage] = useState(parcel.tracking?.status ?? "")
  const [code, setCode] = useState(parcel.tracking?.code ?? "")
  const [busy, setBusy] = useState(false)

  const updateTracking = async () => {
    setBusy(true)
    try {
      await adminApi().patch(`/admin/fulfilments/${parcel._id}`, { tracking: { status: stage, code } })
      toast.success("Parcel updated")
      onChanged()
    } catch (err) {
      toast.error(apiError(err, "Couldn't update the parcel."))
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    const reason = prompt("Why is this parcel being cancelled? The customer will be refunded.")
    if (!reason) return
    setBusy(true)
    try {
      const res = await adminApi().post(`/admin/fulfilments/${parcel._id}/cancel`, { reason })
      toast.success(res.data.message)
      onChanged()
    } catch (err) {
      toast.error(apiError(err, "Couldn't cancel the parcel."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium">{parcel.sellerName}</div>
        <Badge className={STATUS_STYLES[parcel.status]}>{parcel.status}</Badge>
      </div>

      {parcel.needsAttention && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-800" role="alert">
          Sold out before payment finished: {parcel.oversoldItems.join(", ") || "some items"}. Cancel the parcel to refund
          the customer, or confirm the seller has more stock.
        </p>
      )}

      <ul className="text-sm">
        {parcel.items.map((item, index) => (
          <li key={index}>
            {item.quantity} × {item.title}
            {item.size ? `, size ${item.size}` : ""}
            {item.color ? `, ${item.color}` : ""} · {formatNaira(item.unitPrice)}
          </li>
        ))}
      </ul>

      <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <span>Items {formatNaira(parcel.itemsSubtotal)} · delivery {formatNaira(parcel.deliveryFee)}</span>
        {parcel.merchant ? (
          <span>
            Commission {parcel.commissionPercent}% ({formatNaira(parcel.commission)}) · payout {formatNaira(parcel.payout)} ({parcel.payoutStatus})
          </span>
        ) : (
          <span>Sold by Impressa</span>
        )}
        {parcel.returnWindowEndsAt && <span>Returns close {new Date(parcel.returnWindowEndsAt).toLocaleDateString("en-NG")}</span>}
      </div>

      {parcel.status !== "cancelled" && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Delivery stage"
            className="h-8 rounded border bg-background px-2 text-sm"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">—</option>
            <option value="processing">Processing</option>
            <option value="in-transit">In transit</option>
            <option value="ready-for-pickup">Ready for pickup</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <input
            aria-label="Tracking code or link"
            className="h-8 w-44 rounded border bg-background px-2 text-sm"
            placeholder="Tracking code/url"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button size="sm" onClick={updateTracking} disabled={busy}>
            Update
          </Button>
          {parcel.status === "paid" && (
            <Button size="sm" variant="outline" className="text-destructive" onClick={cancel} disabled={busy}>
              Cancel and refund
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
