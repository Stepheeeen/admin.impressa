"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus } from "lucide-react"
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

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImg, setUploadingImg] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (imageFiles.length === 0) {
        setError("At least one image is required.")
        setLoading(false)
        return
      }

      if (!itemType || !category) {
        setError("Select or create item type & category.")
        setLoading(false)
        return
      }

      setUploadingImg(true)

      const uploadedUrls: string[] = []
      for (let file of imageFiles) {
        const url = await uploadToCloudinary(file)
        uploadedUrls.push(url)
      }

      setUploadingImg(false)

      const token = localStorage.getItem("impressa_admin_token")

      // prepare payload matching backend controller expectations
      const productPayload = {
        title,
        itemType,
        category,
        imageUrls: uploadedUrls,
        price: Number(price),
        sizes: sizes || [],
        colors: colors ? colors.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean) : [],
        tags: tags ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        customizable,
        isFeatured,
        description: description || null,
      }

      // send as { products: product } so controller can accept single object or array
      await axios.post(
        `${base_url}/templates`,
        { products: productPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      onSuccess()
      onClose()

      // reset form
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

    } catch (err:any) {
      console.error(err)
      const serverMsg = err?.response?.data?.error || err?.message || ""
      const combined = `Failed to create product. ${serverMsg}`.trim()
      setError(combined)
    } finally {
      setLoading(false)
      setUploadingImg(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl relative shadow-lg h-10/12 overflow-scroll">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add Product</h2>

        <form onSubmit={handleSubmit} className="space-y-5">

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

          <Button className="w-full" disabled={loading || uploadingImg}>
            {loading || uploadingImg ? "Uploading…" : "Add Product"}
          </Button>
        </form>
      </div>
    </div>
  )
}
