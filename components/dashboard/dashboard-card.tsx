import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardCardProps {
  title: string
  value: string | number
  loading?: boolean
  highlight?: 'default' | 'warning' | 'success'
}

export function DashboardCard({ title, value, loading, highlight = 'default' }: DashboardCardProps) {
  const highlightColors = {
    default: 'bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20',
    warning: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
    success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
  }

  return (
    <Card className={`${highlightColors[highlight]} border-2`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold text-primary">
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
