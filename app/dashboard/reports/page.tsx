'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, BarChart3 } from 'lucide-react'

interface ReportData {
  totalRevenue: number
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  cancelledOrders: number
  totalCustomers: number
  averageOrderValue: number
  totalPayments: number
  completedPayments: number
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setLoading(true)

      // Fetch all necessary data
      const [ordersRes, paymentsRes, customersRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('customers').select('count()', { count: 'exact', head: true }),
      ])

      const orders = ordersRes.data || []
      const payments = paymentsRes.data || []

      // Calculate metrics
      const totalRevenue = payments
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      const completedOrders = orders.filter((o) => o.status === 'completed').length
      const pendingOrders = orders.filter((o) => o.status === 'pending').length
      const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length
      const completedPayments = payments.filter((p) => p.status === 'completed').length

      setReportData({
        totalRevenue,
        totalOrders: orders.length,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalCustomers: customersRes.count || 0,
        averageOrderValue:
          orders.length > 0
            ? orders.reduce((sum, o) => sum + (o.total_price || 0), 0) / orders.length
            : 0,
        totalPayments: payments.length,
        completedPayments,
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    const csv = `Crystal Shaadi Card Shop - Business Report
Generated on: ${new Date().toLocaleString()}

Key Metrics:
Total Revenue (Rs.),${reportData.totalRevenue.toLocaleString()}
Total Orders,${reportData.totalOrders}
Completed Orders,${reportData.completedOrders}
Pending Orders,${reportData.pendingOrders}
Cancelled Orders,${reportData.cancelledOrders}
Average Order Value (Rs.),${reportData.averageOrderValue.toFixed(2)}
Total Customers,${reportData.totalCustomers}
Total Payments,${reportData.totalPayments}
Completed Payments,${reportData.completedPayments}
Payment Completion Rate,${((reportData.completedPayments / reportData.totalPayments) * 100).toFixed(2)}%
`

    const element = document.createElement('a')
    element.setAttribute(
      'href',
      'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    )
    element.setAttribute('download', `report-${new Date().getTime()}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading report...</p>
      </DashboardLayout>
    )
  }

  if (!reportData) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Unable to load report</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          </div>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Revenue Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Total revenue from completed payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                Rs. {reportData.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Order Value</CardTitle>
              <CardDescription>Average value per order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                Rs. {reportData.averageOrderValue.toFixed(0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Section */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Overview of all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">
                  {reportData.totalOrders}
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-green-50">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.completedOrders}
                </p>
                <p className="text-xs text-muted-foreground">
                  {reportData.totalOrders > 0
                    ? (
                        (reportData.completedOrders / reportData.totalOrders) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-yellow-50">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reportData.pendingOrders}
                </p>
                <p className="text-xs text-muted-foreground">
                  {reportData.totalOrders > 0
                    ? (
                        (reportData.pendingOrders / reportData.totalOrders) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-red-50">
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {reportData.cancelledOrders}
                </p>
                <p className="text-xs text-muted-foreground">
                  {reportData.totalOrders > 0
                    ? (
                        (reportData.cancelledOrders / reportData.totalOrders) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>Overview of all payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold text-foreground">
                  {reportData.totalPayments}
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-green-50">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.completedPayments}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {reportData.totalPayments > 0
                    ? (
                        (reportData.completedPayments / reportData.totalPayments) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Summary</CardTitle>
            <CardDescription>Total registered customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {reportData.totalCustomers}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
