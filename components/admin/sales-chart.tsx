"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface SalesChartProps {
  monthlyData: { month?: string; orders: number; sales: number }[]
}

export function SalesChart({ monthlyData }: SalesChartProps) {
  // Map month numbers to names if backend returns numbers
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const chartData = monthlyData.map((item, index) => ({
    month: item.month || monthNames[index] || `Month ${index + 1}`,
    sales: item.sales,
    orders: item.orders,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales & Orders</CardTitle>
        <CardDescription>Monthly sales and order trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#3b82f6" />
            <Line type="monotone" dataKey="orders" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
