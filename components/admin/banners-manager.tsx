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
import { adminApi, apiError } from "@/lib/admin-api"
import { uploadToCloudinary } from "@/lib/cloudinary"

type LinkType = "none" | "product" | "category" | "priceBand"

interface Banner {
  _id: string
  title: string
  subtitle?: string
  imageUrl: string
  linkType: LinkType
  linkValue?: string
  startsAt?: string | null
  endsAt?: string | null
  sortOrder: number
  active: boolean
}

interface ProductOption {
  _id: string
  title: string
  category: string
}

interface PriceBandOption {
  _id: string
  label: string
}

type BannerForm = Omit<Banner, "_id" | "startsAt" | "endsAt"> & { _id?: string; startsAt: string; endsAt: string }

const EMPTY_FORM: BannerForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkType: "none",
  linkValue: "",
  startsAt: "",
  endsAt: "",
  sortOrder: 0,
  active: true,
}

const LINK_TYPE_LABELS: Record<LinkType, string> = {
  none: "Nothing",
  product: "A product",
  category: "A category",
  priceBand: "A price band",
}

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "")

function bannerState(banner: Banner) {
  const now = Date.now()
  if (!banner.active) return { label: "Off", className: "bg-gray-100 text-gray-700" }
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) return { label: "Scheduled", className: "bg-blue-100 text-blue-800" }
  if (banner.endsAt && new Date(banner.endsAt).getTime() <= now) return { label: "Ended", className: "bg-gray-100 text-gray-700" }
  return { label: "Live", className: "bg-green-100 text-green-800" }
}

export function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [priceBands, setPriceBands] = useState<PriceBandOption[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const categories = Array.from(new Set(products.map((p) => p.category.trim().toLowerCase()).filter(Boolean))).sort()

  const load = async () => {
    setLoading(true)
    try {
      const api = adminApi()
      const [bannerRes, productRes, bandRes] = await Promise.all([
        api.get("/admin/banners"),
        api.get("/templates"),
        api.get("/admin/price-bands"),
      ])
      setBanners(bannerRes.data)
      setProducts(productRes.data)
      setPriceBands(bandRes.data)
    } catch (err) {
      toast.error(apiError(err, "Couldn't load banners."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, sortOrder: banners.length })
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (banner: Banner) => {
    setForm({
      ...banner,
      subtitle: banner.subtitle ?? "",
      linkValue: banner.linkValue ?? "",
      startsAt: toDateInput(banner.startsAt),
      endsAt: toDateInput(banner.endsAt),
    })
    setFormError("")
    setDialogOpen(true)
  }

  const describeLink = (banner: Banner) => {
    switch (banner.linkType) {
      case "product":
        return `Product: ${products.find((p) => p._id === banner.linkValue)?.title ?? "deleted product"}`
      case "category":
        return `Category: ${banner.linkValue}`
      case "priceBand":
        return `Price band: ${priceBands.find((b) => b._id === banner.linkValue)?.label ?? "deleted band"}`
      default:
        return "Doesn't open anything"
    }
  }

  const handleImage = async (file?: File) => {
    if (!file) return
    setUploading(true)
    setFormError("")
    try {
      const imageUrl = await uploadToCloudinary(file, "image")
      setForm((prev) => ({ ...prev, imageUrl }))
    } catch (err) {
      setFormError(apiError(err, "Image upload failed. Try again."))
    } finally {
      setUploading(false)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError("")
    try {
      const { _id, ...body } = form
      const api = adminApi()
      if (_id) {
        await api.put(`/admin/banners/${_id}`, body)
        toast.success("Banner updated")
      } else {
        await api.post("/admin/banners", body)
        toast.success("Banner created")
      }
      setDialogOpen(false)
      await load()
    } catch (err) {
      setFormError(apiError(err, "Couldn't save the banner. Try again."))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (banner: Banner) => {
    if (!confirm(`Delete the "${banner.title}" banner?`)) return
    try {
      await adminApi().delete(`/admin/banners/${banner._id}`)
      setBanners((prev) => prev.filter((b) => b._id !== banner._id))
      toast.success("Banner deleted")
    } catch (err) {
      toast.error(apiError(err, "Couldn't delete the banner."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-muted-foreground">Shown at the top of the app's home screen, in display order.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All banners</CardTitle>
          <CardDescription>
            {banners.filter((b) => bannerState(b).label === "Live").length} live of {banners.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-muted-foreground">Loading banners...</p>
          ) : banners.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">No banners yet. Add one to feature a sale or new collection.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 text-left">Image</th>
                    <th className="py-3 px-4 text-left">Banner</th>
                    <th className="py-3 px-4 text-left">Opens</th>
                    <th className="py-3 px-4 text-left">Schedule</th>
                    <th className="py-3 px-4 text-left">Order</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((banner) => {
                    const state = bannerState(banner)
                    return (
                      <tr key={banner._id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <img src={banner.imageUrl} alt="" className="h-12 w-24 rounded object-cover" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{banner.title}</div>
                          {banner.subtitle && <div className="text-xs text-muted-foreground">{banner.subtitle}</div>}
                        </td>
                        <td className="py-3 px-4">{describeLink(banner)}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {banner.startsAt || banner.endsAt
                            ? `${toDateInput(banner.startsAt) || "Now"} → ${toDateInput(banner.endsAt) || "No end"}`
                            : "Always"}
                        </td>
                        <td className="py-3 px-4">{banner.sortOrder}</td>
                        <td className="py-3 px-4">
                          <Badge className={state.className}>{state.label}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(banner)} title="Edit banner">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(banner)} title="Delete banner">
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
            <DialogTitle>{form._id ? "Edit banner" : "Add banner"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banner-image">Image</Label>
              {form.imageUrl && <img src={form.imageUrl} alt="" className="aspect-[2/1] w-full rounded border object-cover" />}
              <Input
                id="banner-image"
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => handleImage(e.target.files?.[0])}
              />
              <p className="text-xs text-muted-foreground">
                {uploading ? "Uploading image..." : "Use a wide image, 1200 × 600 px. The title is shown over the bottom of it."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-title">Title</Label>
              <Input
                id="banner-title"
                placeholder="e.g. Weekend sale: 20% off dresses"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-subtitle">Subtitle (optional)</Label>
              <Input
                id="banner-subtitle"
                placeholder="e.g. Ends Sunday"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-link-type">When tapped, open</Label>
              <select
                id="banner-link-type"
                className="h-9 w-full rounded border bg-background px-2"
                value={form.linkType}
                onChange={(e) => setForm({ ...form, linkType: e.target.value as LinkType, linkValue: "" })}
              >
                {(Object.keys(LINK_TYPE_LABELS) as LinkType[]).map((type) => (
                  <option key={type} value={type}>
                    {LINK_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>

              {form.linkType === "product" && (
                <select
                  aria-label="Product"
                  className="h-9 w-full rounded border bg-background px-2"
                  value={form.linkValue}
                  onChange={(e) => setForm({ ...form, linkValue: e.target.value })}
                >
                  <option value="">Choose a product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}
              {form.linkType === "category" && (
                <select
                  aria-label="Category"
                  className="h-9 w-full rounded border bg-background px-2 capitalize"
                  value={form.linkValue}
                  onChange={(e) => setForm({ ...form, linkValue: e.target.value })}
                >
                  <option value="">Choose a category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
              {form.linkType === "priceBand" && (
                <select
                  aria-label="Price band"
                  className="h-9 w-full rounded border bg-background px-2"
                  value={form.linkValue}
                  onChange={(e) => setForm({ ...form, linkValue: e.target.value })}
                >
                  <option value="">Choose a price band</option>
                  {priceBands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="banner-starts">Starts (optional)</Label>
                <Input id="banner-starts" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-ends">Ends (optional)</Label>
                <Input id="banner-ends" type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="banner-order">Display order</Label>
                <Input
                  id="banner-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>
              <label className="flex h-9 items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Show this banner
              </label>
            </div>

            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={saving || uploading}>
              {saving ? "Saving..." : form._id ? "Save banner" : "Create banner"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
