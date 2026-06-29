'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const [user, setUser] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user?.email || null)
    }

    getUser()
  }, [])

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 md:px-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Welcome back</p>
      </div>
      {user && (
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{user}</p>
        </div>
      )}
    </header>
  )
}
