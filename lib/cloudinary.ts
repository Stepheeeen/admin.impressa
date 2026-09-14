// Unsigned uploads with the same Cloudinary account and preset the product form already uses.
const CLOUD_NAME = "dlyu92juc"
const UPLOAD_PRESET = "impressa"

export const MAX_VIDEO_MB = 100

export async function uploadToCloudinary(file: File, resourceType: "image" | "video"): Promise<string> {
  if (resourceType === "video" && file.size > MAX_VIDEO_MB * 1024 * 1024) {
    throw new Error(`Videos must be ${MAX_VIDEO_MB} MB or smaller.`)
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  })
  const data = await res.json().catch(() => null)

  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || "Upload failed. Try again.")
  }
  return data.secure_url as string
}
