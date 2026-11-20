'use client'

import { Sidebar } from './sidebar'
import type { Profile } from '@/lib/types'

interface AppLayoutProps {
  user: Profile
  children: React.ReactNode
}

export function AppLayout({ user, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
