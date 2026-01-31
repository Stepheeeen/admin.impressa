"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus, Trash, Edit } from "lucide-react"
import { base_url } from "@/constant/constant"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function AddProductModal({ open, onClose, onSuccess }: any) {
  const [title, setTitle] = useState("")
  const [itemType, setItemType] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState("")
  const [description, setDescription] = useState("")

  // new fields required by backend/controller
  const [customizable, setCustomizable] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [tags, setTags] = useState("")

  const [itemTypeOptions, setItemTypeOptions] = useState([
    "t-shirt",
    "hoodie",
    "sweatshirt",
    "cap",
    "mug",
    "phone case",
    "poster",
    "sticker",
    "jacket",
    "long sleeve",
  ])

  const [categoryOptions, setCategoryOptions] = useState([
    "all",
    "clothing",
    "luxury dress",
    "bags",
    "shoes",
    "accessories",
    "shorts",
    "home & living",
    "print items",
    "stickers",
    "others",
  ])

  // Custom option fields
  const [showCustomItemType, setShowCustomItemType] = useState(false)
  const [customItemType, setCustomItemType] = useState("")

  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState("")

  // Sizes
  const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
  // Preset size maps for various categories
  const SIZE_PRESETS: Record<string, string[] | "numeric"> = {
    clothing: SIZE_OPTIONS,
    "luxury dress": SIZE_OPTIONS,
    shorts: ["28", "30", "32", "34", "36", "38", "40"],
    bags: ["Small", "Medium", "Large"],
    shoes: "numeric",
    accessories: ["One Size"],
  }

  // custom size input for adding arbitrary sizes (or numeric shoe sizes)
  const [customSizeInput, setCustomSizeInput] = useState("")

  // Images (for current product being edited/added to batch)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImg, setUploadingImg] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // per-field validation messages shown inline when adding to batch
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Batch: multiple products to create in one request
  const [productsBatch, setProductsBatch] = useState<any[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null) // null means not editing a batch item

  const uploadToCloudinary = async (file: File) => {
    const cloudName = "dlyu92juc"
    const preset = "impressa"

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", preset)

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    )

    return res.data.secure_url
  }

  const handleImageChange = (e: any) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setImageFiles(files as File[])
    setImagePreviews(files.map((file: any) => URL.createObjectURL(file)))
  }

  const toggleSize = (size: string, checked: boolean) => {
    setSizes((prev) => (checked ? [...prev, size] : prev.filter((s) => s !== size)))
  }

  const addCustomSize = () => {
    const val = customSizeInput.trim()
    if (!val) return
    // allow comma separated input to add multiple sizes
    const parts = val.split(",").map((p) => p.trim()).filter(Boolean)
    setSizes((prev) => {
      const next = [...prev]
      for (const p of parts) {
        if (!next.includes(p)) next.push(p)
      }
      return next
    })
    setCustomSizeInput("")
  }

  const removeSize = (size: string) => {
    setSizes((prev) => prev.filter((s) => s !== size))
  }

  const addCustomItemType = () => {
    if (!customItemType.trim()) return
    const option = customItemType.trim().toLowerCase()
    setItemTypeOptions((prev) => [...prev, option])
    setItemType(option)
    setCustomItemType("")
    setShowCustomItemType(false)
  }

  const addCustomCategory = () => {
    if (!customCategory.trim()) return
    const option = customCategory.trim().toLowerCase()
    setCategoryOptions((prev) => [...prev, option])
    setCategory(option)
    setCustomCategory("")
    setShowCustomCategory(false)
  }

  // Build product payload object (used for batch and single upload)
  const buildProductPayload = (imageUrls: string[]) => {
    return {
      title,
      itemType,
      category,
      imageUrls: imageUrls,
      price: Number(price),
      sizes: sizes || [],
      colors: colors ? colors.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean) : [],
      tags: tags ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      customizable,
      isFeatured,
      description: description || null,
    }
  }

  // Upload current imageFiles and return URLs
  const uploadCurrentImages = async () => {
    const uploadedUrls: string[] = []
    if (!imageFiles || imageFiles.length === 0) return uploadedUrls
    setUploadingImg(true)
    try {
      for (let file of imageFiles) {
        const url = await uploadToCloudinary(file)
        uploadedUrls.push(url)
      }
    } finally {
      setUploadingImg(false)
    }
    return uploadedUrls
  }

  // Add current form as an item in the batch (uploads images first)
  const addToBatch = async () => {
    setError("")
    // clear previous field errors
    setFieldErrors({})

    const newFieldErrors: Record<string, string> = {}
    if (!title) newFieldErrors.title = "Title is required."
    if (!itemType) newFieldErrors.itemType = "Item type is required."
    if (!category) newFieldErrors.category = "Category is required."
    if (!price) newFieldErrors.price = "Price is required."

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      setError("Title, item type, category and price are required to add to batch.")
      return
    }
    try {
      setLoading(true)
      const imageUrls = await uploadCurrentImages()
      if (imageUrls.length === 0) {
        setError("At least one image is required for each product.")
        return
      }
      const payload = buildProductPayload(imageUrls)

      if (editingIndex !== null && editingIndex >= 0) {
        // replace existing batch item
        setProductsBatch((prev) => {
          const next = [...prev]
          next[editingIndex] = payload
          return next
        })
        setEditingIndex(null)
      } else {
        setProductsBatch((prev) => [...prev, payload])
      }

      // reset form
      resetForm()
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.error || err?.message || "Failed to add product to batch.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setItemType("")
    setCategory("")
    setPrice("")
    setSizes([])
    setColors("")
    setDescription("")
    setCustomizable(false)
    setIsFeatured(false)
    setTags("")
    setImageFiles([])
    setImagePreviews([])
    setCustomSizeInput("")
  }

  const editBatchItem = (index: number) => {
    const item = productsBatch[index]
    // populate form for editing; note imageUrls can't be edited as files here,
    // we'll show previews from imageUrls and allow replacing by selecting new files.
    setTitle(item.title || "")
    setItemType(item.itemType || "")
    setCategory(item.category || "")
    setPrice(String(item.price ?? ""))
    setSizes(item.sizes || [])
    setColors((item.colors || []).join(", "))
    setDescription(item.description || "")
    setCustomizable(!!item.customizable)
    setIsFeatured(!!item.isFeatured)
    setTags((item.tags || []).join(", "))
    // show existing imageUrls as previews (no local File objects)
    setImageFiles([])
    setImagePreviews((item.imageUrls || []).map((u: string) => u))
    setEditingIndex(index)
  }

  const removeBatchItem = (index: number) => {
    setProductsBatch((prev) => prev.filter((_, i) => i !== index))
    // if we were editing that index, cancel edit
    if (editingIndex === index) {
      resetForm()
      setEditingIndex(null)
    }
  }

  // Final submit: send entire batch to backend (or single current product if user prefers)
  const submitBatch = async () => {
    setError("")
    if (productsBatch.length === 0) {
      setError("No products in batch. Use 'Add to batch' to queue products first.")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("impressa_admin_token")
      await axios.post(
        `${base_url}/templates`,
        { products: productsBatch },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess && onSuccess()
      onClose && onClose()
      // clear batch after success
      setProductsBatch([])
      resetForm()
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.error || err?.message || "Failed to create products.")
    } finally {
      setLoading(false)
    }
  }

  // Optionally allow creating single product immediately (same behavior as batch with one item)
  const submitSingleImmediate = async (e: any) => {
    e.preventDefault()
    setError("")
    try {
      setLoading(true)
      if (!title || !itemType || !category || !price) {
        setError("Title, item type, category and price are required.")
        return
      }
      const imageUrls = await uploadCurrentImages()
      if (imageUrls.length === 0) {
        setError("At least one image is required.")
        return
      }
      const payload = buildProductPayload(imageUrls)
      const token = localStorage.getItem("impressa_admin_token")
      await axios.post(
        `${base_url}/templates`,
        { products: [payload] },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess && onSuccess()
      onClose && onClose()
      resetForm()
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.error || err?.message || "Failed to create product.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl p-6 rounded-xl relative shadow-lg h-10/12 overflow-auto">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <h2 className="text-2xl font-bold mb-4">Add Product{productsBatch.length > 0 ? ` — ${productsBatch.length} queued` : ""}</h2>

        <form onSubmit={submitSingleImmediate} className="space-y-5">

          {/* IMAGES */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Product Images</label>
            <Input type="file" accept="image/*" multiple onChange={handleImageChange} />

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {imagePreviews.map((src, idx) => (
                  <img key={idx} src={src} alt="preview" className="w-full h-24 object-cover rounded-md border" />
                ))}
              </div>
            )}
          </div>

          {/* TITLE */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <Input placeholder="e.g. Premium Hoodie" value={title} onChange={(e) => setTitle(e.target.value)} />
            {fieldErrors.title && <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="e.g. A premium quality hoodie" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* ITEM TYPE DROPDOWN + CUSTOM ENTRY */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Item Type</label>

            <Select onValueChange={setItemType} value={itemType}>
              <SelectTrigger>
                <SelectValue placeholder="Select item type or add custom" />
              </SelectTrigger>

              <SelectContent>
                {itemTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}

                <div className="border-t mt-2 pt-2">
                  <button
                    type="button"
                    className="flex items-center w-full text-left px-2 py-1 text-sm text-blue-600"
                    onClick={() => setShowCustomItemType(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add custom type
                  </button>
                </div>
              </SelectContent>
            </Select>

            {fieldErrors.itemType && <p className="text-red-500 text-xs mt-1">{fieldErrors.itemType}</p>}

            {showCustomItemType && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter custom item type"
                  value={customItemType}
                  onChange={(e) => setCustomItemType(e.target.value)}
                />
                <Button type="button" onClick={addCustomItemType}>Save</Button>
              </div>
            )}
          </div>

          {/* CATEGORY DROPDOWN + CUSTOM ENTRY */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>

            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger>
                <SelectValue placeholder="Select category or add custom" />
              </SelectTrigger>

              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}

                <div className="border-t mt-2 pt-2">
                  <button
                    type="button"
                    className="flex items-center w-full text-left px-2 py-1 text-sm text-blue-600"
                    onClick={() => setShowCustomCategory(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add custom category
                  </button>
                </div>
              </SelectContent>
            </Select>

            {fieldErrors.category && <p className="text-red-500 text-xs mt-1">{fieldErrors.category}</p>}

            {showCustomCategory && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
                <Button type="button" onClick={addCustomCategory}>Save</Button>
              </div>
            )}
          </div>

          {/* PRICE */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Price (₦)</label>
            <Input
              type="number"
              placeholder="Enter selling price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {fieldErrors.price && <p className="text-red-500 text-xs mt-1">{fieldErrors.price}</p>}
          </div>

          {/* SIZES */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Available Sizes</label>

            <div className="mt-1">
              {/* If category has presets, show them */}
              {category && SIZE_PRESETS[category] && (
                <div className="grid grid-cols-3 gap-2">
                  {SIZE_PRESETS[category] === "numeric" ? (
                    <div className="col-span-3">
                      <p className="text-sm text-muted-foreground">Enter numeric shoe sizes (e.g. 38, 39, 40) or add custom below.</p>
                    </div>
                  ) : (
                    (SIZE_PRESETS[category] as string[]).map((size) => {
                      const checked = sizes.includes(size)
                      return (
                        <div key={size} className="flex items-center space-x-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(val) => toggleSize(size, Boolean(val))}
                          />
                          <Label className="text-sm">{size}</Label>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* Show generic presets if no category selected or no preset exists */}
              {!category && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {SIZE_OPTIONS.map((size) => {
                    const checked = sizes.includes(size)
                    return (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) => toggleSize(size, Boolean(val))}
                        />
                        <Label className="text-sm">{size}</Label>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Custom size input (works for any category) */}
              <div className="flex gap-2 items-center mt-3">
                <Input
                  placeholder={category === "shoes" ? "e.g. 38,39" : "Add custom size (e.g. 30, XL, Large)"}
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                />
                <Button type="button" onClick={addCustomSize}><Plus className="h-4 w-4" /></Button>
              </div>

              {/* List added sizes with remove option */}
              {sizes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {sizes.map((s) => (
                    <div key={s} className="px-2 py-1 bg-muted rounded-full flex items-center gap-2 text-sm">
                      <span>{s}</span>
                      <button type="button" onClick={() => removeSize(s)} className="text-xs text-red-600">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLORS */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Colors (comma separated)</label>
            <Input
              placeholder="e.g. black, white, red"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
            />
          </div>

          {/* TAGS */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Tags (comma separated)</label>
            <Input
              placeholder="e.g. promo, cotton"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* FLAGS */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox checked={customizable} onCheckedChange={(v) => setCustomizable(Boolean(v))} />
              <Label className="text-sm">Customizable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={isFeatured} onCheckedChange={(v) => setIsFeatured(Boolean(v))} />
              <Label className="text-sm">Featured</Label>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={addToBatch}
              disabled={loading || uploadingImg || !title || !itemType || !category || !price}
            >
              {editingIndex !== null ? "Update Queued" : "Add to batch"}
            </Button>

            <Button type="submit" className="bg-indigo-600" disabled={loading || uploadingImg}>
              Create single
            </Button>

            <Button type="button" variant="ghost" onClick={() => { resetForm(); setProductsBatch([]); setEditingIndex(null) }}>
              Clear
            </Button>
          </div>
        </form>

        {/* Batch preview / controls */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Batch ({productsBatch.length})</h3>

          {productsBatch.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products queued. Use "Add to batch" to queue multiple products then "Create batch" to upload them at once.</p>
          ) : (
            <div className="space-y-3">
              {productsBatch.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <img src={(p.imageUrls && p.imageUrls[0]) || "/placeholder.jpg"} className="w-14 h-14 object-cover rounded" />
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-sm text-muted-foreground">{p.category} • ₦{p.price}</div>
                      <div className="text-xs text-muted-foreground">{(p.sizes || []).join(", ")}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button title="Edit queued product" onClick={() => editBatchItem(idx)} className="p-2 rounded hover:bg-slate-100">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button title="Remove from batch" onClick={() => removeBatchItem(idx)} className="p-2 rounded hover:bg-slate-100">
                      <Trash className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-3">
                <Button onClick={submitBatch} disabled={loading}>
                  Create batch ({productsBatch.length})
                </Button>
                <Button variant="ghost" onClick={() => { setProductsBatch([]); resetForm(); }}>
                  Clear batch
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
