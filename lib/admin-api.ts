import axios from "axios"
import { base_url } from "@/constant/constant"

export function adminApi() {
  const token = typeof window !== "undefined" ? localStorage.getItem("impressa_admin_token") ?? "" : ""
  return axios.create({ baseURL: base_url, headers: { Authorization: `Bearer ${token}` } })
}

// Shows the API's own message (e.g. "The end date must be after the start date.") instead of a generic one.
export function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.error
    if (typeof message === "string" && message.trim()) return message
    if (!err.response) return "Network error. Check your connection and try again."
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export const formatNaira = (value: number) => `₦${Math.round(value).toLocaleString("en-NG")}`
