export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import {
  FileText,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { STATUS_CONFIG } from '@/lib/types'
import type { DocumentStatus } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Total de documentos y por estado
  const { data: documents } = await supabase
    .from('documents')
    .select('id, status, category_id')

  const total = documents?.length ?? 0
  const byStatus = {
    borrador: documents?.filter((d) => d.status === 'borrador').length ?? 0,
    en_revision: documents?.filter((d) => d.status === 'en_revision').length ?? 0,
    aprobado: documents?.filter((d) => d.status === 'aprobado').length ?? 0,
    obsoleto: documents?.filter((d) => d.status === 'obsoleto').length ?? 0,
  }

  // Documentos recientes
  const { data: recent } = await supabase
    .from('documents')
    .select('id, code, title, status, updated_at, category:document_categories(name, color)')
    .order('updated_at', { ascending: false })
    .limit(8)

  // Pendientes de aprobación
  const { data: pending } = await supabase
    .from('documents')
    .select('id, code, title, created_at, creator:profiles!documents_created_by_fkey(full_name)')
    .eq('status', 'en_revision')
    .order('created_at', { ascending: true })
    .limit(5)

  // Documentos por vencer (próximos 30 días)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const { data: expiring } = await supabase
    .from('documents')
    .select('id, code, title, expiry_date')
    .eq('status', 'aprobado')
    .not('expiry_date', 'is', null)
    .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: true })
    .limit(5)

  const stats = [
    {
      name: 'Total Documentos',
      value: total,
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      name: 'Aprobados',
      value: byStatus.aprobado,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      name: 'Pendientes Aprobación',
      value: byStatus.en_revision,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      name: 'Por Vencer',
      value: expiring?.length ?? 0,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen del Sistema de Gestión de Calidad
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Documentos recientes */}
        <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold text-gray-900">Documentos Recientes</h2>
            <Link
              href="/documentos"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <div className="divide-y">
            {recent?.map((doc: any) => (
              <Link
                key={doc.id}
                href={`/documentos/${doc.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: doc.category?.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    <span className="text-gray-400 mr-1.5">{doc.code}</span>
                    {doc.title}
                  </p>
                  <p className="text-xs text-gray-500">{doc.category?.name}</p>
                </div>
                <Badge
                  variant={
                    doc.status === 'aprobado'
                      ? 'success'
                      : doc.status === 'en_revision'
                      ? 'warning'
                      : doc.status === 'obsoleto'
                      ? 'danger'
                      : 'default'
                  }
                >
                  {STATUS_CONFIG[doc.status as DocumentStatus]?.label}
                </Badge>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDate(doc.updated_at)}
                </span>
              </Link>
            ))}
            {(!recent || recent.length === 0) && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No hay documentos aún
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-6">
          {/* Pendientes de aprobación */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-4">
              <ClipboardCheck className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Pendientes de Aprobación</h2>
            </div>
            <div className="divide-y">
              {pending?.map((doc: any) => (
                <Link
                  key={doc.id}
                  href={`/documentos/${doc.id}`}
                  className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    <span className="text-gray-400 mr-1">{doc.code}</span>
                    {doc.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    por {doc.creator?.full_name} · {formatDate(doc.created_at)}
                  </p>
                </Link>
              ))}
              {(!pending || pending.length === 0) && (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  Sin documentos pendientes
                </div>
              )}
            </div>
          </div>

          {/* Por vencer */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-4">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h2 className="font-semibold text-gray-900">Por Vencer</h2>
            </div>
            <div className="divide-y">
              {expiring?.map((doc: any) => (
                <Link
                  key={doc.id}
                  href={`/documentos/${doc.id}`}
                  className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    <span className="text-gray-400 mr-1">{doc.code}</span>
                    {doc.title}
                  </p>
                  <p className="mt-0.5 text-xs text-red-500">
                    Vence: {formatDate(doc.expiry_date)}
                  </p>
                </Link>
              ))}
              {(!expiring || expiring.length === 0) && (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  Sin documentos por vencer
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
