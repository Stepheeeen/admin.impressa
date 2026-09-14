"use client"

import { useEffect, useState } from "react"
import { Edit, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminApi, apiError, formatNaira } from "@/lib/admin-api"

interface Coupon {
  _id: string
  code: string
  description: string
  type: "percent" | "fixed"
  percentOff: number | null
  amountOff: number | null
  maxDiscount: number | null
  minSubtotal: number
  startsAt: string | null
  endsAt: string | null
  usageLimit: number | null
  perCustomerLimit: number
  timesUsed: number
  active: boolean
}

// Numbers are kept as strings while editing; the API treats "" as "not set".
type CouponForm = {
  _id?: string
  code: string
  description: string
  type: "percent" | "fixed"
  percentOff: string
  amountOff: string
  maxDiscount: string
  minSubtotal: string
  startsAt: string
  endsAt: string
  usageLimit: string
  perCustomerLimit: string
  active: boolean
}

const EMPTY_FORM: CouponForm = {
  code: "",
  description: "",
  type: "percent",
  percentOff: "",
  amountOff: "",
  maxDiscount: "",
  minSubtotal: "0",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perCustomerLimit: "1",
  active: true,
}

const text = (value: number | null) => (value === null ? "" : String(value))
const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : "")

const describeDiscount = (coupon: Coupon) =>
  coupon.type === "percent"
    ? `${coupon.percentOff}% off${coupon.maxDiscount ? `, up to ${formatNaira(coupon.maxDiscount)}` : ""}`
    : `${formatNaira(coupon.amountOff ?? 0)} off`

function couponState(coupon: Coupon) {
  const now = Date.now()
  if (!coupon.active) return { label: "Off", className: "bg-gray-100 text-gray-700" }
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return { label: "Scheduled", className: "bg-blue-100 text-blue-800" }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() <= now) return { label: "Expired", className: "bg-gray-100 text-gray-700" }
  if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) return { label: "Used up", className: "bg-yellow-100 text-yellow-800" }
  return { label: "Active", className: "bg-green-100 text-green-800" }
}

export function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi().get("/admin/coupons")
      setCoupons(res.data)
    } catch (err) {
      toast.error(apiError(err, "Couldn't load coupons."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setForm({
      _id: coupon._id,
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      percentOff: text(coupon.percentOff),
      amountOff: text(coupon.amountOff),
      maxDiscount: text(coupon.maxDiscount),
      minSubtotal: String(coupon.minSubtotal),
      startsAt: toDateInput(coupon.startsAt),
      endsAt: toDateInput(coupon.endsAt),
      usageLimit: text(coupon.usageLimit),
      perCustomerLimit: String(coupon.perCustomerLimit),
      active: coupon.active,
    })
    setFormError("")
    setDialogOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError("")
    try {
      const { _id, ...body } = form
      const api = adminApi()
      if (_id) {
        await api.put(`/admin/coupons/${_id}`, body)
        toast.success("Coupon updated")
      } else {
        await api.post("/admin/coupons", body)
        toast.success("Coupon created")
      }
      setDialogOpen(false)
      await load()
    } catch (err) {
      setFormError(apiError(err, "Couldn't save the coupon. Try again."))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (coupon: Coupon) => {
    if (!confirm(`Delete the ${coupon.code} coupon?`)) return
    try {
      await adminApi().delete(`/admin/coupons/${coupon._id}`)
      setCoupons((prev) => prev.filter((c) => c._id !== coupon._id))
      toast.success("Coupon deleted")
    } catch (err) {
      toast.error(apiError(err, "Couldn't delete the coupon."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Discounts apply to items only, never delivery. Customers can combine them with wallet credit.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All coupons</CardTitle>
          <CardDescription>A coupon that has been used can be switched off but not deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground">Loading coupons...</p>
          ) : coupons.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">No coupons yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 text-left">Code</th>
                    <th className="py-3 px-4 text-left">Discount</th>
                    <th className="py-3 px-4 text-left">Minimum spend</th>
                    <th className="py-3 px-4 text-left">Dates</th>
                    <th className="py-3 px-4 text-left">Used</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const state = couponState(coupon)
                    return (
                      <tr key={coupon._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="font-mono font-medium">{coupon.code}</div>
                          {coupon.description && <div className="text-xs text-muted-foreground">{coupon.description}</div>}
                        </td>
                        <td className="py-3 px-4">{describeDiscount(coupon)}</td>
                        <td className="py-3 px-4 tabular-nums">{coupon.minSubtotal > 0 ? formatNaira(coupon.minSubtotal) : "None"}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {coupon.startsAt || coupon.endsAt
                            ? `${toDateInput(coupon.startsAt) || "Now"} → ${toDateInput(coupon.endsAt) || "No end"}`
                            : "Always"}
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          {coupon.timesUsed}
                          {coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ""}
                          <div className="text-xs text-muted-foreground">{coupon.perCustomerLimit} per customer</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={state.className}>{state.label}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)} title="Edit coupon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(coupon)} title="Delete coupon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form._id ? "Edit coupon" : "Add coupon"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Code</Label>
                <Input
                  id="coupon-code"
                  placeholder="e.g. WELCOME10"
                  className="font-mono uppercase"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-type">Discount type</Label>
                <select
                  id="coupon-type"
                  className="h-9 w-full rounded border bg-background px-2"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as CouponForm["type"] })}
                >
                  <option value="percent">Percent off</option>
                  <option value="fixed">Amount off</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-description">Description (optional)</Label>
              <Input
                id="coupon-description"
                placeholder="e.g. 10% off your first order"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {form.type === "percent" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="coupon-percent">Percent off</Label>
                  <Input id="coupon-percent" type="number" min={1} max={100} value={form.percentOff} onChange={(e) => setForm({ ...form, percentOff: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-max">Most off (₦, optional)</Label>
                  <Input id="coupon-max" type="number" min={1} placeholder="No limit" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
              </div>
            ) : (
              <div className="max-w-xs space-y-2">
                <Label htmlFor="coupon-amount">Amount off (₦)</Label>
                <Input id="coupon-amount" type="number" min={1} value={form.amountOff} onChange={(e) => setForm({ ...form, amountOff: e.target.value })} />
              </div>
            )}

            <div className="max-w-xs space-y-2">
              <Label htmlFor="coupon-min">Minimum spend on items (₦)</Label>
              <Input id="coupon-min" type="number" min={0} value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-starts">Starts (optional)</Label>
                <Input id="coupon-starts" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-ends">Ends (optional)</Label>
                <Input id="coupon-ends" type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-limit">Total uses (optional)</Label>
                <Input id="coupon-limit" type="number" min={1} placeholder="Unlimited" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-per-customer">Uses per customer</Label>
                <Input id="coupon-per-customer" type="number" min={1} value={form.perCustomerLimit} onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Customers can use this coupon
            </label>

            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : form._id ? "Save coupon" : "Create coupon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
