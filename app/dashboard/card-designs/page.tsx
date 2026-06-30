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
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Edit2 } from 'lucide-react'

interface CardDesign {
  design_id: number
  design_name: string
  category: string
  price_per_card: number
  description: string
}

const categories = ['Boxed', 'Acrylic', 'Floral', 'Premium']

export default function CardDesignsPage() {
  const [designs, setDesigns] = useState<CardDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    design_name: '',
    category: 'Boxed',
    price_per_card: 0,
    description: '',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchDesigns()
  }, [])

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('card_designs')
        .select('*')
        .order('design_id', { ascending: false })

      if (error) throw error
      setDesigns(data || [])
    } catch (error) {
      console.error('Error fetching designs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDesign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('card_designs')
          .update(formData)
          .eq('design_id', parseInt(editingId))

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('card_designs')
          .insert([formData])

        if (error) throw error
      }

      setFormData({ design_name: '', category: 'Boxed', price_per_card: 0, description: '' })
      setEditingId(null)
      setOpen(false)
      fetchDesigns()
    } catch (error) {
      console.error('Error saving design:', error)
    }
  }

  const handleEdit = (design: CardDesign) => {
    setFormData({
      design_name: design.design_name,
      category: design.category || 'Boxed',
      price_per_card: design.price_per_card || 0,
      description: design.description || '',
    })
    setEditingId(design.design_id.toString())
    setOpen(true)
  }

  const handleDelete = async (design_id: number) => {
    if (!confirm('Are you sure?')) return

    try {
      const { error } = await supabase
        .from('card_designs')
        .delete()
        .eq('design_id', design_id)

      if (error) throw error
      fetchDesigns()
    } catch (error) {
      console.error('Error deleting design:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Card Designs</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({ design_name: '', category: 'Boxed', price_per_card: 0, description: '' })
                }}
              >
                <Plus className="h-4 w-4" />
                Add Design
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Design' : 'Add New Design'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDesign} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.design_name}
                    onChange={(e) =>
                      setFormData({ ...formData, design_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-input rounded px-3 py-2"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="price">Price (Rs.)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price_per_card}
                    onChange={(e) =>
                      setFormData({ ...formData, price_per_card: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? 'Update' : 'Add'} Design
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : designs.length === 0 ? (
              <p className="text-muted-foreground">No designs found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price (Rs.)</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designs.map((design) => (
                    <TableRow key={design.design_id}>
                      <TableCell className="font-medium">{design.design_name}</TableCell>
                      <TableCell>{design.category}</TableCell>
                      <TableCell>{design.price_per_card?.toLocaleString()}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {design.description || '-'}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(design)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(design.design_id)}
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
