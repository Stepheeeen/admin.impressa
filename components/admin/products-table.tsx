"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { base_url } from "@/constant/constant"
import { set } from "date-fns"

interface Product {
  _id: string
  title: string
  category: string
  price: number
  imageUrl?: string
  imageUrls?: string[]
  image?: string
  images?: string[]
  description?: string
  colors?: string[]
  isFeatured?: boolean
  tags?: string[]
  customizable?: boolean
  inStock?: boolean
  itemType?: string
  sizes?: string[]
  createdAt?: string
}

export function ProductsTable({
  searchTerm,
  categoryFilter,
  refreshSignal,
}: { searchTerm: string; categoryFilter: string; refreshSignal?: number }) {
   const [products, setProducts] = useState<Product[]>([])
   const [selectedProducts, setSelectedProducts] = useState<string[]>([])
   const [loading, setLoading] = useState(true)

   const [editOpen, setEditOpen] = useState(false)
   const [editData, setEditData] = useState<Partial<Product>>({})
   const [imagePreview, setImagePreview] = useState<string>("")
   const [customSizeInput, setCustomSizeInput] = useState("")
   const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
   const CATEGORY_OPTIONS = ["tshirt", "hoodie", "sweatshirt", "mug", "cap", "other"]

  const normalizeSizes = (sizes: any) => {
    if (!Array.isArray(sizes)) return []
    const cleaned = sizes
      .map((s) => (s === null || s === undefined ? "" : String(s).trim()))
      .filter(Boolean)
    return Array.from(new Set(cleaned))
  }

  // ✅ axios instance with Bearer token
  const axiosAuth = axios.create({
    baseURL: base_url,
    headers: {
      Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("impressa_admin_token") : ""
        }`,
    },
  })

  // ✅ load product list
  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await axiosAuth.get(`/templates`)
      setProducts(res.data)
      console.log("Products loaded:", res.data)

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // reload when parent signals a refresh (increments)
  useEffect(() => {
    if (typeof refreshSignal === "number") {
      loadProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal])

  useEffect(() => {
    loadProducts()
  }, [])

  // ✅ view product
  // ✅ toggle stock (mark out of stock / back in stock)
  const handleToggleStock = async (id: string) => {
    const product = products.find((p) => p._id === id)
    if (!product) return

    const newStock = !product.inStock
    const confirmMsg = newStock ? "Mark this product as In Stock?" : "Mark this product Out of Stock?"
    if (!confirm(confirmMsg)) return

    try {
      setLoading(true)
      // send full product update (API expects product fields) - optimistic update locally
      await axiosAuth.patch(`/templates/${id}/stock`, { ...product, inStock: newStock })
      setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, inStock: newStock } : p)))
    } catch (err) {
      console.error('Error toggling stock:', err)
      alert('Failed to update product stock. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ open edit modal + load existing data
  const handleEdit = async (id: string) => {
    const res = await axiosAuth.get(`/templates/${id}`)
    // Normalize incoming data (image field variations, defaults)
    const data = res.data
    const normalized: Partial<Product> = {
      _id: data._id,
      title: data.title || "",
      category: data.category || "",
      price: typeof data.price === "number" ? data.price : Number(data.price) || 0,
      imageUrl: data.imageUrl || data.image || (Array.isArray(data.images) ? data.images[0] : undefined),
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrls ? [data.imageUrls] : (Array.isArray(data.images) ? data.images : data.imageUrl ? [data.imageUrl] : [])),
      description: data.description || "",
      colors: Array.isArray(data.colors) ? data.colors : (data.colors ? data.colors.split(",").map((c:any)=>c.trim()) : []),
      isFeatured: !!data.isFeatured,
      tags: Array.isArray(data.tags) ? data.tags : [],
      customizable: !!data.customizable,
      inStock: data.inStock !== undefined ? !!data.inStock : true,
      itemType: data.itemType || "",
      sizes: normalizeSizes(data.sizes),
      createdAt: data.createdAt,
    }
    setEditData(normalized)
    setImagePreview("") // reset preview
    setCustomSizeInput("")
    setEditOpen(true)
  }

  // ✅ delete product
  const handleDelete = async (id: string) => {
    if (!confirm("Delete product?")) return
    await axiosAuth.delete(`/templates/${id}`)
    setProducts((prev) => prev.filter((p) => p._id !== id))
  }

  // ✅ save edited product
  const saveEdit = async () => {
    if (!editData._id) return
    try {
      setLoading(true)
      // Validate required fields
      const title = (editData.title || "").trim()
      const category = (editData.category || "").trim()
      const price = typeof editData.price === "number" ? editData.price : Number(editData.price)
      if (!title || !category || !price || isNaN(price)) {
        alert("Please provide a valid title, category, and price.")
        setLoading(false)
        return
      }

      // Prepare payload with allowed fields only
      const payload: any = {
        title,
        category,
        price,
        imageUrl: editData.imageUrl,
        imageUrls: editData.imageUrls || (editData.imageUrl ? [editData.imageUrl] : []),
        description: editData.description || "",
        colors: Array.isArray(editData.colors) ? editData.colors : (typeof editData.colors === 'string' ? (editData.colors as string).split(',').map((c)=>c.trim()) : []),
        isFeatured: !!editData.isFeatured,
        tags: Array.isArray(editData.tags) ? editData.tags : [],
        customizable: !!editData.customizable,
        inStock: !!editData.inStock,
        itemType: editData.itemType,
        sizes: normalizeSizes(editData.sizes),
      }

      await axiosAuth.put(`/templates/${editData._id}/edit`, payload)
      await loadProducts() // Refresh the product list
      setEditOpen(false)
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ filter products
  const filteredProducts = products.filter((p) => {
    const searchMatch = p.title.toLowerCase().includes(searchTerm.toLowerCase())
    const categoryMatch = categoryFilter === "all" || p.category === categoryFilter
    return searchMatch && categoryMatch
  })

  // ✅ select logic
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) setSelectedProducts([])
    else setSelectedProducts(filteredProducts.map((p) => p._id))
  }

  const toggleSelect = (id: string) => {
    setSelectedProducts((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Products Catalog</CardTitle>
          <CardDescription>{filteredProducts.length} found</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-center py-6">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={
                          filteredProducts.length > 0 &&
                          selectedProducts.length === filteredProducts.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="py-3 px-4 text-left">Product</th>
                    <th className="py-3 px-4 text-left">Title</th>
                    <th className="py-3 px-4 text-left">Category</th>
                    <th className="py-3 px-4 text-left">Type</th>
                    <th className="py-3 px-4 text-left">Price</th>
                    <th className="py-3 px-4 text-left">Colors</th>
                    <th className="py-3 px-4 text-left">Stock</th>
                    <th className="py-3 px-4 text-left">Custom</th>
                    <th className="py-3 px-4 text-left">Featured</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => toggleSelect(product._id)}
                        />
                      </td>

                      <td className="py-3 px-4 w-[70px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.imageUrl ||
                              product.image ||
                              (product.imageUrls
                                && product.imageUrls
                                [0]) ||
                              "/placeholder.svg"
                            }
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="capitalize font-medium">{product.title}</div>
                        {product.description && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-xl truncate">{product.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize">{product.category}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {(product.colors || []).slice(0, 6).map((c) => (
                            <span
                              key={c}
                              title={c}
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          {product.colors && product.colors.length > 6 && <span className="text-xs text-muted-foreground">+{product.colors.length - 6}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">{product.itemType || "—"}</td>
                      <td className="py-3 px-4 font-semibold">
                        ₦{(product.price).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        {product.inStock ? (
                          <Badge className="bg-green-200 text-green-800">In Stock</Badge>
                        ) : (
                          <Badge className="bg-red-200 text-red-800">Out</Badge>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {product.customizable ? <Badge>Yes</Badge> : <Badge>No</Badge>}
                      </td>

                      <td className="py-3 px-4">
                        {product.isFeatured ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStock(product._id)}
                            className={product.inStock ? 'text-yellow-700' : 'text-green-700'}
                            disabled={loading}
                          >
                            {product.inStock ? 'Mark Out' : 'Mark In'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(product._id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(product._id)}
                          >
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


      {/* ✅ EDIT MODAL WITH CLOUDINARY FILE UPLOAD */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            <div className="flex flex-row justify-evenly items-center space-x-4">
              {/* ✅ Existing Image */}
              {(editData.imageUrl || editData.image || (editData.images && editData.images[0])) && (
                <div>
                  <Label>Current Image</Label>
                  <img
                    src={editData.imageUrl || editData.image || (editData.images && editData.images[0])}
                    alt="old"
                    className="w-32 h-32 object-cover rounded border mt-2"
                  />
                </div>
              )}

              {/* ✅ New Preview */}
              {imagePreview && (
                <div>
                  <Label>New Image Preview</Label>
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-32 h-32 object-cover rounded border mt-2"
                  />
                </div>
              )}
            </div>

            {/* ✅ File Upload */}
            <div>
              <Label>Upload New Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  // ✅ Local preview
                  setImagePreview(URL.createObjectURL(file))

                  // ✅ Upload to Cloudinary
                  const formData = new FormData()
                  formData.append("file", file)
                  formData.append(
                    "upload_preset",
                    "impressa"
                  )

                  try {
                    const upload = await fetch(
                      `https://api.cloudinary.com/v1_1/dlyu92juc/image/upload`,
                      {
                        method: "POST",
                        body: formData,
                      }
                    )

                    const data = await upload.json()

                    if (data.secure_url) {
                          // Append uploaded URL to imageUrls array (replace semantics expected on save)
                          const prevUrls = Array.isArray(editData.imageUrls) ? editData.imageUrls.slice() : (editData.imageUrl ? [editData.imageUrl] : [])
                          prevUrls.push(data.secure_url)
                          setEditData({
                            ...editData,
                            imageUrl: data.secure_url,
                            imageUrls: prevUrls,
                          })
                    }
                  } catch (err) {
                    console.error("Cloudinary Upload Error:", err)
                  }
                }}
              />
            </div>

            {/* ✅ Title */}
            <div>
              <Label>Title</Label>
              <Input
                value={editData.title || ""}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>

            {/* ✅ Category */}
            <div>
              <Label>Category</Label>
              <select
                className="w-full border rounded h-9 px-2 bg-background"
                value={editData.category || ""}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                value={editData.description || ""}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>

            {/* ✅ Colors (comma separated) */}
            <div>
              <Label>Colors (comma separated)</Label>
              <Input
                placeholder="e.g. red, white, black"
                value={(editData.colors || []).join(", ")}
                onChange={(e) => setEditData({ ...editData, colors: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) })}
              />
            </div>

            {/* ✅ Featured */}
            <div className="flex items-center gap-2">
              <input
                id="isFeatured"
                type="checkbox"
                checked={!!editData.isFeatured}
                onChange={(e) => setEditData({ ...editData, isFeatured: e.target.checked })}
              />
              <Label htmlFor="isFeatured">Featured</Label>
            </div>

            {/* ✅ Sizes (multi-select) */}
            <div>
              <Label>Available Sizes</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {SIZE_OPTIONS.map((s) => {
                  const checked = (editData.sizes || []).includes(s)
                  return (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...(editData.sizes || []), s]
                            : (editData.sizes || []).filter((x) => x !== s)
                          setEditData({ ...editData, sizes: normalizeSizes(next) })
                        }}
                      />
                      <span>{s}</span>
                    </label>
                  )
                })}
              </div>

              {/* Custom sizes input */}
              <div className="flex gap-2 items-center mt-3">
                <Input
                  placeholder="Add custom size (e.g. 42, 43, 45)"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const val = customSizeInput.trim()
                    if (!val) return
                    const parts = val.split(",").map((p) => p.trim()).filter(Boolean)
                    const current = Array.isArray(editData.sizes) ? editData.sizes : []
                    setEditData({ ...editData, sizes: normalizeSizes([...current, ...parts]) })
                    setCustomSizeInput("")
                  }}
                >
                  Add
                </Button>
              </div>

              {/* List added sizes with remove option */}
              {normalizeSizes(editData.sizes).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {normalizeSizes(editData.sizes).map((s) => (
                    <div key={s} className="px-2 py-1 bg-muted rounded-full flex items-center gap-2 text-sm">
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = normalizeSizes(editData.sizes).filter((x) => x !== s)
                          setEditData({ ...editData, sizes: next })
                        }}
                        className="text-xs text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ Price */}
            <div>
              <Label>Price</Label>
              <Input
                type="number"
                placeholder="e.g. 20000"
                value={editData.price || 0}
                onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
              />
            </div>

            {/* Optional: Customizable */}
            <div className="flex items-center gap-2">
              <input
                id="customizable"
                type="checkbox"
                checked={!!editData.customizable}
                onChange={(e) => setEditData({ ...editData, customizable: e.target.checked })}
              />
              <Label htmlFor="customizable">Customizable</Label>
            </div>

            {/* Optional: Item Type */}
            <div>
              <Label>Item Type</Label>
              <Input
                placeholder="e.g. clothing"
                value={editData.itemType || ""}
                onChange={(e) => setEditData({ ...editData, itemType: e.target.value })}
              />
            </div>

            {/* ✅ Save */}
            <Button className="w-full" onClick={saveEdit} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
