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
import { Plus, Trash2, Edit2, ExternalLink } from 'lucide-react'

interface Proof {
  id: string
  order_id: string
  proof_url: string
  status: string
  comments: string
}

interface Order {
  id: string
}

export default function ProofsPage() {
  const [proofs, setProofs] = useState<Proof[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    order_id: '',
    proof_url: '',
    status: 'pending',
    comments: '',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [proofsRes, ordersRes] = await Promise.all([
        supabase.from('proofs').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id'),
      ])

      setProofs(proofsRes.data || [])
      setOrders(ordersRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProof = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('proofs')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('proofs')
          .insert([formData])

        if (error) throw error
      }

      setFormData({
        order_id: '',
        proof_url: '',
        status: 'pending',
        comments: '',
      })
      setEditingId(null)
      setOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error saving proof:', error)
    }
  }

  const handleEdit = (proof: Proof) => {
    setFormData({
      order_id: proof.order_id,
      proof_url: proof.proof_url || '',
      status: proof.status,
      comments: proof.comments || '',
    })
    setEditingId(proof.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const { error } = await supabase
        .from('proofs')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAllData()
    } catch (error) {
      console.error('Error deleting proof:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Proofs</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({
                    order_id: '',
                    proof_url: '',
                    status: 'pending',
                    comments: '',
                  })
                }}
              >
                <Plus className="h-4 w-4" />
                Add Proof
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Proof' : 'Add New Proof'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProof} className="space-y-4">
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
                  <Label htmlFor="proof_url">Proof URL</Label>
                  <Input
                    id="proof_url"
                    type="url"
                    value={formData.proof_url}
                    onChange={(e) =>
                      setFormData({ ...formData, proof_url: e.target.value })
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
                    <option value="approved">Approved</option>
                    <option value="revision">Revision</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Input
                    id="comments"
                    value={formData.comments}
                    onChange={(e) =>
                      setFormData({ ...formData, comments: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? 'Update' : 'Add'} Proof
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : proofs.length === 0 ? (
              <p className="text-muted-foreground">No proofs found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Proof URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proofs.map((proof) => (
                    <TableRow key={proof.id}>
                      <TableCell className="font-mono text-sm">
                        {proof.order_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {proof.proof_url ? (
                          <a
                            href={proof.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            proof.status === 'approved'
                              ? 'default'
                              : proof.status === 'revision'
                                ? 'outline'
                                : 'secondary'
                          }
                        >
                          {proof.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {proof.comments || '-'}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(proof)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(proof.id)}
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
