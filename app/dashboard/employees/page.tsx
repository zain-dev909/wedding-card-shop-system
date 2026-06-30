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

interface Employee {
  employee_id: number
  employee_name: string
  contact_no: string
  position: string
  salary: number
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    employee_name: '',
    contact_no: '',
    position: '',
    salary: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('employee_id', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('employee')
          .update(formData)
          .eq('employee_id', parseInt(editingId))

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('employee')
          .insert([formData])

        if (error) throw error
      }

      setFormData({ employee_name: '', contact_no: '', position: '', salary: 0 })
      setEditingId(null)
      setOpen(false)
      fetchEmployees()
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }

  const handleEdit = (employee: Employee) => {
    setFormData({
      employee_name: employee.employee_name,
      contact_no: employee.contact_no || '',
      position: employee.position || '',
      salary: employee.salary || 0,
    })
    setEditingId(employee.employee_id.toString())
    setOpen(true)
  }

  const handleDelete = async (employee_id: number) => {
    if (!confirm('Are you sure?')) return

    try {
      const { error } = await supabase
        .from('employee')
        .delete()
        .eq('employee_id', employee_id)

      if (error) throw error
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({ employee_name: '', contact_no: '', position: '', salary: 0 })
                }}
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Employee' : 'Add New Employee'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.employee_name}
                    onChange={(e) =>
                      setFormData({ ...formData, employee_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Contact Number</Label>
                  <Input
                    id="phone"
                    value={formData.contact_no}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_no: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? 'Update' : 'Add'} Employee
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : employees.length === 0 ? (
              <p className="text-muted-foreground">No employees found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Salary (Rs.)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell className="font-medium">{employee.employee_name}</TableCell>
                      <TableCell>{employee.position || '-'}</TableCell>
                      <TableCell>{employee.contact_no || '-'}</TableCell>
                      <TableCell>Rs. {employee.salary?.toLocaleString() || '-'}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(employee.employee_id)}
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
