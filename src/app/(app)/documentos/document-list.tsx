'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Filter, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatFileSize } from '@/lib/utils'
import { STATUS_CONFIG } from '@/lib/types'
import type { Document, DocumentCategory, DocumentStatus, UserRole } from '@/lib/types'
import { NewDocumentModal } from './new-document-modal'

interface DocumentListProps {
  documents: (Document & { category: DocumentCategory; creator: { full_name: string } })[]
  categories: DocumentCategory[]
  userRole: UserRole
  filters: { status?: string; category?: string; search?: string }
}

export function DocumentList({ documents, categories, userRole, filters }: DocumentListProps) {
  const router = useRouter()
  const [showNewModal, setShowNewModal] = useState(false)
  const [search, setSearch] = useState(filters.search ?? '')
  const canCreate = ['admin', 'gestor', 'editor'].includes(userRole)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filters.status) params.set('status', filters.status)
    if (filters.category) params.set('category', filters.category)
    router.push(`/documentos?${params.toString()}`)
  }

  function handleFilter(key: string, value: string) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (key === 'status' && value) params.set('status', value)
    else if (filters.status) params.set('status', filters.status)
    if (key === 'category' && value) params.set('category', value)
    else if (filters.category) params.set('category', filters.category)
    router.push(`/documentos?${params.toString()}`)
  }

  const statusVariant = (status: DocumentStatus) => {
    switch (status) {
      case 'aprobado': return 'success' as const
      case 'en_revision': return 'warning' as const
      case 'obsoleto': return 'danger' as const
      default: return 'default' as const
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {documents.length} documento{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4" />
            Nuevo Documento
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, título o descripción..."
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </form>

        <select
          value={filters.status ?? ''}
          onChange={(e) => handleFilter('status', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="en_revision">En Revisión</option>
          <option value="aprobado">Aprobado</option>
          <option value="obsoleto">Obsoleto</option>
        </select>

        <select
          value={filters.category ?? ''}
          onChange={(e) => handleFilter('category', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de documentos */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Documento
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Categoría
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Versión
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Creado por
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actualizado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((doc: any) => (
              <tr
                key={doc.id}
                onClick={() => router.push(`/documentos/${doc.id}`)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        <span className="text-gray-400 mr-1.5 text-xs">{doc.code}</span>
                        {doc.title}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-gray-500 truncate max-w-md">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: doc.category?.color }}
                    />
                    <span className="text-sm text-gray-600">{doc.category?.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={statusVariant(doc.status)}>
                    {STATUS_CONFIG[doc.status as DocumentStatus]?.label}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  v{doc.version_label}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {doc.creator?.full_name ?? '-'}
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">
                  {formatDate(doc.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {documents.length === 0 && (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">Sin documentos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status || filters.category
                ? 'No se encontraron documentos con esos filtros.'
                : 'Comenzá creando tu primer documento.'}
            </p>
            {canCreate && !filters.search && (
              <Button onClick={() => setShowNewModal(true)} className="mt-4" size="sm">
                <Plus className="h-4 w-4" />
                Nuevo Documento
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal nuevo documento */}
      <NewDocumentModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        categories={categories}
      />
    </div>
  )
}
