'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { DocumentCategory } from '@/lib/types'

interface NewDocumentModalProps {
  open: boolean
  onClose: () => void
  categories: DocumentCategory[]
}

export function NewDocumentModal({ open, onClose, categories }: NewDocumentModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    area: '',
    tags: '',
    effective_date: '',
    expiry_date: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.category_id) return

    setLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Generar código del documento
      const selectedCat = categories.find((c) => c.id === form.category_id)
      const { data: codeResult } = await supabase.rpc('generate_document_code', {
        cat_name: selectedCat?.name ?? 'Otros',
      })

      let filePath: string | null = null
      let fileName: string | null = null
      let fileSize: number | null = null
      let fileType: string | null = null

      // Subir archivo si existe
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `${user!.id}/${codeResult}_v1.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, file)

        if (!uploadError) {
          filePath = path
          fileName = file.name
          fileSize = file.size
          fileType = file.type
        }
      }

      // Crear documento
      const { data: doc, error } = await supabase
        .from('documents')
        .insert({
          code: codeResult,
          title: form.title,
          description: form.description || null,
          category_id: form.category_id,
          created_by: user!.id,
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          area: form.area || null,
          tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
          effective_date: form.effective_date || null,
          expiry_date: form.expiry_date || null,
        })
        .select('id')
        .single()

      if (error) throw error

      // Crear versión inicial
      await supabase.from('document_versions').insert({
        document_id: doc.id,
        version: 1,
        version_label: '1.0',
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        change_summary: 'Versión inicial',
        created_by: user!.id,
      })

      onClose()
      router.push(`/documentos/${doc.id}`)
      router.refresh()
    } catch (err) {
      console.error('Error creating document:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Documento" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              id="title"
              label="Título *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Procedimiento de control de documentos"
              required
            />
          </div>

          <Select
            id="category"
            label="Categoría *"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Seleccionar categoría"
            required
          />

          <Input
            id="area"
            label="Área"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            placeholder="Ej: Calidad, Producción"
          />

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Breve descripción del documento..."
            />
          </div>

          <Input
            id="tags"
            label="Etiquetas"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="iso9001, calidad, proceso (separadas por coma)"
          />

          <Input
            id="effective_date"
            label="Fecha de vigencia"
            type="date"
            value={form.effective_date}
            onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
          />

          <Input
            id="expiry_date"
            label="Fecha de vencimiento"
            type="date"
            value={form.expiry_date}
            onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
          />
        </div>

        {/* Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Archivo
          </label>
          <div className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-indigo-400 transition-colors">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {file ? file.name : 'Arrastrá un archivo o hacé clic para seleccionar'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              PDF, DOC, DOCX, XLS, XLSX hasta 50MB
            </p>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              style={{ position: 'relative' }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !form.title || !form.category_id}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear Documento
          </Button>
        </div>
      </form>
    </Modal>
  )
}
