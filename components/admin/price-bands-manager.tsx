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

interface PriceBand {
  _id: string
  label: string
  minPrice: number
  maxPrice: number | null
  sortOrder: number
  active: boolean
}

type PriceBandForm = { _id?: string; label: string; minPrice: string; maxPrice: string; sortOrder: number; active: boolean }

const EMPTY_FORM: PriceBandForm = { label: "", minPrice: "0", maxPrice: "", sortOrder: 0, active: true }

const describeRange = (band: PriceBand) =>
  band.maxPrice === null
    ? `${formatNaira(band.minPrice)} and above`
    : `${formatNaira(band.minPrice)} up to ${formatNaira(band.maxPrice)}`

export function PriceBandsManager() {
  const [bands, setBands] = useState<PriceBand[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<PriceBandForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi().get("/admin/price-bands")
      setBands(res.data)
    } catch (err) {
      toast.error(apiError(err, "Couldn't load price bands."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, sortOrder: bands.length })
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (band: PriceBand) => {
    setForm({
      _id: band._id,
      label: band.label,
      minPrice: String(band.minPrice),
      maxPrice: band.maxPrice === null ? "" : String(band.maxPrice),
      sortOrder: band.sortOrder,
      active: band.active,
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
        await api.put(`/admin/price-bands/${_id}`, body)
        toast.success("Price band updated")
      } else {
        await api.post("/admin/price-bands", body)
        toast.success("Price band created")
      }
      setDialogOpen(false)
      await load()
    } catch (err) {
      setFormError(apiError(err, "Couldn't save the price band. Try again."))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (band: PriceBand) => {
    if (!confirm(`Delete the "${band.label}" price band?`)) return
    try {
      await adminApi().delete(`/admin/price-bands/${band._id}`)
      setBands((prev) => prev.filter((b) => b._id !== band._id))
      toast.success("Price band deleted")
    } catch (err) {
      toast.error(apiError(err, "Couldn't delete the price band."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Price bands</h1>
          <p className="text-muted-foreground">The "Shop by amount" sections on the app's home screen.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add price band
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All price bands</CardTitle>
          <CardDescription>
            Each band includes its minimum price and goes up to, but not including, its maximum, so a ₦5,000 product
            appears in "₦5,000 – ₦15,000", not "Under ₦5,000".
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground">Loading price bands...</p>
          ) : bands.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No price bands yet. Try Under ₦5,000, ₦5,000 – ₦15,000, ₦15,000 – ₦50,000 and ₦50,000 and above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 text-left">Label</th>
                    <th className="py-3 px-4 text-left">Prices</th>
                    <th className="py-3 px-4 text-left">Order</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bands.map((band) => (
                    <tr key={band._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{band.label}</td>
                      <td className="py-3 px-4 tabular-nums">{describeRange(band)}</td>
                      <td className="py-3 px-4">{band.sortOrder}</td>
                      <td className="py-3 px-4">
                        {band.active ? (
                          <Badge className="bg-green-100 text-green-800">Shown</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700">Hidden</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(band)} title="Edit price band">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(band)} title="Delete price band">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form._id ? "Edit price band" : "Add price band"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="band-label">Label</Label>
              <Input
                id="band-label"
                placeholder="e.g. Under ₦5,000"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="band-min">Minimum price (₦)</Label>
                <Input
                  id="band-min"
                  type="number"
                  min={0}
                  value={form.minPrice}
                  onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="band-max">Maximum price (₦)</Label>
                <Input
                  id="band-max"
                  type="number"
                  min={1}
                  placeholder="No limit"
                  value={form.maxPrice}
                  onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="band-order">Display order</Label>
                <Input
                  id="band-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>
              <label className="flex h-9 items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Show in the app
              </label>
            </div>

            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : form._id ? "Save price band" : "Create price band"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
