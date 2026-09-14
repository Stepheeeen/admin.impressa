"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MarketplaceSettings } from "@/components/admin/marketplace-settings"
import { adminApi, apiError, formatNaira } from "@/lib/admin-api"

type MerchantStatus = "pending" | "approved" | "rejected" | "suspended"

interface Merchant {
  _id: string
  owner: { email: string; username: string } | null
  businessName: string
  description: string
  phone: string
  email: string
  state: string
  address: string
  cacNumber: string
  status: MerchantStatus
  statusReason: string
  bank: { bankName: string; accountName: string; accountNumberLast4: string }
  deliveryFee: number
  commissionPercent: number | null
  effectiveCommissionPercent: number
  ratingAverage: number
  ratingCount: number
  createdAt: string
}

interface MerchantDetail extends Merchant {
  idDocumentUrl: string | null
  products: number
  openOrders: number
}

const FILTERS: { value: MerchantStatus | "all"; label: string }[] = [
  { value: "pending", label: "Applications" },
  { value: "approved", label: "Approved" },
  { value: "suspended", label: "Suspended" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
]

const STATUS_STYLES: Record<MerchantStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  rejected: "bg-gray-100 text-gray-700",
}

export function MerchantsManager() {
  const [filter, setFilter] = useState<MerchantStatus | "all">("pending")
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)

  const [detail, setDetail] = useState<MerchantDetail | null>(null)
  const [reason, setReason] = useState("")
  const [commission, setCommission] = useState("")
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")

  const load = async (status = filter) => {
    setLoading(true)
    try {
      const res = await adminApi().get(`/admin/merchants?status=${status}`)
      setMerchants(res.data)
    } catch (err) {
      toast.error(apiError(err, "Couldn't load merchants."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(filter)
  }, [filter])

  const openDetail = async (id: string) => {
    setActionError("")
    setReason("")
    try {
      const res = await adminApi().get(`/admin/merchants/${id}`)
      setDetail(res.data)
      setCommission(res.data.commissionPercent === null ? "" : String(res.data.commissionPercent))
    } catch (err) {
      toast.error(apiError(err, "Couldn't load that merchant."))
    }
  }

  const act = async (action: "approve" | "reject" | "suspend" | "reinstate") => {
    if (!detail) return
    setBusy(true)
    setActionError("")
    try {
      const body = action === "reject" || action === "suspend" ? { reason } : {}
      const res = await adminApi().post(`/admin/merchants/${detail._id}/${action}`, body)
      toast.success(res.data.message)
      setDetail(null)
      await load()
    } catch (err) {
      setActionError(apiError(err, "Couldn't update the merchant. Try again."))
    } finally {
      setBusy(false)
    }
  }

  const saveCommission = async () => {
    if (!detail) return
    setBusy(true)
    setActionError("")
    try {
      const res = await adminApi().put(`/admin/merchants/${detail._id}/commission`, { commissionPercent: commission })
      toast.success(res.data.message)
      setDetail({ ...detail, ...res.data.merchant })
      await load()
    } catch (err) {
      setActionError(apiError(err, "Couldn't save the commission."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Merchants</h1>
        <p className="text-muted-foreground">Review seller applications and manage approved merchants.</p>
      </div>

      <MarketplaceSettings />

      <Card>
        <CardHeader>
          <CardTitle>Sellers</CardTitle>
          <CardDescription>
            <span className="flex flex-wrap gap-2 pt-2">
              {FILTERS.map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={filter === item.value ? "default" : "outline"}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground">Loading merchants...</p>
          ) : merchants.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              {filter === "pending" ? "No applications waiting for review." : "No merchants here."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 text-left">Business</th>
                    <th className="py-3 px-4 text-left">Owner</th>
                    <th className="py-3 px-4 text-left">State</th>
                    <th className="py-3 px-4 text-left">Delivery fee</th>
                    <th className="py-3 px-4 text-left">Commission</th>
                    <th className="py-3 px-4 text-left">Rating</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left" />
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr key={merchant._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{merchant.businessName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{merchant.owner?.email ?? "—"}</td>
                      <td className="py-3 px-4">{merchant.state}</td>
                      <td className="py-3 px-4 tabular-nums">{formatNaira(merchant.deliveryFee)}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {merchant.effectiveCommissionPercent}%
                        {merchant.commissionPercent !== null && <span className="text-xs text-muted-foreground"> (custom)</span>}
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        {merchant.ratingCount > 0 ? `${merchant.ratingAverage.toFixed(1)} (${merchant.ratingCount})` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={STATUS_STYLES[merchant.status]}>{merchant.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" onClick={() => openDetail(merchant._id)}>
                          {merchant.status === "pending" ? "Review" : "Manage"}
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

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.businessName}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={STATUS_STYLES[detail.status]}>{detail.status}</Badge>
                  <span className="text-muted-foreground">
                    Applied {new Date(detail.createdAt).toLocaleDateString("en-NG")} · {detail.products} products ·{" "}
                    {detail.openOrders} open orders
                  </span>
                </div>
                {detail.statusReason && <p className="rounded bg-muted p-3">Reason: {detail.statusReason}</p>}

                <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Owner account</dt>
                    <dd>{detail.owner?.email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Business email</dt>
                    <dd>{detail.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{detail.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">CAC number</dt>
                    <dd>{detail.cacNumber || "Not given"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Address</dt>
                    <dd>
                      {detail.address}, {detail.state}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Payout account (confirmed with the bank)</dt>
                    <dd>
                      {detail.bank.accountName} · {detail.bank.bankName} ••••{detail.bank.accountNumberLast4}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Delivery fee</dt>
                    <dd>{formatNaira(detail.deliveryFee)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">ID document</dt>
                    <dd>
                      {detail.idDocumentUrl ? (
                        <a href={detail.idDocumentUrl} target="_blank" rel="noreferrer" className="underline">
                          View ID (link expires in 10 minutes)
                        </a>
                      ) : (
                        "Unavailable until Cloudinary is set up"
                      )}
                    </dd>
                  </div>
                </dl>
                {detail.description && <p className="text-muted-foreground">{detail.description}</p>}

                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="merchant-commission">Commission for this merchant (%)</Label>
                  <div className="flex max-w-sm gap-2">
                    <Input
                      id="merchant-commission"
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      placeholder="Use the default"
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={saveCommission} disabled={busy}>
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Leave blank to use the default rate. Applies to new orders.</p>
                </div>

                {(detail.status === "pending" || detail.status === "approved") && (
                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="merchant-reason">
                      {detail.status === "pending" ? "Reason if rejecting (sent to the applicant)" : "Reason if suspending (sent to the merchant)"}
                    </Label>
                    <Textarea id="merchant-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                )}

                {actionError && (
                  <p className="text-sm text-destructive" role="alert">
                    {actionError}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                  {(detail.status === "pending" || detail.status === "rejected") && (
                    <Button onClick={() => act("approve")} disabled={busy}>
                      Approve
                    </Button>
                  )}
                  {detail.status === "pending" && (
                    <Button variant="outline" className="text-destructive" onClick={() => act("reject")} disabled={busy || reason.trim().length < 5}>
                      Reject
                    </Button>
                  )}
                  {detail.status === "approved" && (
                    <Button variant="outline" className="text-destructive" onClick={() => act("suspend")} disabled={busy || reason.trim().length < 5}>
                      Suspend and hide products
                    </Button>
                  )}
                  {detail.status === "suspended" && (
                    <Button onClick={() => act("reinstate")} disabled={busy}>
                      Reinstate
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
