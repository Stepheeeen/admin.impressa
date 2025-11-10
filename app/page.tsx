"use client"

import React, { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { base_url } from "@/constant/constant"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError("Please fill in all fields")
        return
      }

      const response = await axios.post(`${base_url}/auth/admin-login/`, {
        email,
        password,
      })

      const { token, admin } = response.data

      // Store token (you can switch to cookies later)
      localStorage.setItem("impressa_admin_token", token)
      localStorage.setItem("impressa_admin_info", JSON.stringify(admin))

      // Clear input fields
      setEmail("")
      setPassword("")

      // Navigate to admin dashboard
      router.push("/admin/dashboard")
    } catch (err: any) {
      console.log(err)
      const message =
        err?.response?.data?.error ||
        "Authentication failed. Please verify your credentials."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@impressa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Login"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Reach out to your developer for account issues</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}