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

interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: string
  status: string
  transaction_id: string
  payment_date: string
}

interface Order {
  id: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    order_id: '',
    amount: 0,
    payment_method: 'Cash',
    status: 'pending',
    transaction_id: '',
  })

  const supabase = createClient()
  const paymentMethods = ['Cash', 'EasyPaisa', 'JazzCash', 'Bank Transfer']

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [paymentsRes, ordersRes] = await Promise.all([
        supabase.from('payments').select('*').order('payment_date', { ascending: false }),
        supabase.from('orders').select('id'),
      ])

      setPayments(paymentsRes.data || [])
      setOrders(ordersRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('payments')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('payments')
          .insert([formData])

        if (error) throw error
      }

      setFormData({
        order_id: '',
        amount: 0,
        payment_method: 'Cash',
        status: 'pending',
        transaction_id: '',
      })
      setEditingId(null)
      setOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error saving payment:', error)
    }
  }

  const handleEdit = (payment: Payment) => {
    setFormData({
      order_id: payment.order_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      status: payment.status,
      transaction_id: payment.transaction_id || '',
    })
    setEditingId(payment.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAllData()
    } catch (error) {
      console.error('Error deleting payment:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({
                    order_id: '',
                    amount: 0,
                    payment_method: 'Cash',
                    status: 'pending',
                    transaction_id: '',
                  })
                }}
              >
                <Plus className="h-4 w-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Payment' : 'Add New Payment'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPayment} className="space-y-4">
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
                  <Label htmlFor="amount">Amount (Rs.) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <select
                    id="method"
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_method: e.target.value })
                    }
                    className="w-full border border-input rounded px-3 py-2"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
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
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="transaction">Transaction ID</Label>
                  <Input
                    id="transaction"
                    value={formData.transaction_id}
                    onChange={(e) =>
                      setFormData({ ...formData, transaction_id: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? 'Update' : 'Add'} Payment
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : payments.length === 0 ? (
              <p className="text-muted-foreground">No payments found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">
                          {payment.order_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>Rs. {payment.amount?.toLocaleString()}</TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === 'completed'
                                ? 'default'
                                : payment.status === 'failed'
                                  ? 'outline'
                                  : 'secondary'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transaction_id || '-'}
                        </TableCell>
                        <TableCell>
                          {payment.payment_date
                            ? new Date(payment.payment_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(payment)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleDelete(payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
