'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, FileText, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { DocumentCategory, UserRole } from '@/lib/types'

interface CategoriesManagerProps {
  categories: DocumentCategory[]
  documentCounts: Record<string, number>
  userRole: UserRole
}

export function CategoriesManager({ categories, documentCounts, userRole }: CategoriesManagerProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' })
  const canManage = ['admin', 'gestor'].includes(userRole)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    try {
      await supabase.from('document_categories').insert({
        name: form.name,
        description: form.description || null,
        color: form.color,
        sort_order: categories.length + 1,
      })
      setShowModal(false)
      setForm({ name: '', description: '', color: '#6366f1' })
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organizá los documentos del SGC por tipo
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Nueva Categoría
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div
                className="rounded-lg p-2.5"
                style={{ backgroundColor: `${cat.color}15` }}
              >
                <FolderOpen className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                {cat.description && (
                  <p className="mt-1 text-sm text-gray-500">{cat.description}</p>
                )}
                <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-400">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{documentCounts[cat.id] ?? 0} documentos</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Categoría" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="cat-name"
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Procedimientos"
            required
          />
          <Input
            id="cat-desc"
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Breve descripción..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 w-20 cursor-pointer rounded border border-gray-300"
            />
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.name}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
