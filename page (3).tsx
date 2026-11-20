import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/utils'

export default async function AprobacionesPage() {
  const supabase = await createClient()

  // Documentos en revisión
  const { data: pendientes } = await supabase
    .from('documents')
    .select(
      `
      id, code, title, description, status, created_at, area,
      category:document_categories(name, color),
      creator:profiles!documents_created_by_fkey(full_name, email)
    `
    )
    .eq('status', 'en_revision')
    .order('created_at', { ascending: true })

  // Últimas aprobaciones/rechazos
  const { data: recientes } = await supabase
    .from('approval_history')
    .select(
      `
      *,
      document:documents(code, title),
      performer:profiles!approval_history_performed_by_fkey(full_name)
    `
    )
    .in('action', ['aprobar', 'rechazar'])
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprobaciones</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revisá y aprobá documentos pendientes
        </p>
      </div>

      {/* Pendientes */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Pendientes de Aprobación
          </h2>
          <Badge variant="warning">{pendientes?.length ?? 0}</Badge>
        </div>

        {pendientes && pendientes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pendientes.map((doc: any) => (
              <Link
                key={doc.id}
                href={`/documentos/${doc.id}`}
                className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{doc.code}</span>
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: doc.category?.color }}
                      />
                      <span className="text-xs text-gray-500">{doc.category?.name}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>por {doc.creator?.full_name}</span>
                      <span>{formatDate(doc.created_at)}</span>
                      {doc.area && <Badge>{doc.area}</Badge>}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 ml-3" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white py-12 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">Todo al día</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay documentos pendientes de aprobación
            </p>
          </div>
        )}
      </div>

      {/* Historial reciente */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actividad Reciente
        </h2>
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="divide-y">
            {recientes?.map((h: any) => (
              <Link
                key={h.id}
                href={`/documentos/${h.document_id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                {h.action === 'aprobar' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <ClipboardCheck className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{h.performer?.full_name}</span>
                    {h.action === 'aprobar' ? ' aprobó ' : ' rechazó '}
                    <span className="text-gray-400">{h.document?.code}</span> {h.document?.title}
                  </p>
                  {h.comments && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">"{h.comments}"</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDateTime(h.created_at)}
                </span>
              </Link>
            ))}
            {(!recientes || recientes.length === 0) && (
              <div className="py-8 text-center text-sm text-gray-400">
                Sin actividad reciente
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
