'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Order {
  order_id: number
  customer_id: number
  quantity: number
  total_amount: number
  order_status: string
  order_date: string
  customerName: string
}

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const supabase = createClient()
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('order_id, customer_id, quantity, total_amount, order_status, order_date')
          .order('order_date', { ascending: false })
          .limit(5)

        if (ordersError) throw ordersError

        // Fetch customer names
        const customerIds = ordersData?.map(o => o.customer_id) || []
        const { data: customersData } = await supabase
          .from('customers')
          .select('customer_id, customer_name')
          .in('customer_id', customerIds)

        const customerMap = new Map(customersData?.map(c => [c.customer_id, c.customer_name]) || [])

        const enrichedOrders = ordersData?.map(order => ({
          ...order,
          customerName: customerMap.get(order.customer_id) || 'N/A',
        })) || []

        setOrders(enrichedOrders)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'In Printing':
        return 'bg-blue-100 text-blue-800'
      case 'Ready for Pickup':
        return 'bg-purple-100 text-purple-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.order_id}>
                  <TableCell className="font-medium">
                    {order.customerName}
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>Rs. {order.total_amount?.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.order_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.order_status)}>
                      {order.order_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
