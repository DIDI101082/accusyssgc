'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Shield, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/lib/types'

const roleLabels: Record<UserRole, { label: string; variant: 'default' | 'info' | 'success' | 'warning' }> = {
  admin: { label: 'Admin', variant: 'warning' },
  gestor: { label: 'Gestor', variant: 'info' },
  editor: { label: 'Editor', variant: 'success' },
  lector: { label: 'Lector', variant: 'default' },
}

interface UsersManagerProps {
  users: Profile[]
  currentUserRole: string
}

export function UsersManager({ users, currentUserRole }: UsersManagerProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const isAdmin = currentUserRole === 'admin'

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setLoadingId(userId)
    const supabase = createClient()

    try {
      await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestioná los roles y permisos de los usuarios
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Usuario
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Área
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Rol
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Estado
              </th>
              {isAdmin && (
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700">
                      {getInitials(u.full_name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.full_name || '-'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {u.area || '-'}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={roleLabels[u.role]?.variant}>
                    {roleLabels[u.role]?.label}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={u.is_active ? 'success' : 'danger'}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                {isAdmin && (
                  <td className="px-5 py-4">
                    {loadingId === u.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="gestor">Gestor</option>
                        <option value="editor">Editor</option>
                        <option value="lector">Lector</option>
                      </select>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No hay usuarios registrados</p>
          </div>
        )}
      </div>

      {/* Referencia de roles */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-500" />
          Referencia de Roles
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="font-medium text-gray-900">Admin</p>
            <p className="text-gray-500">Acceso total. Gestiona usuarios, categorías y documentos.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Gestor</p>
            <p className="text-gray-500">Aprueba/rechaza documentos. Gestiona categorías.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Editor</p>
            <p className="text-gray-500">Crea y edita documentos. Envía a revisión.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Lector</p>
            <p className="text-gray-500">Solo lectura. Ve documentos aprobados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
