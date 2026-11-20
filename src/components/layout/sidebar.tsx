'use client'

import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { Profile } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Documentos', href: '/documentos', icon: FileText },
  { name: 'Aprobaciones', href: '/aprobaciones', icon: ClipboardCheck },
  { name: 'Categorías', href: '/categorias', icon: FolderOpen },
]

const adminNav = [
  { name: 'Usuarios', href: '/usuarios', icon: Users },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
]

interface SidebarProps {
  user: Profile
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = user.role === 'admin' || user.role === 'gestor'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 flex-shrink-0">
          <Shield className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-900">Accusys</span>
            <span className="text-sm font-bold text-indigo-600"> Quality</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-indigo-600' : 'text-gray-400')} />
              {!collapsed && item.name}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Administración
                </p>
              )}
            </div>
            {adminNav.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-indigo-600' : 'text-gray-400')} />
                  {!collapsed && item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-2 flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* User */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700 flex-shrink-0">
            {getInitials(user.full_name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user.full_name}</p>
              <p className="truncate text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
