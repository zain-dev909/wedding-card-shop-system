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
  order_id: number
  customer_id: number
  design_id: number
  employee_id: number | null
  quantity: number
  total_amount: number
  order_date: string
  order_status: string
  customerName?: string
  designName?: string
  employeeName?: string
}

interface Customer {
  customer_id: number
  customer_name: string
}

interface CardDesign {
  design_id: number
  design_name: string
  price_per_card: number
}

interface Employee {
  employee_id: number
  employee_name: string
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
    design_id: '',
    employee_id: '',
    quantity: 1,
    total_amount: 0,
    order_status: 'Pending',
    order_date: new Date().toISOString().split('T')[0],
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
        supabase.from('customers').select('customer_id, customer_name'),
        supabase.from('card_designs').select('design_id, design_name, price_per_card'),
        supabase.from('employee').select('employee_id, employee_name'),
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
          .eq('order_id', parseInt(editingId))

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('orders')
          .insert([formData])

        if (error) throw error
      }

      setFormData({
        customer_id: '',
        design_id: '',
        employee_id: '',
        quantity: 1,
        total_amount: 0,
        order_status: 'Pending',
        order_date: new Date().toISOString().split('T')[0],
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
      customer_id: order.customer_id.toString(),
      design_id: order.design_id.toString(),
      employee_id: order.employee_id ? order.employee_id.toString() : '',
      quantity: order.quantity,
      total_amount: order.total_amount || 0,
      order_status: order.order_status,
      order_date: order.order_date,
    })
    setEditingId(order.order_id.toString())
    setOpen(true)
  }

  const handleDelete = async (order_id: number) => {
    if (!confirm('Are you sure?')) return

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('order_id', order_id)

      if (error) throw error
      fetchAllData()
    } catch (error) {
      console.error('Error deleting order:', error)
    }
  }

  const handleQuantityChange = (qty: number) => {
    setFormData((prev) => {
      const design = designs.find((d) => d.design_id === parseInt(prev.design_id))
      const price = design ? design.price_per_card * qty : 0
      return {
        ...prev,
        quantity: qty,
        total_amount: price,
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
                    design_id: '',
                    employee_id: '',
                    quantity: 1,
                    total_amount: 0,
                    order_status: 'Pending',
                    order_date: new Date().toISOString().split('T')[0],
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
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="design">Card Design *</Label>
                  <select
                    id="design"
                    value={formData.design_id}
                    onChange={(e) =>
                      setFormData({ ...formData, design_id: e.target.value })
                    }
                    className="w-full border border-input rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Design</option>
                    {designs.map((d) => (
                      <option key={d.design_id} value={d.design_id}>
                        {d.design_name} (Rs. {d.price_per_card})
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
                      <option key={e.employee_id} value={e.employee_id}>
                        {e.employee_name}
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
                  <Label htmlFor="total">Total Amount (Rs.)</Label>
                  <Input
                    id="total"
                    type="number"
                    value={formData.total_amount}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.order_status}
                    onChange={(e) =>
                      setFormData({ ...formData, order_status: e.target.value })
                    }
                    className="w-full border border-input rounded px-3 py-2"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Printing">In Printing</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
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
                      const customer = customers.find((c) => c.customer_id === order.customer_id)
                      const design = designs.find((d) => d.design_id === order.design_id)
                      const employee = employees.find((e) => e.employee_id === order.employee_id)

                      return (
                        <TableRow key={order.order_id}>
                          <TableCell className="font-medium">
                            {customer?.customer_name || '-'}
                          </TableCell>
                          <TableCell>{design?.design_name || '-'}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>
                            Rs. {order.total_amount?.toLocaleString()}
                          </TableCell>
                          <TableCell>{employee?.employee_name || '-'}</TableCell>
                          <TableCell>
                            {new Date(order.order_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.order_status === 'Delivered'
                                  ? 'default'
                                  : order.order_status === 'Cancelled'
                                    ? 'outline'
                                    : 'secondary'
                              }
                            >
                              {order.order_status}
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
                              onClick={() => handleDelete(order.order_id)}
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
