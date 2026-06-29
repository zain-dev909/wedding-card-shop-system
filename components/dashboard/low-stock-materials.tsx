'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface Material {
  id: string
  name: string
  quantity: number
  reorder_level: number
  unit: string
}

export function LowStockMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('materials')
          .select('id, name, quantity, reorder_level, unit')
          .lt('quantity', 'reorder_level')

        if (error) throw error
        setMaterials(data || [])
      } catch (error) {
        console.error('Error fetching materials:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Low Stock
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : materials.length === 0 ? (
          <Alert>
            <AlertDescription>
              All materials are well stocked
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <div
                key={material.id}
                className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <p className="font-medium text-sm text-foreground">
                  {material.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Stock: {material.quantity} {material.unit} (Reorder at: {material.reorder_level})
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
