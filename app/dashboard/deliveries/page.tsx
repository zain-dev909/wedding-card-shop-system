'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Edit2 } from 'lucide-react'

interface Delivery {
  id: string
  order_id: string
  delivery_date: string
  status: string
  tracking_number: string
}

interface Order {
  id: string
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    order_id: '',
    delivery_date: '',
    status: 'pending',
    tracking_number: '',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [deliveriesRes, ordersRes] = await Promise.all([
        supabase.from('deliveries').select('*').order('delivery_date', { ascending: false }),
        supabase.from('orders').select('id'),
      ])

      setDeliveries(deliveriesRes.data || [])
      setOrders(ordersRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('deliveries')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('deliveries')
          .insert([formData])

        if (error) throw error
      }

      setFormData({
        order_id: '',
        delivery_date: '',
        status: 'pending',
        tracking_number: '',
      })
      setEditingId(null)
      setOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error saving delivery:', error)
    }
  }

  const handleEdit = (delivery: Delivery) => {
    setFormData({
      order_id: delivery.order_id,
      delivery_date: delivery.delivery_date || '',
      status: delivery.status,
      tracking_number: delivery.tracking_number || '',
    })
    setEditingId(delivery.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAllData()
    } catch (error) {
      console.error('Error deleting delivery:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Deliveries</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({
                    order_id: '',
                    delivery_date: '',
                    status: 'pending',
                    tracking_number: '',
                  })
                }}
              >
                <Plus className="h-4 w-4" />
                Add Delivery
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Delivery' : 'Add New Delivery'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDelivery} className="space-y-4">
                <div>
                  <Label htmlFor="order">Order *</Label>
                  <select
                    id="order"
                    value={formData.order_id}
                    onChange={(e) =>
                      setFormData({ ...formData, order_id: e.target.value })
                    }
                    className="w-full border border-input rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Order</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id.slice(0, 8)}...
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full border border-input rounded px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="tracking">Tracking Number</Label>
                  <Input
                    id="tracking"
                    value={formData.tracking_number}
                    onChange={(e) =>
                      setFormData({ ...formData, tracking_number: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? 'Update' : 'Add'} Delivery
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : deliveries.length === 0 ? (
              <p className="text-muted-foreground">No deliveries found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-mono text-sm">
                        {delivery.order_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {delivery.delivery_date
                          ? new Date(delivery.delivery_date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            delivery.status === 'delivered'
                              ? 'default'
                              : delivery.status === 'failed'
                                ? 'outline'
                                : 'secondary'
                          }
                        >
                          {delivery.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {delivery.tracking_number || '-'}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(delivery)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(delivery.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
