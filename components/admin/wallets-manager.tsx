"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminApi, apiError, formatNaira } from "@/lib/admin-api"

interface WalletEntry {
  _id: string
  kind: "credit" | "debit" | "hold" | "release" | "expiry"
  source: string
  amount: number
  reference: string | null
  note: string | null
  actor: string | null
  createdAt: string
}

interface CustomerWallet {
  customer: { _id: string; username: string; email: string }
  balance: number
  expiringSoon: { amount: number; expiresAt: string } | null
  transactions: WalletEntry[]
}

interface Reconciliation {
  checkedAt: string
  mismatches: { userId: string; ledger: number; lots: number }[]
}

const ENTRY_LABELS: Record<string, string> = {
  cashback: "Cashback",
  "check-in": "Daily check-in",
  "scratch-card": "Scratch card",
  adjustment: "Adjustment",
  checkout: "Checkout",
  expiry: "Expired",
}

const describeEntry = (entry: WalletEntry) => {
  if (entry.kind === "hold") return "Held at checkout"
  if (entry.kind === "release") return "Returned from checkout"
  return ENTRY_LABELS[entry.source] ?? entry.source
}

const newRequestId = () => crypto.randomUUID()

export function WalletsManager() {
  const [email, setEmail] = useState("")
  const [wallet, setWallet] = useState<CustomerWallet | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")

  const [direction, setDirection] = useState<"add" | "remove">("add")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  // One id per adjustment, so a double-click can't apply it twice.
  const [requestId, setRequestId] = useState(newRequestId)
  const [adjusting, setAdjusting] = useState(false)
  const [adjustError, setAdjustError] = useState("")

  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null)
  const [checking, setChecking] = useState(false)

  const lookUp = async (address = email) => {
    setSearching(true)
    setSearchError("")
    try {
      const res = await adminApi().get(`/admin/wallets?email=${encodeURIComponent(address.trim())}`)
      setWallet(res.data)
    } catch (err) {
      setWallet(null)
      setSearchError(apiError(err, "Couldn't find that customer."))
    } finally {
      setSearching(false)
    }
  }

  const adjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet) return
    setAdjusting(true)
    setAdjustError("")
    try {
      const value = Number(amount)
      const res = await adminApi().post(`/admin/wallets/${wallet.customer._id}/adjustments`, {
        amount: direction === "remove" ? -value : value,
        reason,
        requestId,
      })
      toast.success(`${res.data.message}. New balance ${formatNaira(res.data.balance)}.`)
      setAmount("")
      setReason("")
      setRequestId(newRequestId())
      await lookUp(wallet.customer.email)
    } catch (err) {
      setAdjustError(apiError(err, "Couldn't adjust the wallet. Try again."))
    } finally {
      setAdjusting(false)
    }
  }

  const checkLedger = async () => {
    setChecking(true)
    try {
      const res = await adminApi().get("/admin/wallets/reconciliation")
      setReconciliation(res.data)
    } catch (err) {
      toast.error(apiError(err, "Couldn't run the check."))
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallets</h1>
        <p className="text-muted-foreground">Look up a customer's credit and make adjustments. Every adjustment is recorded with your name and reason.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger check</CardTitle>
          <CardDescription>Confirms every wallet balance matches its history. It also runs automatically every hour.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={checkLedger} disabled={checking}>
            {checking ? "Checking..." : "Check all wallets"}
          </Button>
          {reconciliation &&
            (reconciliation.mismatches.length === 0 ? (
              <p className="text-sm text-green-700">
                All wallets balance. Checked {new Date(reconciliation.checkedAt).toLocaleString("en-NG")}.
              </p>
            ) : (
              <div className="text-sm text-destructive" role="alert">
                <p className="font-medium">{reconciliation.mismatches.length} wallet(s) don't balance. Contact the developer before making adjustments.</p>
                <ul className="mt-1 list-disc pl-5">
                  {reconciliation.mismatches.map((m) => (
                    <li key={m.userId}>
                      Customer {m.userId}: history {formatNaira(m.ledger)}, credit {formatNaira(m.lots)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Find a customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex max-w-lg gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              lookUp()
            }}
          >
            <Label htmlFor="wallet-email" className="sr-only">
              Customer email
            </Label>
            <Input id="wallet-email" type="email" placeholder="customer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" disabled={searching || !email.trim()}>
              <Search className="mr-2 h-4 w-4" /> {searching ? "Searching..." : "Search"}
            </Button>
          </form>
          {searchError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {searchError}
            </p>
          )}
        </CardContent>
      </Card>

      {wallet && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>{wallet.customer.email}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{formatNaira(wallet.balance)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {wallet.expiringSoon
                  ? `${formatNaira(wallet.expiringSoon.amount)} expires on ${new Date(wallet.expiringSoon.expiresAt).toLocaleDateString("en-NG")}.`
                  : "No credit expiring in the next 14 days."}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adjust credit</CardTitle>
                <CardDescription>Added credit follows the normal expiry rule.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={adjust} className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="direction" checked={direction === "add"} onChange={() => setDirection("add")} /> Add credit
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="direction" checked={direction === "remove"} onChange={() => setDirection("remove")} /> Remove credit
                    </label>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adjust-amount">Amount (₦)</Label>
                    <Input id="adjust-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adjust-reason">Reason</Label>
                    <Input id="adjust-reason" placeholder="e.g. Goodwill for late delivery of order #A1B2C3" value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                  {adjustError && (
                    <p className="text-sm text-destructive" role="alert">
                      {adjustError}
                    </p>
                  )}
                  <Button type="submit" disabled={adjusting || !amount || !reason.trim()}>
                    {adjusting ? "Saving..." : direction === "add" ? "Add credit" : "Remove credit"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>The 30 most recent entries.</CardDescription>
            </CardHeader>
            <CardContent>
              {wallet.transactions.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">No wallet activity yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="py-2 px-3 text-left">Date</th>
                        <th className="py-2 px-3 text-left">Entry</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3 text-left">Reason</th>
                        <th className="py-2 px-3 text-left">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wallet.transactions.map((entry) => (
                        <tr key={entry._id} className="border-b">
                          <td className="py-2 px-3 text-muted-foreground">{new Date(entry.createdAt).toLocaleString("en-NG")}</td>
                          <td className="py-2 px-3">{describeEntry(entry)}</td>
                          <td className={`py-2 px-3 text-right tabular-nums ${entry.amount > 0 ? "text-green-700" : ""}`}>
                            {entry.amount > 0 ? "+" : "−"}
                            {formatNaira(Math.abs(entry.amount))}
                          </td>
                          <td className="py-2 px-3">{entry.note ?? "—"}</td>
                          <td className="py-2 px-3 text-muted-foreground">{entry.actor ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
