import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DocumentDetail } from './document-detail'

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: document } = await supabase
    .from('documents')
    .select(
      `
      *,
      category:document_categories(*),
      creator:profiles!documents_created_by_fkey(id, full_name, email),
      reviewer:profiles!documents_reviewed_by_fkey(id, full_name),
      approver:profiles!documents_approved_by_fkey(id, full_name)
    `
    )
    .eq('id', id)
    .single()

  if (!document) notFound()

  // Historial de versiones
  const { data: versions } = await supabase
    .from('document_versions')
    .select('*, creator:profiles!document_versions_created_by_fkey(full_name)')
    .eq('document_id', id)
    .order('version', { ascending: false })

  // Historial de aprobaciones
  const { data: approvalHistory } = await supabase
    .from('approval_history')
    .select('*, performer:profiles!approval_history_performed_by_fkey(full_name)')
    .eq('document_id', id)
    .order('created_at', { ascending: false })

  // Registrar acceso
  await supabase.from('document_access_log').insert({
    document_id: id,
    user_id: user!.id,
    action: 'view',
  })

  return (
    <DocumentDetail
      document={document as any}
      versions={versions ?? []}
      approvalHistory={approvalHistory ?? []}
      currentUser={profile as any}
    />
  )
}
