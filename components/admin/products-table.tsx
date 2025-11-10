"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { base_url } from "@/constant/constant"
import { set } from "date-fns"

interface Product {
  _id: string
  title: string
  category: string
  price: number
  imageUrl?: string
  customizable?: boolean
  inStock?: boolean
  itemType?: string
}

export function ProductsTable({ searchTerm, categoryFilter }: { searchTerm: string; categoryFilter: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<Partial<Product>>({})
  const [imagePreview, setImagePreview] = useState<string>("")

  // ✅ axios instance with Bearer token
  const axiosAuth = axios.create({
    baseURL: base_url,
    headers: {
      Authorization: `Bearer ${
        typeof window !== "undefined" ? localStorage.getItem("impressa_admin_token") : ""
      }`,
    },
  })

  // ✅ load product list
  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await axiosAuth.get(`/templates`)
      setProducts(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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
    setEditData(res.data)
    setImagePreview("") // reset preview
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
      await axiosAuth.put(`/templates/${editData._id}`, editData)
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
                    <th className="py-3 px-4 text-left">Stock</th>
                    <th className="py-3 px-4 text-left">Custom</th>
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
                            src={product.imageUrl || "/placeholder.svg"}
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 capitalize">{product.title}</td>
                      <td className="py-3 px-4 capitalize">{product.category}</td>
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
            {editData.imageUrl && (
              <div>
                <Label>Current Image</Label>
                <img
                  src={editData.imageUrl}
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
                      setEditData({
                        ...editData,
                        imageUrl: data.secure_url,
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
              <Input
                value={editData.category || ""}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              />
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
