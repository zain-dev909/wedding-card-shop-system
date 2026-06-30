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

interface Order {
  id: string
  customer_id: string
  card_design_id: string
  employee_id: string | null
  quantity: number
  total_price: number
  order_date: string
  status: string
  customer?: { name: string }
  card_design?: { name: string }
  employee?: { name: string }
}

interface Customer {
  id: string
  name: string
}

interface CardDesign {
  id: string
  name: string
  price: number
}

interface Employee {
  id: string
  name: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [designs, setDesigns] = useState<CardDesign[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customer_id: '',
    card_design_id: '',
    employee_id: '',
    quantity: 1,
    total_price: 0,
    status: 'pending',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [ordersRes, customersRes, designsRes, employeesRes] = await Promise.all([
        supabase.from('orders').select('*').order('order_date', { ascending: false }),
        supabase.from('customers').select('id, name'),
        supabase.from('card_designs').select('id, name, price'),
        supabase.from('employees').select('id, name'),
      ])

      setOrders(ordersRes.data || [])
      setCustomers(customersRes.data || [])
      setDesigns(designsRes.data || [])
      setEmployees(employeesRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('orders')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('orders')
          .insert([formData])

        if (error) throw error
      }

      setFormData({
        customer_id: '',
        card_design_id: '',
        employee_id: '',
        quantity: 1,
        total_price: 0,
        status: 'pending',
      })
      setEditingId(null)
      setOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error saving order:', error)
    }
  }

  const handleEdit = (order: Order) => {
    setFormData({
      customer_id: order.customer_id,
      card_design_id: order.card_design_id,
      employee_id: order.employee_id || '',
      quantity: order.quantity,
      total_price: order.total_price || 0,
      status: order.status,
    })
    setEditingId(order.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAllData()
    } catch (error) {
      console.error('Error deleting order:', error)
    }
  }

  const handleQuantityChange = (qty: number) => {
    setFormData((prev) => {
      const design = designs.find((d) => d.id === prev.card_design_id)
      const price = design ? design.price * qty : 0
      return {
        ...prev,
        quantity: qty,
        total_price: price,
      }
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({
                    customer_id: '',
                    card_design_id: '',
                    employee_id: '',
                    quantity: 1,
                    total_price: 0,
                    status: 'pending',
                  })
                }}
              >
                <Plus className="h-4 w-4" />
                Add Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Order' : 'Add New Order'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddOrder} className="space-y-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <select
                    id="customer"
                    value={formData.customer_id}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_id: e.target.value })
                    }
                    className="w-full border border-input rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="design">Card Design *</Label>
                  <select
                    id="design"
                    value={formData.card_design_id}
                    onChange={(e) =>
                      setFormData({ ...formData, card_design_id: e.target.value })
                    }
                    className="w-full border border-input rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Design</option>
                    {designs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Rs. {d.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <select
                    id="employee"
                    value={formData.employee_id}
                    onChange={(e) =>
                      setFormData({ ...formData, employee_id: e.target.value })
                    }
                    className="w-full border border-input rounded px-3 py-2"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total">Total Price (Rs.)</Label>
                  <Input
                    id="total"
                    type="number"
                    value={formData.total_price}
                    disabled
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
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? 'Update' : 'Add'} Order
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground">No orders found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Design</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const customer = customers.find((c) => c.id === order.customer_id)
                      const design = designs.find((d) => d.id === order.card_design_id)
                      const employee = employees.find((e) => e.id === order.employee_id)

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {customer?.name || '-'}
                          </TableCell>
                          <TableCell>{design?.name || '-'}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>
                            Rs. {order.total_price?.toLocaleString()}
                          </TableCell>
                          <TableCell>{employee?.name || '-'}</TableCell>
                          <TableCell>
                            {new Date(order.order_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === 'completed'
                                  ? 'default'
                                  : order.status === 'cancelled'
                                    ? 'outline'
                                    : 'secondary'
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(order)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleDelete(order.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
