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
import { Plus, Trash2, Edit2, AlertTriangle } from 'lucide-react'

interface Material {
  id: string
  name: string
  quantity: number
  unit: string
  reorder_level: number
  supplier: string
  cost: number
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: 'kg',
    reorder_level: 0,
    supplier: '',
    cost: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('materials')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('materials')
          .insert([formData])

        if (error) throw error
      }

      setFormData({
        name: '',
        quantity: 0,
        unit: 'kg',
        reorder_level: 0,
        supplier: '',
        cost: 0,
      })
      setEditingId(null)
      setOpen(false)
      fetchMaterials()
    } catch (error) {
      console.error('Error saving material:', error)
    }
  }

  const handleEdit = (material: Material) => {
    setFormData({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit || 'kg',
      reorder_level: material.reorder_level || 0,
      supplier: material.supplier || '',
      cost: material.cost || 0,
    })
    setEditingId(material.id)
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
    }
  }

  const isLowStock = (material: Material) => {
    return material.quantity < material.reorder_level
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Materials</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({
                    name: '',
                    quantity: 0,
                    unit: 'kg',
                    reorder_level: 0,
                    supplier: '',
                    cost: 0,
                  })
                }}
              >
                <Plus className="h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Material' : 'Add New Material'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="reorder">Reorder Level</Label>
                  <Input
                    id="reorder"
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_level: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost (Rs.)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? 'Update' : 'Add'} Material
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : materials.length === 0 ? (
              <p className="text-muted-foreground">No materials found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow
                      key={material.id}
                      className={isLowStock(material) ? 'bg-red-50' : ''}
                    >
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.quantity}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell>{material.reorder_level}</TableCell>
                      <TableCell>{material.supplier || '-'}</TableCell>
                      <TableCell>Rs. {material.cost?.toLocaleString()}</TableCell>
                      <TableCell>
                        {isLowStock(material) ? (
                          <Badge variant="outline" className="flex w-fit items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="default">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(material)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(material.id)}
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
