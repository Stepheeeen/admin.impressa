"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminApi, apiError } from "@/lib/admin-api"

interface MarketplaceSettingsForm {
  defaultCommissionPercent: number
  returnWindowDays: number
  merchantResponseHours: number
  payoutsEnabled: boolean
}

const toNumber = (value: string) => (value === "" ? 0 : Number(value))

export function MarketplaceSettings() {
  const [settings, setSettings] = useState<MarketplaceSettingsForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    adminApi()
      .get("/admin/marketplace/settings")
      .then((res) => setSettings(res.data))
      .catch((err) => toast.error(apiError(err, "Couldn't load marketplace settings.")))
  }, [])

  if (!settings) return null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await adminApi().put("/admin/marketplace/settings", settings)
      setSettings(res.data.settings)
      toast.success("Marketplace settings saved")
    } catch (err) {
      setError(apiError(err, "Couldn't save the settings. Try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace settings</CardTitle>
        <CardDescription>Commission and returns rules apply to orders placed after you save.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="default-commission">Default commission (%)</Label>
              <Input
                id="default-commission"
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={settings.defaultCommissionPercent}
                onChange={(e) => setSettings({ ...settings, defaultCommissionPercent: toNumber(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return-window">Returns window (days)</Label>
              <Input
                id="return-window"
                type="number"
                min={1}
                max={30}
                value={settings.returnWindowDays}
                onChange={(e) => setSettings({ ...settings, returnWindowDays: toNumber(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response-hours">Merchant response time (hours)</Label>
              <Input
                id="response-hours"
                type="number"
                min={12}
                max={168}
                value={settings.merchantResponseHours}
                onChange={(e) => setSettings({ ...settings, merchantResponseHours: toNumber(e.target.value) })}
              />
            </div>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={settings.payoutsEnabled}
              onChange={(e) => setSettings({ ...settings, payoutsEnabled: e.target.checked })}
            />
            <span>
              <span className="block font-medium">Send merchant payouts automatically</span>
              <span className="block text-sm text-muted-foreground max-w-prose">
                Before switching this on, in the Paystack dashboard: enable Transfers, turn off OTP for transfers, and
                keep enough balance to cover payouts (automatic settlement to your bank empties it).
              </span>
            </span>
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save marketplace settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
