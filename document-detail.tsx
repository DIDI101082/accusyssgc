'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  Archive,
  Clock,
  FileText,
  History,
  MessageSquare,
  Upload,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatDateTime, formatFileSize } from '@/lib/utils'
import { STATUS_CONFIG } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import type { Document, DocumentVersion, ApprovalHistory, Profile, DocumentStatus } from '@/lib/types'

interface DocumentDetailProps {
  document: Document & {
    category: { name: string; color: string; icon: string }
    creator: { id: string; full_name: string; email: string }
    reviewer: { id: string; full_name: string } | null
    approver: { id: string; full_name: string } | null
  }
  versions: (DocumentVersion & { creator: { full_name: string } })[]
  approvalHistory: (ApprovalHistory & { performer: { full_name: string } })[]
  currentUser: Profile
}

export function DocumentDetail({
  document: doc,
  versions,
  approvalHistory,
  currentUser,
}: DocumentDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'enviar_revision' | 'aprobar' | 'rechazar' | 'obsoleto'>('aprobar')
  const [comments, setComments] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'versions' | 'history'>('info')

  const isCreator = currentUser.id === doc.creator?.id
  const isGestorOrAdmin = ['admin', 'gestor'].includes(currentUser.role)

  // Acciones posibles según estado y rol
  const canSendToReview = doc.status === 'borrador' && (isCreator || isGestorOrAdmin)
  const canApprove = doc.status === 'en_revision' && isGestorOrAdmin
  const canReject = doc.status === 'en_revision' && isGestorOrAdmin
  const canMarkObsolete = doc.status === 'aprobado' && isGestorOrAdmin

  async function handleWorkflowAction() {
    setLoading(true)
    const supabase = createClient()

    try {
      const statusMap: Record<string, DocumentStatus> = {
        enviar_revision: 'en_revision',
        aprobar: 'aprobado',
        rechazar: 'borrador',
        obsoleto: 'obsoleto',
      }

      const newStatus = statusMap[approvalAction]
      const updateData: Record<string, any> = {
        status: newStatus,
        updated_by: currentUser.id,
      }

      if (approvalAction === 'aprobar') {
        updateData.approved_by = currentUser.id
        updateData.approved_at = new Date().toISOString()
      }
      if (approvalAction === 'enviar_revision') {
        updateData.reviewed_by = null
        updateData.approved_by = null
      }

      await supabase
        .from('documents')
        .update(updateData)
        .eq('id', doc.id)

      await supabase.from('approval_history').insert({
        document_id: doc.id,
        action: approvalAction,
        from_status: doc.status,
        to_status: newStatus,
        performed_by: currentUser.id,
        comments: comments || null,
      })

      setShowApprovalModal(false)
      setComments('')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload() {
    if (!doc.file_path) return
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }

    // Registrar descarga
    await supabase.from('document_access_log').insert({
      document_id: doc.id,
      user_id: currentUser.id,
      action: 'download',
    })
  }

  function openAction(action: typeof approvalAction) {
    setApprovalAction(action)
    setShowApprovalModal(true)
  }

  const statusVariant = (status: DocumentStatus) => {
    switch (status) {
      case 'aprobado': return 'success' as const
      case 'en_revision': return 'warning' as const
      case 'obsoleto': return 'danger' as const
      default: return 'default' as const
    }
  }

  const actionLabels = {
    enviar_revision: { label: 'Enviar a Revisión', icon: Send },
    aprobar: { label: 'Aprobar', icon: CheckCircle2 },
    rechazar: { label: 'Rechazar', icon: XCircle },
    obsoleto: { label: 'Marcar como Obsoleto', icon: Archive },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/documentos')}
            className="mt-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-gray-400">{doc.code}</span>
              <Badge variant={statusVariant(doc.status)}>
                {STATUS_CONFIG[doc.status]?.label}
              </Badge>
              <span className="text-sm text-gray-400">v{doc.version_label}</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{doc.title}</h1>
            {doc.description && (
              <p className="mt-1 text-sm text-gray-500">{doc.description}</p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {doc.file_path && (
            <Button variant="secondary" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          )}
          {canSendToReview && (
            <Button onClick={() => openAction('enviar_revision')}>
              <Send className="h-4 w-4" />
              Enviar a Revisión
            </Button>
          )}
          {canApprove && (
            <Button onClick={() => openAction('aprobar')}>
              <CheckCircle2 className="h-4 w-4" />
              Aprobar
            </Button>
          )}
          {canReject && (
            <Button variant="danger" onClick={() => openAction('rechazar')}>
              <XCircle className="h-4 w-4" />
              Rechazar
            </Button>
          )}
          {canMarkObsolete && (
            <Button variant="ghost" onClick={() => openAction('obsoleto')}>
              <Archive className="h-4 w-4" />
              Obsoleto
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: 'info' as const, label: 'Información', icon: FileText },
            { id: 'versions' as const, label: 'Versiones', icon: History },
            { id: 'history' as const, label: 'Historial', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Archivo */}
            {doc.file_path ? (
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Archivo</h3>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2.5">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.file_size)} · {doc.file_type}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Sin archivo adjunto</p>
              </div>
            )}

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Etiquetas</h3>
                <div className="flex flex-wrap gap-2">
                  {doc.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notas */}
            {doc.notes && (
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Notas</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{doc.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Detalles</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Categoría</dt>
                  <dd className="mt-0.5 flex items-center gap-2 font-medium text-gray-900">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: doc.category?.color }}
                    />
                    {doc.category?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Área</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{doc.area || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Creado por</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{doc.creator?.full_name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Creado</dt>
                  <dd className="mt-0.5 text-gray-900">{formatDateTime(doc.created_at)}</dd>
                </div>
                {doc.approved_by && (
                  <div>
                    <dt className="text-gray-500">Aprobado por</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">{doc.approver?.full_name}</dd>
                  </div>
                )}
                {doc.approved_at && (
                  <div>
                    <dt className="text-gray-500">Fecha aprobación</dt>
                    <dd className="mt-0.5 text-gray-900">{formatDateTime(doc.approved_at)}</dd>
                  </div>
                )}
                {doc.effective_date && (
                  <div>
                    <dt className="text-gray-500">Vigencia</dt>
                    <dd className="mt-0.5 text-gray-900">{formatDate(doc.effective_date)}</dd>
                  </div>
                )}
                {doc.expiry_date && (
                  <div>
                    <dt className="text-gray-500">Vencimiento</dt>
                    <dd className="mt-0.5 text-gray-900">{formatDate(doc.expiry_date)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="divide-y">
            {versions.map((v: any) => (
              <div key={v.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                  v{v.version}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Versión {v.version_label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {v.creator?.full_name} · {formatDateTime(v.created_at)}
                  </p>
                  {v.change_summary && (
                    <p className="mt-1 text-sm text-gray-600">{v.change_summary}</p>
                  )}
                </div>
                {v.file_path && (
                  <span className="text-xs text-gray-400">
                    {v.file_name} ({formatFileSize(v.file_size)})
                  </span>
                )}
              </div>
            ))}
            {versions.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400">
                Sin historial de versiones
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="divide-y">
            {approvalHistory.map((h: any) => {
              const actionConfig = {
                enviar_revision: { icon: Send, color: 'text-blue-500', label: 'Enviado a revisión' },
                aprobar: { icon: CheckCircle2, color: 'text-green-500', label: 'Aprobado' },
                rechazar: { icon: XCircle, color: 'text-red-500', label: 'Rechazado' },
                obsoleto: { icon: Archive, color: 'text-gray-500', label: 'Marcado como obsoleto' },
              }
              const config = actionConfig[h.action as keyof typeof actionConfig]
              const Icon = config?.icon ?? Clock

              return (
                <div key={h.id} className="flex items-start gap-4 px-5 py-4">
                  <div className={`mt-0.5 ${config?.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {config?.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {h.performer?.full_name} · {formatDateTime(h.created_at)}
                    </p>
                    {h.comments && (
                      <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        {h.comments}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
            {approvalHistory.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400">
                Sin historial de aprobaciones
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de acción workflow */}
      <Modal
        open={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={actionLabels[approvalAction]?.label ?? 'Acción'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {approvalAction === 'enviar_revision' &&
              `Vas a enviar "${doc.title}" a revisión. Un gestor o admin podrá aprobarlo.`}
            {approvalAction === 'aprobar' &&
              `Vas a aprobar "${doc.title}". Quedará disponible para todos.`}
            {approvalAction === 'rechazar' &&
              `Vas a rechazar "${doc.title}". Volverá a estado borrador.`}
            {approvalAction === 'obsoleto' &&
              `Vas a marcar "${doc.title}" como obsoleto. Ya no estará vigente.`}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios {approvalAction === 'rechazar' ? '*' : '(opcional)'}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={
                approvalAction === 'rechazar'
                  ? 'Indicá el motivo del rechazo...'
                  : 'Agregar un comentario...'
              }
              required={approvalAction === 'rechazar'}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
              Cancelar
            </Button>
            <Button
              variant={approvalAction === 'rechazar' || approvalAction === 'obsoleto' ? 'danger' : 'primary'}
              onClick={handleWorkflowAction}
              disabled={loading || (approvalAction === 'rechazar' && !comments)}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
