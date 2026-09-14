"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminApi, apiError, formatNaira } from "@/lib/admin-api"

type WalletUsageMode = "whole-order" | "items-only" | "percent-of-items"

interface RewardSettings {
  walletEnabled: boolean
  couponsEnabled: boolean
  cashbackEnabled: boolean
  checkInEnabled: boolean
  scratchCardsEnabled: boolean
  rewardsRequirePurchase: boolean
  creditExpiryDays: number
  walletUsageMode: WalletUsageMode
  walletUsagePercent: number
  cashbackPercent: number
  cashbackMax: number
  checkInRewards: number[]
  scratchPrizes: { amount: number; weight: number }[]
  scratchCardsPerDay: number
  gamesMonthlyBudget: number
}

interface RewardsSummary {
  gamesSpentThisMonth: number
  gamesMonthlyBudget: number
  cashbackThisMonth: number
  outstandingCredit: number
  expiringNext30Days: number
}

type SwitchKey =
  | "walletEnabled"
  | "couponsEnabled"
  | "cashbackEnabled"
  | "checkInEnabled"
  | "scratchCardsEnabled"
  | "rewardsRequirePurchase"

const SWITCHES: { key: SwitchKey; label: string; description: string }[] = [
  { key: "walletEnabled", label: "Wallet", description: "Customers can see their credit and spend it at checkout." },
  { key: "couponsEnabled", label: "Coupons", description: "Coupon codes can be used at checkout." },
  { key: "cashbackEnabled", label: "Cashback", description: "Delivered orders earn cashback on the part paid by card." },
  { key: "checkInEnabled", label: "Daily check-in", description: "Customers earn a streak reward once a day." },
  { key: "scratchCardsEnabled", label: "Scratch cards", description: "Customers can scratch cards for a prize each day." },
  {
    key: "rewardsRequirePurchase",
    label: "Require a first order",
    description: "Check-in and scratch cards unlock only after a paid order, so new accounts can't farm credit.",
  },
]

const USAGE_MODES: { value: WalletUsageMode; label: string; description: string }[] = [
  { value: "whole-order", label: "The whole order", description: "Credit can pay for items and delivery." },
  { value: "items-only", label: "Items only", description: "Delivery is always paid by card." },
  { value: "percent-of-items", label: "A share of the items", description: "Up to the percentage below." },
]

const toNumber = (value: string) => (value === "" ? 0 : Number(value))

export function RewardsSettings() {
  const [settings, setSettings] = useState<RewardSettings | null>(null)
  const [summary, setSummary] = useState<RewardsSummary | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    try {
      const api = adminApi()
      const [settingsRes, summaryRes] = await Promise.all([api.get("/admin/rewards/settings"), api.get("/admin/rewards/summary")])
      setSettings(settingsRes.data)
      setSummary(summaryRes.data)
    } catch (err) {
      toast.error(apiError(err, "Couldn't load reward settings."))
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (!settings) {
    return <p className="py-10 text-center text-muted-foreground">Loading reward settings...</p>
  }

  const update = <K extends keyof RewardSettings>(key: K, value: RewardSettings[K]) => setSettings({ ...settings, [key]: value })

  const totalWeight = settings.scratchPrizes.reduce((sum, prize) => sum + (prize.weight || 0), 0)
  const budgetUsedPercent =
    summary && summary.gamesMonthlyBudget > 0
      ? Math.min(100, Math.round((summary.gamesSpentThisMonth / summary.gamesMonthlyBudget) * 100))
      : 0

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await adminApi().put("/admin/rewards/settings", settings)
      setSettings(res.data.settings)
      toast.success("Reward settings saved")
      load()
    } catch (err) {
      setError(apiError(err, "Couldn't save the settings. Try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rewards</h1>
        <p className="text-muted-foreground">Wallet credit, cashback and daily games. Saved changes apply straight away.</p>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Game rewards this month</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{formatNaira(summary.gamesSpentThisMonth)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="h-2 rounded-full bg-muted" role="progressbar" aria-valuenow={budgetUsedPercent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-2 rounded-full bg-primary" style={{ width: `${budgetUsedPercent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {budgetUsedPercent}% of the {formatNaira(summary.gamesMonthlyBudget)} budget
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cashback this month</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{formatNaira(summary.cashbackThisMonth)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Credit customers hold</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{formatNaira(summary.outstandingCredit)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expiring in the next 30 days</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{formatNaira(summary.expiringNext30Days)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Switch any feature off without a new app release.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SWITCHES.map((item) => (
            <label key={item.key} className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings[item.key]}
                onChange={(e) => update(item.key, e.target.checked)}
              />
              <span>
                <span className="block font-medium">{item.label}</span>
                <span className="block text-sm text-muted-foreground">{item.description}</span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallet credit</CardTitle>
          <CardDescription>Credit can only be spent in the app. It can't be withdrawn or sent to someone else.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="expiry-days">Credit expires after (days)</Label>
            <Input
              id="expiry-days"
              type="number"
              min={1}
              value={settings.creditExpiryDays}
              onChange={(e) => update("creditExpiryDays", toNumber(e.target.value))}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Credit can pay for</legend>
            {USAGE_MODES.map((mode) => (
              <label key={mode.value} className="flex items-start gap-3">
                <input
                  type="radio"
                  name="wallet-usage"
                  className="mt-1"
                  checked={settings.walletUsageMode === mode.value}
                  onChange={() => update("walletUsageMode", mode.value)}
                />
                <span>
                  <span className="block">{mode.label}</span>
                  <span className="block text-sm text-muted-foreground">{mode.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {settings.walletUsageMode === "percent-of-items" && (
            <div className="max-w-xs space-y-2">
              <Label htmlFor="usage-percent">Share of the items (%)</Label>
              <Input
                id="usage-percent"
                type="number"
                min={1}
                max={100}
                value={settings.walletUsagePercent}
                onChange={(e) => update("walletUsagePercent", toNumber(e.target.value))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cashback</CardTitle>
          <CardDescription>Paid when an order is marked delivered, on the amount paid by card only.</CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-lg gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cashback-percent">Cashback (%)</Label>
            <Input
              id="cashback-percent"
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={settings.cashbackPercent}
              onChange={(e) => update("cashbackPercent", toNumber(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cashback-max">Most per order (₦)</Label>
            <Input
              id="cashback-max"
              type="number"
              min={0}
              value={settings.cashbackMax}
              onChange={(e) => update("cashbackMax", toNumber(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily check-in</CardTitle>
          <CardDescription>
            Reward for each day of a streak. Missing a day starts again from day 1; after the last day the streak repeats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {settings.checkInRewards.map((amount, index) => (
              <div key={index} className="space-y-1">
                <Label htmlFor={`check-in-${index}`}>Day {index + 1} (₦)</Label>
                <div className="flex gap-1">
                  <Input
                    id={`check-in-${index}`}
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) =>
                      update(
                        "checkInRewards",
                        settings.checkInRewards.map((value, i) => (i === index ? toNumber(e.target.value) : value))
                      )
                    }
                  />
                  {settings.checkInRewards.length > 1 && index === settings.checkInRewards.length - 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Remove the last day"
                      onClick={() => update("checkInRewards", settings.checkInRewards.slice(0, -1))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {settings.checkInRewards.length < 14 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update("checkInRewards", [...settings.checkInRewards, 0])}
            >
              <Plus className="mr-1 h-4 w-4" /> Add a day
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scratch cards</CardTitle>
          <CardDescription>
            The prize is picked on the server by chance weight. A prize of ₦0 is a "no win" card.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full max-w-lg text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-2 pr-3 text-left">Prize (₦)</th>
                  <th className="py-2 pr-3 text-left">Chance weight</th>
                  <th className="py-2 pr-3 text-left">Odds</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {settings.scratchPrizes.map((prize, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 pr-3">
                      <Input
                        aria-label={`Prize ${index + 1} amount`}
                        type="number"
                        min={0}
                        value={prize.amount}
                        onChange={(e) =>
                          update(
                            "scratchPrizes",
                            settings.scratchPrizes.map((p, i) => (i === index ? { ...p, amount: toNumber(e.target.value) } : p))
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        aria-label={`Prize ${index + 1} chance weight`}
                        type="number"
                        min={0}
                        step={1}
                        value={prize.weight}
                        onChange={(e) =>
                          update(
                            "scratchPrizes",
                            settings.scratchPrizes.map((p, i) => (i === index ? { ...p, weight: toNumber(e.target.value) } : p))
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                      {totalWeight > 0 ? `${((prize.weight / totalWeight) * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2">
                      {settings.scratchPrizes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Remove prize"
                          onClick={() => update("scratchPrizes", settings.scratchPrizes.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update("scratchPrizes", [...settings.scratchPrizes, { amount: 0, weight: 1 }])}
          >
            <Plus className="mr-1 h-4 w-4" /> Add a prize
          </Button>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="cards-per-day">Cards per customer per day</Label>
            <Input
              id="cards-per-day"
              type="number"
              min={1}
              max={10}
              value={settings.scratchCardsPerDay}
              onChange={(e) => update("scratchCardsPerDay", toNumber(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly games budget</CardTitle>
          <CardDescription>
            Check-in and scratch card rewards stop paying once this much has been given out in a calendar month (Lagos
            time). Cashback isn't counted.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-xs space-y-2">
          <Label htmlFor="games-budget">Budget (₦)</Label>
          <Input
            id="games-budget"
            type="number"
            min={0}
            value={settings.gamesMonthlyBudget}
            onChange={(e) => update("gamesMonthlyBudget", toNumber(e.target.value))}
          />
        </CardContent>
      </Card>

      <p className="max-w-prose text-sm text-muted-foreground">
        Before switching scratch cards on for customers, confirm with a lawyer whether they need sales-promotion approval
        from the FCCPC, and publish the game rules.
      </p>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save reward settings"}
      </Button>
    </form>
  )
}
