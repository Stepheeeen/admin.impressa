"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/admin/stats-card"
import { RecentOrders } from "@/components/admin/recent-orders"
import { SalesChart } from "@/components/admin/sales-chart"
import { ShoppingCart, Users, Package, DollarSign } from "lucide-react"
import { base_url } from "@/constant/constant"

interface DashboardStats {
  totals: {
    totalRevenue: number
    totalOrders: number
    totalProducts: number
    totalCustomers: number
  }
  growth: {
    revenueGrowth: number
    orderGrowth: number
    productGrowth: number
    customerGrowth: number
  }
  monthlyData: { orders: number; sales: number }[]
  quickStats: {
    averageOrderValue: number
    conversionRate: number
    satisfaction: number
  }
  currency: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("impressa_admin_token")
      try {
        const res = await axios.get(`${base_url}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setStats(res.data)
      } catch (err: any) {
        console.error(err)
        setError("Failed to load dashboard stats")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])


  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{error}</p>

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={`₦${stats.totals.totalRevenue.toLocaleString()}`}
          description={`${stats.growth.revenueGrowth.toFixed(1)}% from last month`}
          icon={DollarSign}
          trend={stats.growth.revenueGrowth >= 0 ? "up" : "down"}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totals.totalOrders.toLocaleString()}
          description={`${stats.growth.orderGrowth.toFixed(1)}% from last month`}
          icon={ShoppingCart}
          trend={stats.growth.orderGrowth >= 0 ? "up" : "down"}
        />
        <StatsCard
          title="Total Products"
          value={stats.totals.totalProducts.toLocaleString()}
          description={`${stats.growth.productGrowth}% from last month`}
          icon={Package}
          trend={stats.growth.productGrowth >= 0 ? "up" : "down"}
        />
        <StatsCard
          title="Total Customers"
          value={stats.totals.totalCustomers.toLocaleString()}
          description={`${stats.growth.customerGrowth}% from last month`}
          icon={Users}
          trend={stats.growth.customerGrowth >= 0 ? "up" : "down"}
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <SalesChart monthlyData={stats.monthlyData} />
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview of key metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Average Order Value</span>
                <span className="text-sm font-semibold">
                  ₦{stats.quickStats.averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${(stats.quickStats.averageOrderValue / stats.totals.totalRevenue) * 100}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Conversion Rate</span>
                <span className="text-sm font-semibold">{stats.quickStats.conversionRate}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${stats.quickStats.conversionRate}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Customer Satisfaction</span>
                <span className="text-sm font-semibold">{stats.quickStats.satisfaction}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${stats.quickStats.satisfaction}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <RecentOrders />
    </div>
  )
}
