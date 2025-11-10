"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { base_url } from "@/constant/constant"

const apiUrl = process.env.NEXT_PUBLIC_API_URL

export function AddProductModal({ open, onClose, onSuccess }: any) {
  const [title, setTitle] = useState("")
  const [itemType, setItemType] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState(0)
  const [sizes, setSizes] = useState("")
  const [colors, setColors] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [uploadingImg, setUploadingImg] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // ✅ Cloudinary upload via axios
  const uploadToCloudinary = async (file: File) => {
    const cloudName = "dlyu92juc"
    const uploadPreset = "impressa"

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    )

    return res.data.secure_url
  }

  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!imageFile) {
        setError("Image is required.")
        return
      }

      // ✅ 1. Upload image using axios
      setUploadingImg(true)
      const imageUrl = await uploadToCloudinary(imageFile)
      setUploadingImg(false)

      const token = localStorage.getItem("impressa_admin_token")

      // ✅ 2. Send product data using axios
      await axios.post(
        `${base_url}/templates`,
        {
          title,
          itemType,
          category,
          imageUrl,
          price: price,
          sizes: sizes.split(",").map((s) => s.trim()),
          colors: colors.split(",").map((c) => c.trim()),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      onSuccess()
      onClose()

      // Reset everything
      setTitle("")
      setItemType("")
      setCategory("")
      setPrice(0)
      setSizes("")
      setColors("")
      setImageFile(null)
      setImagePreview("")
    } catch (err: any) {
      console.error(err)
      setError("Failed to create product. Try again.")
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
          {/* Image */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Product Image</label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />

            {imagePreview && (
              <img
                src={imagePreview}
                alt="preview"
                className="w-full h-40 object-cover rounded-md mt-2 border"
              />
            )}

            {/* {uploadingImg && (
              <p className="text-sm text-blue-500">Uploading image…</p>
            )} */}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Classic Tee"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Item Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Item Type</label>
            <Input
              placeholder="shirt, hoodie…"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <Input
              placeholder="clothing"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {/* Price */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Price</label>
            <Input
              type="number"
              placeholder="e.g. 20000"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min="0"
            />
          </div>

          {/* Sizes */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Sizes (comma-separated)</label>
            <Input
              placeholder="S, M, L"
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
            />
          </div>

          {/* Colors */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Colors (comma-separated)</label>
            <Input
              placeholder="white, black"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button className="w-full" disabled={loading || uploadingImg}>
            {loading ? "Adding…" : "Add Product"}
          </Button>
        </form>
      </div>
    </div>
  )
}
