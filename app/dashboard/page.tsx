'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { LowStockMaterials } from '@/components/dashboard/low-stock-materials'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient()

        // Fetch stats in parallel
        const [customersRes, ordersRes, ordersWithPriceRes, pendingRes] = await Promise.all([
          supabase.from('customers').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('orders').select('total_amount'),
          supabase.from('orders').select('*').eq('order_status', 'Pending'),
        ])

        let totalRevenue = 0
        if (ordersWithPriceRes.data) {
          totalRevenue = ordersWithPriceRes.data.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        }

        setStats({
          totalCustomers: customersRes.data?.length || 0,
          totalOrders: ordersRes.data?.length || 0,
          totalRevenue,
          pendingOrders: pendingRes.data?.length || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Customers"
            value={stats.totalCustomers}
            loading={loading}
          />
          <DashboardCard
            title="Total Orders"
            value={stats.totalOrders}
            loading={loading}
          />
          <DashboardCard
            title="Total Revenue"
            value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
            loading={loading}
          />
          <DashboardCard
            title="Pending Orders"
            value={stats.pendingOrders}
            loading={loading}
            highlight="warning"
          />
        </div>

        {/* Recent Orders and Low Stock Materials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrders />
          </div>
          <div>
            <LowStockMaterials />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
